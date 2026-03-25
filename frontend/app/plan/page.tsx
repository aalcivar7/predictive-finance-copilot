'use client';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getBudgets, createBudget, deleteBudget, getDebts, createDebt, updateDebt, deleteDebt, getBills, createBill, updateBill, deleteBill } from '@/lib/api';
import type { Budget, Debt, Bill } from '@/types';
import { useLang } from '@/lib/lang-context';

const CATS = ['Housing','Food & Dining','Transport','Entertainment','Healthcare','Education','Shopping','Utilities','Subscriptions','Travel','Personal Care','Other'];
const CAT_EMOJIS:Record<string,string> = {'Housing':'🏠','Food & Dining':'🍔','Transport':'🚗','Entertainment':'🎮','Healthcare':'💊','Education':'📚','Shopping':'🛍️','Utilities':'💡','Subscriptions':'📱','Travel':'✈️','Personal Care':'💅','Other':'💰'};
const DEBT_TYPES = [{v:'credit_card',l:'💳 Credit Card'},{v:'student_loan',l:'🎓 Student Loan'},{v:'mortgage',l:'🏠 Mortgage'},{v:'auto',l:'🚗 Auto Loan'},{v:'personal',l:'👤 Personal Loan'},{v:'other',l:'📋 Other'}];
const DEBT_COLORS:Record<string,{color:string,bg:string,border:string}> = { credit_card:{color:'#f87171',bg:'#241414',border:'#4a2020'}, student_loan:{color:'#fbbf24',bg:'#241e10',border:'#4a3a18'}, mortgage:{color:'#a78bfa',bg:'#1e1430',border:'#2d1f55'}, auto:{color:'#60a5fa',bg:'#0f1824',border:'#1a2d45'}, personal:{color:'#c0c0d0',bg:'#18181a',border:'#303040'}, other:{color:'#80809a',bg:'#14141c',border:'#252535'} };

function fmt(n:number){ return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}); }
function SectionHeader({title,subtitle,action}:{title:string;subtitle:string;action:React.ReactNode}){
  return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}><div><h2 style={{fontSize:'16px',fontWeight:700,color:'#f0f0f5'}}>{title}</h2><p style={{fontSize:'12px',color:'#60607a',marginTop:'2px'}}>{subtitle}</p></div>{action}</div>);
}

export default function PlanPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<'budget'|'debt'|'bills'>('budget');
  const [budgets,setBudgets] = useState<Budget[]>([]);
  const [debts,setDebts]     = useState<Debt[]>([]);
  const [bills,setBills]     = useState<Bill[]>([]);
  const [showBF,setShowBF]   = useState(false);
  const [showDF,setShowDF]   = useState(false);
  const [showBiF,setShowBiF] = useState(false);
  const [bForm,setBForm]     = useState({category:CATS[0],limit_amount:''});
  const [dForm,setDForm]     = useState({name:'',debt_type:'credit_card',current_balance:'',interest_rate:'',minimum_payment:''});
  const [biForm,setBiForm]   = useState({name:'',amount:'',due_day:'',category:'Subscriptions',is_active:true});
  const [saving,setSaving]   = useState(false);
  const [editDebt,setEditDebt] = useState<{id:number;balance:string}|null>(null);

  const load = useCallback(async()=>{ const [b,d,bi]=await Promise.all([getBudgets(),getDebts(),getBills()]); setBudgets(b);setDebts(d);setBills(bi); },[]);
  useEffect(()=>{ load(); },[load]);

  async function addBudget(e:React.FormEvent){ e.preventDefault(); setSaving(true); try{ await createBudget({category:bForm.category,limit_amount:parseFloat(bForm.limit_amount)}); setBForm({category:CATS[0],limit_amount:''}); setShowBF(false); await load(); }finally{setSaving(false);} }
  async function addDebt(e:React.FormEvent){ e.preventDefault(); setSaving(true); try{ await createDebt({name:dForm.name,debt_type:dForm.debt_type,current_balance:parseFloat(dForm.current_balance),interest_rate:parseFloat(dForm.interest_rate),minimum_payment:parseFloat(dForm.minimum_payment)}); setDForm({name:'',debt_type:'credit_card',current_balance:'',interest_rate:'',minimum_payment:''}); setShowDF(false); await load(); }finally{setSaving(false);} }
  async function addBill(e:React.FormEvent){ e.preventDefault(); setSaving(true); try{ await createBill({name:biForm.name,amount:parseFloat(biForm.amount),due_day:parseInt(biForm.due_day),category:biForm.category,is_active:biForm.is_active}); setBiForm({name:'',amount:'',due_day:'',category:'Subscriptions',is_active:true}); setShowBiF(false); await load(); }finally{setSaving(false);} }
  async function saveBalance(){ if(!editDebt) return; setSaving(true); try{ await updateDebt(editDebt.id,{current_balance:parseFloat(editDebt.balance)}); setEditDebt(null); await load(); }finally{setSaving(false);} }

  const totalDebt   = debts.reduce((a,d)=>a+d.current_balance,0);
  const totalMinPay = debts.reduce((a,d)=>a+d.minimum_payment,0);
  const totalBills  = bills.filter(b=>b.is_active).reduce((a,b)=>a+b.amount,0);
  const usedCats    = budgets.map(b=>b.category);

  const TAB_BTN = (tabKey:typeof tab,label:string) => (
    <button onClick={()=>setTab(tabKey)} style={{padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:600,border:'none',cursor:'pointer',transition:'all 0.15s',backgroundColor:tab===tabKey?'#7c3aed':' transparent',color:tab===tabKey?'#fff':'#60607a',boxShadow:tab===tabKey?'0 4px 12px rgba(124,58,237,0.3)':'none'}}>{label}</button>
  );

  return (
    <ProtectedRoute>
      <div style={{maxWidth:'960px',margin:'0 auto'}}>
        <div style={{marginBottom:'24px'}}>
          <h1 style={{fontSize:'20px',fontWeight:700,color:'#f0f0f5'}}>{t('plan.title')}</h1>
          <p style={{fontSize:'13px',color:'#60607a',marginTop:'2px'}}>{t('plan.subtitle')}</p>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',gap:'6px',marginBottom:'24px',background:'#13131c',borderRadius:'12px',padding:'6px',width:'fit-content'}}>
          {TAB_BTN('budget', t('plan.tabBudget'))}
          {TAB_BTN('debt', `${t('plan.tabDebt')}${debts.length>0?` · ${debts.length}`:''}`)}
          {TAB_BTN('bills', `${t('plan.tabBills')}${bills.length>0?` · ${bills.length}`:''}`)})
        </div>

        {/* ── BUDGET ─────────────────────────────────────── */}
        {tab==='budget'&&(
          <div>
            <SectionHeader title={t('plan.budgetTitle')} subtitle={t('plan.budgetSubtitle')} action={
              <button onClick={()=>setShowBF(!showBF)} className={showBF?'btn-secondary':'btn-primary'}>{showBF?t('plan.cancelBtn'):t('plan.addBudget')}</button>
            }/>
            {showBF&&(
              <form onSubmit={addBudget} className="card" style={{marginBottom:'20px',padding:'20px',display:'flex',gap:'12px',alignItems:'flex-end',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:'160px'}}>
                  <label className="label">{t('plan.category')}</label>
                  <select className="input" value={bForm.category} onChange={e=>setBForm({...bForm,category:e.target.value})}>
                    {CATS.filter(c=>!usedCats.includes(c)).map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
                  </select>
                </div>
                <div style={{flex:1,minWidth:'140px'}}>
                  <label className="label">{t('plan.monthlyLimit')}</label>
                  <input type="number" min="1" className="input" value={bForm.limit_amount} onChange={e=>setBForm({...bForm,limit_amount:e.target.value})} required placeholder="500" />
                </div>
                <button type="submit" disabled={saving} className="btn-primary">{t('plan.setBudget')}</button>
              </form>
            )}
            {budgets.length===0&&!showBF&&(
              <div className="card" style={{textAlign:'center',padding:'50px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>📊</div>
                <p style={{color:'#c0c0d0',fontWeight:600,marginBottom:'6px'}}>{t('plan.noBudgets')}</p>
                <p style={{color:'#50505e',fontSize:'13px',marginBottom:'18px'}}>{t('plan.noBudgetsHint')}</p>
                <button onClick={()=>setShowBF(true)} className="btn-primary">{t('plan.addFirstBudget')}</button>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px'}}>
              {budgets.map(b=>{
                const pct=b.pct_used; const over=pct>100; const warn=pct>=80;
                const barColor=over?'#f43f5e':warn?'#f59e0b':'#10b981';
                return(
                  <div key={b.id} className="card" style={{padding:'18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                      <div>
                        <p style={{fontSize:'15px',fontWeight:600,color:'#e0e0f0'}}>{CAT_EMOJIS[b.category]||'💰'} {b.category}</p>
                        <p style={{fontSize:'12px',color:'#50505e',marginTop:'2px'}}>{fmt(b.limit_amount)}/mo limit</p>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'13px',fontWeight:700,color:barColor}}>{pct.toFixed(0)}%</span>
                        <button onClick={()=>deleteBudget(b.id).then(load)} style={{background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.2)',color:'#f87171',borderRadius:'6px',padding:'3px 7px',cursor:'pointer',fontSize:'12px'}}>✕</button>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#80809a',marginBottom:'6px'}}>
                      <span>{t('plan.spent')} <strong style={{color:'#d0d0e0'}}>{fmt(b.spent_this_month)}</strong></span>
                      <span style={{color:over?'#f87171':b.remaining>0?'#34d399':'#f87171'}}>{over?`${t('plan.overBy')} ${fmt(Math.abs(b.remaining))}`:`${fmt(b.remaining)} ${t('plan.left')}`}</span>
                    </div>
                    <div style={{width:'100%',height:'6px',backgroundColor:'#22223a',borderRadius:'4px',overflow:'hidden'}}>
                      <div style={{width:`${Math.min(pct,100)}%`,height:'100%',backgroundColor:barColor,borderRadius:'4px',transition:'width 0.5s'}}/>
                    </div>
                    {over&&<p style={{fontSize:'11px',color:'#f87171',marginTop:'6px'}}>{t('plan.overBudgetMsg')}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DEBT ────────────────────────────────────────── */}
        {tab==='debt'&&(
          <div>
            <SectionHeader title={t('plan.debtTitle')} subtitle={t('plan.debtSubtitle')} action={
              <button onClick={()=>setShowDF(!showDF)} className={showDF?'btn-secondary':'btn-primary'}>{showDF?t('plan.cancelBtn'):t('plan.addDebt')}</button>
            }/>
            {debts.length>0&&(
              <div className="grid-3" style={{marginBottom:'20px'}}>
                {[{label:t('plan.totalDebt'),value:fmt(totalDebt),color:'#f87171',bg:'#241414',border:'#4a2020'},{label:t('plan.minPayments'),value:fmt(totalMinPay),color:'#fbbf24',bg:'#241e10',border:'#4a3a18'},{label:t('plan.debtCount'),value:String(debts.length),color:'#a78bfa',bg:'#1e1430',border:'#2d1f55'}].map(({label,value,color,bg,border})=>(
                  <div key={label} style={{backgroundColor:bg,border:`1px solid ${border}`,borderRadius:'14px',padding:'16px'}}>
                    <p style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#60607a',marginBottom:'6px'}}>{label}</p>
                    <p style={{fontSize:'20px',fontWeight:700,color}}>{value}</p>
                  </div>
                ))}
              </div>
            )}
            {showDF&&(
              <form onSubmit={addDebt} className="card" style={{marginBottom:'20px',padding:'20px'}}>
                <h3 style={{fontSize:'14px',fontWeight:600,color:'#f0f0f5',marginBottom:'14px'}}>{t('plan.newDebt')}</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px',marginBottom:'16px'}}>
                  <div><label className="label">{t('plan.name')}</label><input className="input" value={dForm.name} onChange={e=>setDForm({...dForm,name:e.target.value})} required placeholder="Chase Sapphire"/></div>
                  <div><label className="label">{t('plan.type')}</label><select className="input" value={dForm.debt_type} onChange={e=>setDForm({...dForm,debt_type:e.target.value})}>{DEBT_TYPES.map(dt=><option key={dt.v} value={dt.v}>{dt.l}</option>)}</select></div>
                  <div><label className="label">{t('plan.balance')}</label><input type="number" step="0.01" className="input" value={dForm.current_balance} onChange={e=>setDForm({...dForm,current_balance:e.target.value})} required placeholder="5000"/></div>
                  <div><label className="label">{t('plan.interestRate')}</label><input type="number" step="0.01" className="input" value={dForm.interest_rate} onChange={e=>setDForm({...dForm,interest_rate:e.target.value})} required placeholder="21.99"/></div>
                  <div><label className="label">{t('plan.minPayment')}</label><input type="number" step="0.01" className="input" value={dForm.minimum_payment} onChange={e=>setDForm({...dForm,minimum_payment:e.target.value})} required placeholder="150"/></div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary">{t('plan.addDebt')}</button>
              </form>
            )}
            {debts.length===0&&!showDF&&(
              <div className="card" style={{textAlign:'center',padding:'50px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🎉</div>
                <p style={{color:'#34d399',fontWeight:600,marginBottom:'6px'}}>{t('plan.debtFree')}</p>
                <p style={{color:'#50505e',fontSize:'13px',marginBottom:'18px'}}>{t('plan.debtFreeHint')}</p>
                <button onClick={()=>setShowDF(true)} className="btn-primary">{t('plan.addDebt')}</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {debts.map(d=>{
                const cfg=DEBT_COLORS[d.debt_type]||DEBT_COLORS.other;
                const typeLabel=DEBT_TYPES.find(t=>t.v===d.debt_type)?.l||d.debt_type;
                return(
                  <div key={d.id} className="card" style={{padding:'20px',borderColor:cfg.border,backgroundColor:cfg.bg}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
                      <div>
                        <p style={{fontSize:'15px',fontWeight:600,color:'#e0e0f0'}}>{d.name}</p>
                        <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'20px',backgroundColor:'rgba(255,255,255,0.08)',color:cfg.color}}>{typeLabel}</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        {editDebt?.id===d.id?(
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            <input type="number" className="input" style={{width:'120px',padding:'6px 10px',fontSize:'13px'}} value={editDebt.balance} onChange={e=>setEditDebt({...editDebt,balance:e.target.value})}/>
                            <button onClick={saveBalance} className="btn-primary" style={{fontSize:'12px',padding:'6px 10px'}}>Save</button>
                            <button onClick={()=>setEditDebt(null)} className="btn-secondary" style={{fontSize:'12px',padding:'6px 10px'}}>✕</button>
                          </div>
                        ):(
                          <button onClick={()=>setEditDebt({id:d.id,balance:String(d.current_balance)})} style={{background:'none',border:'none',cursor:'pointer',color:cfg.color}}>
                            <p style={{fontSize:'22px',fontWeight:700}}>{fmt(d.current_balance)}</p>
                            <p style={{fontSize:'11px',color:'#60607a',marginTop:'2px'}}>click to update</p>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid-3" style={{marginBottom:'14px'}}>
                      {[{l:t('plan.interestRateLabel'),v:`${(d.interest_rate*100).toFixed(2)}%`},{l:t('plan.minPaymentLabel'),v:fmt(d.minimum_payment)+t('common.mo')},{l:t('plan.payoffLabel'),v:d.months_to_payoff?`~${d.months_to_payoff} ${t('common.months')}`:t('plan.unpayable')}].map(({l,v})=>(
                        <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:'8px',padding:'10px'}}>
                          <p style={{fontSize:'10px',color:'#60607a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>{l}</p>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#d0d0e0',marginTop:'4px'}}>{v}</p>
                        </div>
                      ))}
                    </div>
                    {d.total_interest!=null&&<p style={{fontSize:'12px',color:'#80809a'}}>{t('plan.totalInterest')} <strong style={{color:'#f87171'}}>{fmt(d.total_interest)}</strong></p>}
                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:'12px'}}>
                      <button onClick={()=>deleteDebt(d.id).then(load)} style={{background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.2)',color:'#f87171',borderRadius:'6px',padding:'5px 12px',cursor:'pointer',fontSize:'12px'}}>{t('plan.deleteBtn')}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BILLS ───────────────────────────────────────── */}
        {tab==='bills'&&(
          <div>
            <SectionHeader title={t('plan.billsTitle')} subtitle={t('plan.billsSubtitle')} action={
              <button onClick={()=>setShowBiF(!showBiF)} className={showBiF?'btn-secondary':'btn-primary'}>{showBiF?t('plan.cancelBtn'):t('plan.addBill')}</button>
            }/>
            {bills.length>0&&(
              <div className="grid-2" style={{marginBottom:'20px'}}>
                {[{label:t('plan.activeBillsTotal'),value:fmt(totalBills),color:'#a78bfa',bg:'#1e1430',border:'#2d1f55'},{label:t('plan.activeBillsCount'),value:String(bills.filter(b=>b.is_active).length),color:'#34d399',bg:'#0f2420',border:'#1a4035'}].map(({label,value,color,bg,border})=>(
                  <div key={label} style={{backgroundColor:bg,border:`1px solid ${border}`,borderRadius:'14px',padding:'16px'}}>
                    <p style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#60607a',marginBottom:'6px'}}>{label}</p>
                    <p style={{fontSize:'20px',fontWeight:700,color}}>{value}</p>
                  </div>
                ))}
              </div>
            )}
            {showBiF&&(
              <form onSubmit={addBill} className="card" style={{marginBottom:'20px',padding:'20px'}}>
                <h3 style={{fontSize:'14px',fontWeight:600,color:'#f0f0f5',marginBottom:'14px'}}>{t('plan.newBill')}</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px',marginBottom:'16px'}}>
                  <div><label className="label">{t('plan.name')}</label><input className="input" value={biForm.name} onChange={e=>setBiForm({...biForm,name:e.target.value})} required placeholder="Netflix"/></div>
                  <div><label className="label">{t('plan.amount')}</label><input type="number" step="0.01" className="input" value={biForm.amount} onChange={e=>setBiForm({...biForm,amount:e.target.value})} required placeholder="15.99"/></div>
                  <div><label className="label">{t('plan.dueDay')}</label><input type="number" min="1" max="31" className="input" value={biForm.due_day} onChange={e=>setBiForm({...biForm,due_day:e.target.value})} required placeholder="15"/></div>
                  <div><label className="label">{t('plan.category')}</label><select className="input" value={biForm.category} onChange={e=>setBiForm({...biForm,category:e.target.value})}>{CATS.map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}</select></div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary">{t('plan.addBill')}</button>
              </form>
            )}
            {bills.length===0&&!showBiF&&(
              <div className="card" style={{textAlign:'center',padding:'50px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🧾</div>
                <p style={{color:'#c0c0d0',fontWeight:600,marginBottom:'6px'}}>{t('plan.noBills')}</p>
                <p style={{color:'#50505e',fontSize:'13px',marginBottom:'18px'}}>{t('plan.noBillsHint')}</p>
                <button onClick={()=>setShowBiF(true)} className="btn-primary">{t('plan.addFirstBill')}</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {bills.sort((a,b)=>a.due_day-b.due_day).map(bill=>{
                const urgent=bill.is_active&&bill.days_until_due<=3;
                return(
                  <div key={bill.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',backgroundColor:bill.is_active?'#1a1a24':'#12121a',border:`1px solid ${urgent?'rgba(244,63,94,0.3)':'#2a2a38'}`,borderRadius:'12px',opacity:bill.is_active?1:0.55}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'8px',backgroundColor:'#22223a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{CAT_EMOJIS[bill.category]||'🧾'}</div>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <p style={{fontSize:'14px',fontWeight:600,color:'#e0e0f0'}}>{bill.name}</p>
                          {urgent&&<span style={{fontSize:'10px',fontWeight:700,color:'#f87171',background:'rgba(244,63,94,0.12)',padding:'2px 7px',borderRadius:'20px'}}>{t('plan.dueSoon')}</span>}
                        </div>
                        <p style={{fontSize:'12px',color:'#50505e',marginTop:'2px'}}>Due on the {bill.due_day}{bill.due_day===1?'st':bill.due_day===2?'nd':bill.due_day===3?'rd':'th'} · {bill.days_until_due} days</p>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <p style={{fontSize:'15px',fontWeight:700,color:bill.is_active?'#a78bfa':'#50505e'}}>{fmt(bill.amount)}<span style={{fontSize:'11px',color:'#50505e'}}>/mo</span></p>
                      <button onClick={()=>updateBill(bill.id,{is_active:!bill.is_active}).then(load)} style={{background:bill.is_active?'rgba(16,185,129,0.1)':'#22223a',border:`1px solid ${bill.is_active?'rgba(16,185,129,0.25)':'#3a3a50'}`,color:bill.is_active?'#34d399':'#60607a',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontWeight:600}}>{bill.is_active?t('plan.activeLabel'):t('plan.pausedLabel')}</button>
                      <button onClick={()=>deleteBill(bill.id).then(load)} style={{background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.2)',color:'#f87171',borderRadius:'6px',padding:'4px 8px',cursor:'pointer',fontSize:'12px'}}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
