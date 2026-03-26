import type { MonthSummary, IncomeStreamsSummary, Transaction, DashboardData, HealthScore, Goal, Budget, User } from '@/types';

export type ExportData = {
  month: string;
  summary: MonthSummary | null;
  income: IncomeStreamsSummary | null;
  transactions: Transaction[];
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { month, summary, income, transactions } = data;
  const doc = new jsPDF();
  const netSavings = (income?.total_monthly ?? 0) - (summary?.total_expenses ?? 0);
  const savingsRate =
    income && income.total_monthly > 0 ? Math.round((netSavings / income.total_monthly) * 100) : 0;

  // Header banner
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 220, 26, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('FinCopilot', 14, 13);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Monthly Summary — ${month}`, 14, 21);
  doc.setTextColor(0, 0, 0);

  // Summary table
  autoTable(doc, {
    startY: 32,
    head: [['Metric', 'Value']],
    body: [
      ['Monthly Income', fmtCurrency(income?.total_monthly ?? 0)],
      ['Monthly Expenses', fmtCurrency(summary?.total_expenses ?? 0)],
      ['Net Savings', fmtCurrency(netSavings)],
      ['Savings Rate', `${savingsRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 240, 255] },
    styles: { fontSize: 11 },
  });

  let y = (doc as any).lastAutoTable.finalY + 14;

  // Expenses by Category
  if (summary && summary.by_category.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 30, 100);
    doc.text('Expenses by Category', 14, y);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y + 4,
      head: [['Category', 'Amount', '% of Total']],
      body: summary.by_category.map((c) => [
        c.category,
        fmtCurrency(c.total),
        summary.total_expenses > 0
          ? `${((c.total / summary.total_expenses) * 100).toFixed(1)}%`
          : '0%',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 240, 255] },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // Income Streams
  if (income && income.streams.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 100, 70);
    doc.text('Income Streams', 14, y);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y + 4,
      head: [['Name', 'Type', 'Monthly Amount', 'Status']],
      body: income.streams.map((s) => [
        s.name,
        s.stream_type,
        fmtCurrency(s.amount),
        s.is_active ? 'Active' : 'Paused',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 255, 248] },
      styles: { fontSize: 10 },
    });
  }

  // Transactions (new page)
  if (transactions.length > 0) {
    doc.addPage();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 220, 20, 'F');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Transactions — ${month} (${transactions.length})`, 14, 13);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 26,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tx.category,
        tx.description || '—',
        fmtCurrency(tx.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 240, 255] },
      styles: { fontSize: 9 },
    });
  }

  doc.save(`FinCopilot-${month}.pdf`);
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const XLSX = await import('xlsx');

  const { month, summary, income, transactions } = data;
  const wb = XLSX.utils.book_new();

  const netSavings = (income?.total_monthly ?? 0) - (summary?.total_expenses ?? 0);
  const savingsRate =
    income && income.total_monthly > 0 ? Math.round((netSavings / income.total_monthly) * 100) : 0;

  // Sheet 1: Summary
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['FinCopilot Monthly Summary', '', month],
    [],
    ['Metric', 'Value'],
    ['Monthly Income', income?.total_monthly ?? 0],
    ['Monthly Expenses', summary?.total_expenses ?? 0],
    ['Net Savings', netSavings],
    ['Savings Rate', `${savingsRate}%`],
    [],
    ['Generated', new Date().toLocaleDateString()],
  ]);
  ws1['!cols'] = [{ wch: 26 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Sheet 2: By Category
  if (summary && summary.by_category.length > 0) {
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Category', 'Amount', '% of Total'],
      ...summary.by_category.map((c) => [
        c.category,
        c.total,
        summary.total_expenses > 0
          ? parseFloat(((c.total / summary.total_expenses) * 100).toFixed(1))
          : 0,
      ]),
      [],
      ['TOTAL', summary.total_expenses, 100],
    ]);
    ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'By Category');
  }

  // Sheet 3: Transactions
  if (transactions.length > 0) {
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Date', 'Category', 'Description', 'Amount'],
      ...transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tx.category,
        tx.description || '',
        tx.amount,
      ]),
    ]);
    ws3['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Transactions');
  }

  // Sheet 4: Income Streams
  if (income && income.streams.length > 0) {
    const ws4 = XLSX.utils.aoa_to_sheet([
      ['Name', 'Type', 'Monthly Amount', 'Status'],
      ...income.streams.map((s) => [s.name, s.stream_type, s.amount, s.is_active ? 'Active' : 'Paused']),
      [],
      ['TOTAL MONTHLY', income.total_monthly],
    ]);
    ws4['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Income Streams');
  }

  XLSX.writeFile(wb, `FinCopilot-${month}.xlsx`);
}

// ── Dashboard Comprehensive Report ─────────────────────────────────────────────

export type DashboardReportData = {
  user: User | null;
  data: DashboardData;
  health: HealthScore | null;
  goals: Goal[];
  budgets: Budget[];
  recent: Transaction[];
  summary: MonthSummary | null;
};

function generateInsights(d: DashboardData, health: HealthScore | null, goals: Goal[], budgets: Budget[]): { icon: string; title: string; message: string }[] {
  const insights: { icon: string; title: string; message: string }[] = [];

  if (d.cashflow < 0)
    insights.push({ icon: '🚨', title: 'Negative Cashflow', message: `Your expenses exceed income by ${fmtCurrency(Math.abs(d.cashflow))}/mo. Review discretionary spending immediately.` });
  else if (d.cashflow > 0)
    insights.push({ icon: '✅', title: 'Positive Cashflow', message: `You have ${fmtCurrency(d.cashflow)}/mo surplus. Consider directing it toward savings or investments.` });

  if (d.savings_rate < 10)
    insights.push({ icon: '⚠️', title: 'Low Savings Rate', message: `Your savings rate is ${d.savings_rate}%. Financial advisors recommend 20%+. Try automating transfers on payday.` });
  else if (d.savings_rate >= 20)
    insights.push({ icon: '🌟', title: 'Excellent Savings Rate', message: `${d.savings_rate}% savings rate — you're ahead of most people. Keep compounding!` });
  else
    insights.push({ icon: '💡', title: 'Good Savings Rate', message: `${d.savings_rate}% is solid. Pushing toward 20% would significantly accelerate wealth building.` });

  const overBudget = budgets.filter(b => b.pct_used > 100);
  if (overBudget.length > 0)
    insights.push({ icon: '📛', title: 'Over-Budget Categories', message: `${overBudget.map(b => b.category).join(', ')} exceeded this month's limits. Set stricter caps or adjust allocations.` });

  if (health) {
    if (health.score >= 80)
      insights.push({ icon: '💎', title: 'Strong Financial Health', message: `Score: ${health.score}/100 (${health.label}). You're managing all key financial pillars well.` });
    else if (health.score < 50)
      insights.push({ icon: '🔴', title: 'Financial Health Needs Attention', message: `Score: ${health.score}/100. Focus on the lowest-scoring areas to improve overall stability.` });

    if (health.emergency_score < 15)
      insights.push({ icon: '🆘', title: 'Build Emergency Fund', message: 'Emergency fund coverage is below 3 months. Aim for 3–6 months of expenses as a safety net.' });

    if (health.debt_score < 10)
      insights.push({ icon: '💳', title: 'High Debt Load', message: 'Debt-to-income ratio is elevated. Prioritize paying down high-interest debt using the avalanche or snowball method.' });
  }

  const activeGoals = goals.filter(g => !g.is_completed);
  if (activeGoals.length === 0)
    insights.push({ icon: '🎯', title: 'Set Financial Goals', message: 'No active goals found. Setting specific goals dramatically improves financial outcomes.' });
  else {
    const onTrack = activeGoals.filter(g => g.progress_pct >= 50);
    insights.push({ icon: '🏆', title: `Goals Progress`, message: `${onTrack.length}/${activeGoals.length} active goals are 50%+ complete. Keep going!` });
  }

  if (d.net_worth > 0 && d.monthly_savings > 0)
    insights.push({ icon: '📈', title: '10-Year Outlook', message: `At your current savings rate, projections show ~${fmtCurrency(d.projections[9]?.net_worth ?? 0)} net worth in 10 years.` });

  return insights;
}

export async function exportDashboardPDF(data: DashboardReportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { user, data: d, health, goals, budgets, recent, summary } = data;
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const name = user?.full_name ?? 'User';

  // Cover banner
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 220, 32, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('FinCopilot', 14, 14);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Comprehensive Financial Report — ${name}`, 14, 22);
  doc.setFontSize(9);
  doc.text(`Generated ${today}`, 14, 29);
  doc.setTextColor(0, 0, 0);

  let y = 40;

  // ── Financial Overview ──
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 30, 100);
  doc.text('Financial Overview', 14, y); doc.setTextColor(0, 0, 0); y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Status']],
    body: [
      ['Net Worth', fmtCurrency(d.net_worth), ''],
      ['Monthly Income', fmtCurrency(d.monthly_income), ''],
      ['Monthly Expenses', fmtCurrency(d.monthly_expenses), ''],
      ['Monthly Savings', fmtCurrency(d.monthly_savings), ''],
      ['Savings Rate', `${d.savings_rate}%`, d.savings_rate >= 20 ? '✅ Excellent' : d.savings_rate >= 10 ? '⚠️ Fair' : '🔴 Low'],
      ['Monthly Cashflow', fmtCurrency(d.cashflow), d.cashflow >= 0 ? '✅ Positive' : '🔴 Negative'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 240, 255] },
    styles: { fontSize: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Health Score ──
  if (health) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 30, 100);
    doc.text(`Financial Health Score: ${health.score}/100 (${health.label})`, 14, y);
    doc.setTextColor(0, 0, 0); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Pillar', 'Score (out of 25)']],
      body: [
        ['Savings Rate', health.savings_score.toFixed(1)],
        ['Debt Management', health.debt_score.toFixed(1)],
        ['Emergency Fund', health.emergency_score.toFixed(1)],
        ['Budget Adherence', health.budget_score.toFixed(1)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 255] },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Budget Status ──
  if (budgets.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 30, 100);
    doc.text('Budget Status', 14, y); doc.setTextColor(0, 0, 0); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Limit', 'Spent', '% Used', 'Status']],
      body: budgets.map(b => [
        b.category,
        fmtCurrency(b.limit_amount),
        fmtCurrency(b.spent_this_month),
        `${b.pct_used.toFixed(0)}%`,
        b.pct_used > 100 ? '🔴 Over' : b.pct_used >= 80 ? '⚠️ Near' : '✅ OK',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 255, 248] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Goals ──
  const activeGoals = goals.filter(g => !g.is_completed);
  if (activeGoals.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 30, 100);
    doc.text('Goals Progress', 14, y); doc.setTextColor(0, 0, 0); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Goal', 'Target', 'Current', 'Progress', 'ETA']],
      body: activeGoals.map(g => [
        g.name,
        fmtCurrency(g.target_amount),
        fmtCurrency(g.current_amount),
        `${g.progress_pct.toFixed(0)}%`,
        g.months_to_goal ? `${g.months_to_goal} mo` : '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 179, 8], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 252, 235] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Insights & Recommendations (new page) ──
  doc.addPage();
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 220, 22, 'F');
  doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
  doc.text('Insights & Recommendations', 14, 14);
  doc.setTextColor(0, 0, 0);
  y = 30;

  const insights = generateInsights(d, health, goals, budgets);
  for (const ins of insights) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 30, 100);
    doc.text(`${ins.icon}  ${ins.title}`, 14, y);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(ins.message, 180);
    doc.text(lines, 14, y + 5);
    y += 6 + lines.length * 4.5 + 4;
    doc.setDrawColor(220, 210, 240);
    doc.line(14, y - 2, 196, y - 2);
  }

  // ── Recent Transactions ──
  if (recent.length > 0) {
    doc.addPage();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 220, 22, 'F');
    doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 14, 14);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 26,
      head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
      body: recent.map(tx => [
        new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tx.category,
        tx.description || '—',
        tx.transaction_type,
        fmtCurrency(tx.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 240, 255] },
      styles: { fontSize: 9 },
    });
  }

  // ── 10-Year Projection ──
  if (d.projections.length > 0) {
    doc.addPage();
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 220, 22, 'F');
    doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('10-Year Wealth Projection', 14, 14);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 26,
      head: [['Year', 'Projected Net Worth', 'Conservative (Low)', 'Optimistic (High)']],
      body: d.projections.map(p => [
        `Year ${p.year}`,
        fmtCurrency(p.net_worth),
        fmtCurrency(p.low),
        fmtCurrency(p.high),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 255] },
      styles: { fontSize: 10 },
    });
  }

  doc.save(`FinCopilot-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportDashboardExcel(data: DashboardReportData): Promise<void> {
  const XLSX = await import('xlsx');
  const { user, data: d, health, goals, budgets, recent, summary } = data;
  const today = new Date().toLocaleDateString();
  const name = user?.full_name ?? 'User';
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['FinCopilot Comprehensive Report', '', name],
    ['Generated', today],
    [],
    ['FINANCIAL OVERVIEW'],
    ['Metric', 'Value', 'Status'],
    ['Net Worth', d.net_worth, ''],
    ['Monthly Income', d.monthly_income, ''],
    ['Monthly Expenses', d.monthly_expenses, ''],
    ['Monthly Savings', d.monthly_savings, ''],
    ['Savings Rate', `${d.savings_rate}%`, d.savings_rate >= 20 ? 'Excellent' : d.savings_rate >= 10 ? 'Fair' : 'Low'],
    ['Monthly Cashflow', d.cashflow, d.cashflow >= 0 ? 'Positive' : 'Negative'],
    [],
    ...(health ? [
      ['HEALTH SCORE'],
      ['Overall Score', health.score, health.label],
      ['Savings Score', health.savings_score],
      ['Debt Score', health.debt_score],
      ['Emergency Fund Score', health.emergency_score],
      ['Budget Score', health.budget_score],
    ] : []),
  ]);
  ws1['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

  // Sheet 2: Insights
  const insights = generateInsights(d, health, goals, budgets);
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Insights & Recommendations'],
    [],
    ['#', 'Category', 'Recommendation'],
    ...insights.map((ins, i) => [i + 1, ins.title, ins.message]),
  ]);
  ws2['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Insights');

  // Sheet 3: Budgets
  if (budgets.length > 0) {
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Category', 'Limit', 'Spent', '% Used', 'Remaining', 'Status'],
      ...budgets.map(b => [
        b.category, b.limit_amount, b.spent_this_month,
        parseFloat(b.pct_used.toFixed(1)), b.remaining,
        b.pct_used > 100 ? 'Over Budget' : b.pct_used >= 80 ? 'Near Limit' : 'On Track',
      ]),
    ]);
    ws3['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Budgets');
  }

  // Sheet 4: Goals
  const activeGoals = goals.filter(g => !g.is_completed);
  if (activeGoals.length > 0) {
    const ws4 = XLSX.utils.aoa_to_sheet([
      ['Goal', 'Target', 'Current', 'Progress %', 'Months to Goal'],
      ...activeGoals.map(g => [
        g.name, g.target_amount, g.current_amount,
        parseFloat(g.progress_pct.toFixed(1)),
        g.months_to_goal ?? 'N/A',
      ]),
    ]);
    ws4['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Goals');
  }

  // Sheet 5: 10-Year Projections
  if (d.projections.length > 0) {
    const ws5 = XLSX.utils.aoa_to_sheet([
      ['Year', 'Projected Net Worth', 'Conservative', 'Optimistic'],
      ...d.projections.map(p => [`Year ${p.year}`, p.net_worth, p.low, p.high]),
    ]);
    ws5['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Projections');
  }

  // Sheet 6: Recent Transactions
  if (recent.length > 0) {
    const ws6 = XLSX.utils.aoa_to_sheet([
      ['Date', 'Category', 'Description', 'Type', 'Amount'],
      ...recent.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.category, tx.description || '', tx.transaction_type, tx.amount,
      ]),
    ]);
    ws6['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws6, 'Transactions');
  }

  XLSX.writeFile(wb, `FinCopilot-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
