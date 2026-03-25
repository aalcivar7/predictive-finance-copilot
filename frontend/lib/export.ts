import type { MonthSummary, IncomeStreamsSummary, Transaction } from '@/types';

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
