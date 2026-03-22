'use client';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getIncomeStreams, createIncomeStream, updateIncomeStream, deleteIncomeStream, getTransactions, createTransaction, updateTransaction, deleteTransaction, getMonthSummary, getSpendingTrends } from '@/lib/api';
import type { IncomeStreamsSummary, Transaction, MonthSummary, TrendPoint } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CATEGORIES = ['Housing','Food & Dining','Transport','Entertainment','Healthcare','Education','Shopping','Utilities','Subscriptions','Travel','Personal Care','Other'];
const CAT_EMOJIS: Record<string,string> = { 'Housing':'🏠','Food & Dining':'🍔','Transport':'🚗','Entertainment':'🎮','Healthcare':'💊','Education':'📚','Shopping':'🛍️','Utilities':'💡','Subscriptions':'📱','Travel':'✈️','Personal Care':'💅','Other':'💰' };
const PIE_COLORS = ['#7c3aed','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4','#6366f1'];
const TS = { backgroundColor:'#1a1a24', border:'1px solid #2a2a38', borderRadius:10, fontSize:12 };
const TYPE_CFG = { active:{label:'Active',emoji:'💼',color:'#a78bfa',bg:'#1e1430',border:'#2d1f55'}, passive:{label:'Passive',emoji:'🏠',color:'#34d399',bg:'#0f2420',border:'#1a4035'}, investment:{label:'Investment',emoji:'📈',color:'#fbbf24',bg:'#241e10',border:'#4a3a18'} };

function fmt(n:number){ return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}); }
function nowMonth(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export default function MoneyPage() {
  const [month,setMonth]         = useState(nowMonth());
  const [income,setIncome]       = useState<IncomeStreamsSummary|null>(null);
  const [summary,setSummary]     = useState<MonthSummary|null>(null);
  const [txs,setTxs]             = useState<Transaction[]>([]);
  const [trends,setTrends]       = useState<TrendPoint[]>([]);
  const [showIncForm,setShowIncForm] = useState(false);
  const [showExpForm,setShowExpForm] = useState(false);
  const [incForm,setIncForm]     = useState({name:'',amount:'',stream_type:'active' as 'active'|'passive'|'investment'});
  const [expForm,setExpForm]     = useState({amount:'',category:'Food & Dining',description:'',date:new Date().toISOString().split('T')[0]});
  const [saving,setSaving]       = useState(false);
  const [editingStream,setEditingStream] = useState<number|null>(null);
  const [editStreamForm,setEditStreamForm] = useState({name:'',amount:'',stream_type:'active' as 'active'|'passive'|'investment'});
  const [editingTx,setEditingTx] = useState<number|null>(null);
  const [editTxForm,setEditTxForm] = useState({amount:'',category:'Food & Dining',description:'',date:''});
  const [customCat,setCustomCat]     = useState('');
  const [customEditCat,setCustomEditCat] = useState('');

  const load = useCallback(async()=>{
    const [i,s,t,tr] = await Promise.all([getIncomeStreams(), getMonthSummary(month), getTransactions({transaction_type:'expense',month}), getSpendingTrends(6)]);
    setIncome(i); setSummary(s); setTxs(t); setTrends(tr);
  },[month]);

  useEffect(()=>{ load(); },[load]);

  async function addIncome(e:React.FormEvent){ e.preventDefault(); setSaving(true); try{ await createIncomeStream({name:incForm.name,amount:parseFloat(incForm.amount),stream_type:incForm.stream_type}); setIncForm({name:'',amount:'',stream_type:'active'}); setShowIncForm(false); await load(); }finally{setSaving(false);} }
  async function addExpense(e:React.FormEvent){ e.preventDefault(); setSaving(true); const cat=expForm.category==='__custom__'?customCat.trim():expForm.category; if(!cat) return setSaving(false); try{ await createTransaction({amount:parseFloat(expForm.amount),category:cat,description:expForm.description||undefined,transaction_type:'expense',date:expForm.date?new Date(expForm.date).toISOString():undefined}); setExpForm({amount:'',category:'Food & Dining',description:'',date:new Date().toISOString().split('T')[0]}); setCustomCat(''); setShowExpForm(false); await load(); }finally{setSaving(false);} }
  async function saveStream(e:React.FormEvent){ e.preventDefault(); if(!editingStream) return; setSaving(true); try{ await updateIncomeStream(editingStream,{name:editStreamForm.name,amount:parseFloat(editStreamForm.amount),stream_type:editStreamForm.stream_type}); setEditingStream(null); await load(); }finally{setSaving(false);} }
  async function saveTx(e:React.FormEvent){ e.preventDefault(); if(!editingTx) return; setSaving(true); const cat=editTxForm.category==='__custom__'?customEditCat.trim():editTxForm.category; if(!cat) return setSaving(false); try{ await updateTransaction(editingTx,{amount:parseFloat(editTxForm.amount),category:cat,description:editTxForm.description||undefined,date:editTxForm.date?new Date(editTxForm.date).toISOString():undefined}); setEditingTx(null); await load(); }finally{setSaving(false);} }

  const netSavings = (income?.total_monthly??0) - (summary?.total_expenses??0);
  const pieData = summary?.by_category.map((c,i)=>({name:c.category,value:c.total,color:PIE_COLORS[i%PIE_COLORS.length]}))?? [];
  const usedCustomCats = txs.map(t=>t.category).filter(c=>!CATEGORIES.includes(c)).filter((c,i,a)=>a.indexOf(c)===i);

  return (
    <ProtectedRoute>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{marginBottom:'24px'}}>
          <h1 style={{fontSize:'20px',fontWeight:700,color:'#f0f0f5'}}>Money</h1>
          <p style={{fontSize:'13px',color:'#60607a',marginTop:'2px'}}>All your cash flows in one place</p>
        </div>

        {/* Summary bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
          {[
            {label:'Monthly Income',   value:fmt(income?.total_monthly??0),  color:'#34d399',bg:'#0f2420',border:'#1a4035'},
            {label:'Monthly Expenses', value:fmt(summary?.total_expenses??0),color:'#f87171',bg:'#241414',border:'#4a2020'},
            {label:'Net Savings',      value:fmt(netSavings),                color:netSavings>=0?'#34d399':'#f87171',bg:netSavings>=0?'#0f2420':'#241414',border:netSavings>=0?'#1a4035':'#4a2020'},
            {label:'Savings Rate',     value:income&&income.total_monthly>0?`${Math.round(netSavings/income.total_monthly*100)}%`:'—',color:'#a78bfa',bg:'#1e1430',border:'#2d1f55'},
          ].map(({label,value,color,bg,border})=>(
            <div key={label} style={{backgroundColor:bg,border:`1px solid ${border}`,borderRadius:'14px',padding:'16px'}}>
              <p style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#60607a',marginBottom:'6px'}}>{label}</p>
              <p style={{fontSize:'20px',fontWeight:700,color}}>{value}</p>
            </div>
          ))}
        </div>

        {/* Two-column grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>

          {/* LEFT: Income */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div className="card" style={{padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <div><h3 style={{fontSize:'14px',fontWeight:600,color:'#d0d0e0'}}>Income Sources</h3><p style={{fontSize:'12px',color:'#50505e',marginTop:'2px'}}>{income?.streams.length??0} streams · {fmt(income?.total_monthly??0)}/mo</p></div>
                <button onClick={()=>setShowIncForm(!showIncForm)} className={showIncForm?'btn-secondary':'btn-primary'} style={{fontSize:'12px',padding:'6px 12px'}}>{showIncForm?'✕':'+ Add'}</button>
              </div>

              {showIncForm&&(
                <form onSubmit={addIncome} style={{background:'#12121a',borderRadius:'12px',padding:'16px',marginBottom:'16px',border:'1px solid #22223a'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <input className="input" value={incForm.name} onChange={e=>setIncForm({...incForm,name:e.target.value})} required placeholder="e.g. Salary, Freelance" />
                    <input type="number" className="input" value={incForm.amount} onChange={e=>setIncForm({...incForm,amount:e.target.value})} required placeholder="Monthly amount ($)" />
                    <select className="input" value={incForm.stream_type} onChange={e=>setIncForm({...incForm,stream_type:e.target.value as typeof incForm.stream_type})}>
                      <option value="active">💼 Active (Salary, Freelance)</option>
                      <option value="passive">🏠 Passive (Rental, Royalties)</option>
                      <option value="investment">📈 Investment (Dividends)</option>
                    </select>
                    <button type="submit" disabled={saving} className="btn-primary" style={{fontSize:'13px'}}>+ Add Stream</button>
                  </div>
                </form>
              )}

              {/* Mini totals */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
                {(['active','passive','investment'] as const).map(t=>{
                  const cfg=TYPE_CFG[t]; const streams=(income?.streams??[]).filter(s=>s.stream_type===t);
                  const tot=streams.filter(s=>s.is_active).reduce((a,s)=>a+s.amount,0);
                  return <div key={t} style={{backgroundColor:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                    <p style={{fontSize:'10px',color:'#60607a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>{cfg.label}</p>
                    <p style={{fontSize:'14px',fontWeight:700,color:cfg.color,marginTop:'4px'}}>{fmt(tot)}</p>
                  </div>;
                })}
              </div>

              {/* Stream list */}
              {income?.streams.length===0&&<p style={{textAlign:'center',color:'#50505e',fontSize:'13px',padding:'20px'}}>No income streams yet.</p>}
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {(['active','passive','investment'] as const).flatMap(t=>(income?.streams??[]).filter(s=>s.stream_type===t).map(s=>{
                  const cfg=TYPE_CFG[s.stream_type as keyof typeof TYPE_CFG];
                  return(
                    <div key={s.id} style={{display:'flex',flexDirection:'column',backgroundColor:s.is_active?cfg.bg:'#12121a',border:`1px solid ${s.is_active?cfg.border:'#22223a'}`,borderRadius:'10px',opacity:s.is_active?1:0.55}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <span style={{fontSize:'18px'}}>{cfg.emoji}</span>
                          <div>
                            <p style={{fontSize:'13px',fontWeight:600,color:'#e0e0f0'}}>{s.name}</p>
                            <p style={{fontSize:'11px',color:'#50505e',textTransform:'capitalize'}}>{s.stream_type}</p>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <p style={{fontSize:'14px',fontWeight:700,color:cfg.color}}>{fmt(s.amount)}<span style={{fontSize:'10px',color:'#50505e'}}>/mo</span></p>
                          <button onClick={()=>{ updateIncomeStream(s.id,{is_active:!s.is_active}).then(load); }} style={{background:s.is_active?'rgba(16,185,129,0.1)':'#22223a',border:`1px solid ${s.is_active?'rgba(16,185,129,0.25)':'#3a3a50'}`,color:s.is_active?'#34d399':'#60607a',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',fontWeight:600}}>{s.is_active?'Active':'Paused'}</button>
                          <button onClick={()=>{ setEditingStream(s.id===editingStream?null:s.id); setEditStreamForm({name:s.name,amount:String(s.amount),stream_type:s.stream_type as typeof editStreamForm.stream_type}); }} style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',color:'#a78bfa',borderRadius:'6px',padding:'3px 7px',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                          <button onClick={()=>{ deleteIncomeStream(s.id).then(load); }} style={{background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.2)',color:'#f87171',borderRadius:'6px',padding:'3px 7px',cursor:'pointer',fontSize:'12px'}}>✕</button>
                        </div>
                      </div>
                      {editingStream===s.id&&(
                        <form onSubmit={saveStream} style={{padding:'12px',borderTop:'1px solid #22223a',display:'flex',flexDirection:'column',gap:'8px'}}>
                          <input className="input" value={editStreamForm.name} onChange={e=>setEditStreamForm({...editStreamForm,name:e.target.value})} required placeholder="Name" />
                          <input type="number" className="input" value={editStreamForm.amount} onChange={e=>setEditStreamForm({...editStreamForm,amount:e.target.value})} required placeholder="Monthly amount ($)" />
                          <select className="input" value={editStreamForm.stream_type} onChange={e=>setEditStreamForm({...editStreamForm,stream_type:e.target.value as typeof editStreamForm.stream_type})}>
                            <option value="active">💼 Active</option>
                            <option value="passive">🏠 Passive</option>
                            <option value="investment">📈 Investment</option>
                          </select>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button type="submit" disabled={saving} className="btn-primary" style={{fontSize:'12px',flex:1}}>Save</button>
                            <button type="button" onClick={()=>setEditingStream(null)} className="btn-secondary" style={{fontSize:'12px',flex:1}}>Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          {/* RIGHT: Expenses */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div className="card" style={{padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
                <div><h3 style={{fontSize:'14px',fontWeight:600,color:'#d0d0e0'}}>Expenses</h3><p style={{fontSize:'12px',color:'#50505e',marginTop:'2px'}}>{fmt(summary?.total_expenses??0)} spent · {txs.length} items</p></div>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <input type="month" className="input" style={{width:'auto',padding:'5px 10px',fontSize:'12px'}} value={month} onChange={e=>setMonth(e.target.value)} />
                  <button onClick={()=>setShowExpForm(!showExpForm)} className={showExpForm?'btn-secondary':'btn-primary'} style={{fontSize:'12px',padding:'6px 12px'}}>{showExpForm?'✕':'+ Add'}</button>
                </div>
              </div>

              {showExpForm&&(
                <form onSubmit={addExpense} style={{background:'#12121a',borderRadius:'12px',padding:'16px',marginBottom:'16px',border:'1px solid #22223a'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <input type="number" step="0.01" className="input" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} required placeholder="Amount ($)" />
                    <select className="input" value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
                      {usedCustomCats.length>0&&<optgroup label="── Custom ──">{usedCustomCats.map(c=><option key={c} value={c}>🏷️ {c}</option>)}</optgroup>}
                      <option value="__custom__">＋ New custom category…</option>
                    </select>
                    {expForm.category==='__custom__'&&<input className="input" value={customCat} onChange={e=>setCustomCat(e.target.value)} required placeholder="Category name" autoFocus />}
                    <input type="date" className="input" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} />
                    <input type="text" className="input" value={expForm.description} onChange={e=>setExpForm({...expForm,description:e.target.value})} placeholder="Description (optional)" />
                    <button type="submit" disabled={saving} className="btn-primary" style={{fontSize:'13px'}}>+ Add Expense</button>
                  </div>
                </form>
              )}

              {/* Donut chart */}
              {pieData.length>0&&(
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip contentStyle={TS} formatter={(v:number)=>[fmt(v),'']}/><Legend wrapperStyle={{fontSize:10,color:'#60607a'}}/></PieChart>
                </ResponsiveContainer>
              )}

              {/* Category bars */}
              {summary&&summary.by_category.length>0&&(
                <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  {summary.by_category.slice(0,5).map((c,i)=>{
                    const pct=summary.total_expenses>0?c.total/summary.total_expenses*100:0;
                    return(
                      <div key={c.category}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                          <span style={{color:'#c0c0d0'}}>{CAT_EMOJIS[c.category]||'💰'} {c.category}</span>
                          <span style={{color:'#80809a'}}>{fmt(c.total)} · {pct.toFixed(0)}%</span>
                        </div>
                        <div style={{width:'100%',height:'3px',backgroundColor:'#22223a',borderRadius:'2px'}}><div style={{width:`${pct}%`,height:'100%',backgroundColor:PIE_COLORS[i%PIE_COLORS.length],borderRadius:'2px'}}/></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6-month trend */}
        {trends.length>0&&(
          <div className="card" style={{marginBottom:'20px',padding:'20px'}}>
            <h3 style={{fontSize:'14px',fontWeight:600,color:'#d0d0e0',marginBottom:'4px'}}>6-Month Trend</h3>
            <p style={{fontSize:'12px',color:'#50505e',marginBottom:'16px'}}>Income vs expenses month-over-month</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends} margin={{top:5,right:5,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22223a" vertical={false}/>
                <XAxis dataKey="month" stroke="#30304a" tick={{fill:'#50505e',fontSize:11}} tickFormatter={v=>v.slice(5)}/>
                <YAxis stroke="#30304a" tick={{fill:'#50505e',fontSize:11}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <Tooltip contentStyle={TS} formatter={(v:number)=>[fmt(v),'']}/>
                <Legend wrapperStyle={{fontSize:12,color:'#60607a'}}/>
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} maxBarSize={32}/>
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} maxBarSize={32}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transaction list */}
        <div className="card" style={{padding:'20px'}}>
          <h3 style={{fontSize:'14px',fontWeight:600,color:'#d0d0e0',marginBottom:'16px'}}>Transactions · {txs.length}</h3>
          {txs.length===0?<p style={{textAlign:'center',color:'#50505e',fontSize:'13px',padding:'30px'}}>No expenses for {month}.</p>:(
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {txs.map(tx=>(
                <div key={tx.id} style={{backgroundColor:'#12121a',borderRadius:'10px',border:'1px solid #22223a'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'34px',height:'34px',borderRadius:'8px',backgroundColor:'#1e1430',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px'}}>{CAT_EMOJIS[tx.category]||'💰'}</div>
                      <div>
                        <p style={{fontSize:'13px',fontWeight:500,color:'#d0d0e0'}}>{tx.category}</p>
                        {tx.description&&<p style={{fontSize:'11px',color:'#50505e'}}>{tx.description}</p>}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{textAlign:'right'}}>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#f87171'}}>-{fmt(tx.amount)}</p>
                        <p style={{fontSize:'11px',color:'#50505e'}}>{new Date(tx.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                      </div>
                      <button onClick={()=>{ setEditingTx(tx.id===editingTx?null:tx.id); setEditTxForm({amount:String(tx.amount),category:tx.category,description:tx.description||'',date:tx.date.slice(0,10)}); }} style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',color:'#a78bfa',borderRadius:'6px',padding:'4px 7px',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                      <button onClick={()=>deleteTransaction(tx.id).then(load)} style={{background:'rgba(244,63,94,0.1)',border:'1px solid rgba(244,63,94,0.2)',color:'#f87171',borderRadius:'6px',padding:'4px 7px',cursor:'pointer',fontSize:'12px'}}>✕</button>
                    </div>
                  </div>
                  {editingTx===tx.id&&(
                    <form onSubmit={saveTx} style={{padding:'12px',borderTop:'1px solid #22223a',display:'flex',flexDirection:'column',gap:'8px'}}>
                      <input type="number" step="0.01" className="input" value={editTxForm.amount} onChange={e=>setEditTxForm({...editTxForm,amount:e.target.value})} required placeholder="Amount ($)" />
                      <select className="input" value={editTxForm.category} onChange={e=>setEditTxForm({...editTxForm,category:e.target.value})}>
                        {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
                        {usedCustomCats.length>0&&<optgroup label="── Custom ──">{usedCustomCats.map(c=><option key={c} value={c}>🏷️ {c}</option>)}</optgroup>}
                        <option value="__custom__">＋ New custom category…</option>
                      </select>
                      {editTxForm.category==='__custom__'&&<input className="input" value={customEditCat} onChange={e=>setCustomEditCat(e.target.value)} required placeholder="Category name" autoFocus />}
                      <input type="date" className="input" value={editTxForm.date} onChange={e=>setEditTxForm({...editTxForm,date:e.target.value})} />
                      <input type="text" className="input" value={editTxForm.description} onChange={e=>setEditTxForm({...editTxForm,description:e.target.value})} placeholder="Description (optional)" />
                      <div style={{display:'flex',gap:'8px'}}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{fontSize:'12px',flex:1}}>Save</button>
                        <button type="button" onClick={()=>setEditingTx(null)} className="btn-secondary" style={{fontSize:'12px',flex:1}}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
