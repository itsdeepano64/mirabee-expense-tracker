'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  startDate: string;
  endDate: string;
  className?: string;
}

export function ExportPdfButton({ startDate, endDate, className }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!startDate || !endDate) {
      toast.error('Please select a date range first.');
      return;
    }
    setLoading(true);
    try {
      // Dynamic imports keep bundle size small
      const [{ pdf }, { getExpenses }, { getCategoryBreakdown }, { ExpenseReportDocument }] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('@/lib/actions/expenses'),
          import('@/lib/actions/expenses'),
          import('@/lib/pdf/expense-report-document'),
        ]);

      // getExpenses signature: { startDate?, endDate?, categoryId?, categoryIds?, search? }
      const [expenses, breakdown] = await Promise.all([
        getExpenses({ startDate, endDate }),
        getCategoryBreakdown({ startDate, endDate }),
      ]);

      const expArr = expenses as Array<{
        amount: number;
        is_cogs: boolean;
        [key: string]: unknown;
      }>;

      const totalSpent = expArr.reduce((s, e) => s + e.amount, 0);
      const cogsTotal = expArr
        .filter(e => e.is_cogs)
        .reduce((s, e) => s + e.amount, 0);

      const blob = await pdf(
        // @ts-expect-error — JSX element in .ts file; suppress if tsconfig strict
        ExpenseReportDocument({
          expenses: expArr,
          breakdown,
          totalSpent,
          cogsTotal,
          startDate,
          endDate,
        }),
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirabee-report-${startDate}-${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF export error:', err);
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
