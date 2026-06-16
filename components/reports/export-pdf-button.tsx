'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { ExpenseReportDocument } from '@/lib/pdf/expense-report-document';
import { getExpenses, getCategoryBreakdown } from '@/lib/actions/expenses';

interface Props {
  start: string;
  end: string;
  className?: string;
}

export function ExportPdfButton({ start, end, className }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!start || !end) {
      toast.error('Please select a date range first.');
      return;
    }
    setLoading(true);
    try {
      const [expenses, breakdown] = await Promise.all([
        getExpenses({ start, end, limit: 9999 }),
        getCategoryBreakdown({ start, end }),
      ]);
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const cogsTotal = expenses.filter(e => e.is_cogs).reduce((s, e) => s + e.amount, 0);

      const blob = await pdf(
        <ExpenseReportDocument
          expenses={expenses}
          breakdown={breakdown}
          totalSpent={totalSpent}
          cogsTotal={cogsTotal}
          startDate={start}
          endDate={end}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirabee-report-${start}-${end}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (e) {
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={className ?? 'mb-export-pdf'}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      <FileText size={16} />
      {loading ? 'Generating…' : 'PDF report'}
    </button>
  );
}
