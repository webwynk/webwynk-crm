"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Printer,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Building,
  Download,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { exportSalarySlipPDF } from '@/lib/export';

interface SalaryRecord {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  amount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  paidAt: string | null;
  note: string | null;
  user: {
    id: string;
    name: string;
    designation: string | null;
  };
}

export default function EmployeeSalaryPage() {
  const { data: session } = useSession();
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch all salary slips for statistics
  const { data: allSalaries = [] } = useQuery<SalaryRecord[]>({
    queryKey: ['employee-salaries-all'],
    queryFn: async () => {
      const res = await fetch('/api/salary');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch paginated salary history
  const { data: paginatedData, isLoading } = useQuery<{ data: SalaryRecord[]; total: number; page: number; limit: number }>({
    queryKey: ['employee-salaries', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/salary?${params}`);
      if (!res.ok) throw new Error('Failed to fetch salaries');
      return res.json();
    },
  });

  const salaries = paginatedData?.data ?? [];
  const total = paginatedData?.total ?? 0;
  const limit = paginatedData?.limit ?? 10;

  const filteredSalaries = salaries;

  const handleOpenSlip = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setIsSlipOpen(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-slip');
    if (!printContent) return;

    const style = document.createElement('style');
    // Add print styles to hide everything except the slip
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-slip, #printable-slip * {
          visibility: visible;
        }
        #printable-slip {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    // Reload is sometimes needed to restore react event bindings properly after printing in Next.js
    window.location.reload();
  };

  // Calculations for Salary Slip Breakdown
  const getSalaryBreakdown = (amount: number) => {
    const basic = Math.round(amount * 0.50);
    const hra = Math.round(amount * 0.25);
    const specialAllowance = Math.round(amount * 0.25);
    const gross = basic + hra + specialAllowance;

    const pf = Math.round(basic * 0.12);
    const tds = Math.round(amount * 0.05);
    const pt = 200; // Flat Professional Tax
    const deductions = pf + tds + pt;

    const netPay = gross - deductions;

    return {
      basic,
      hra,
      specialAllowance,
      gross,
      pf,
      tds,
      pt,
      deductions,
      netPay,
    };
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <PageWrapper>
      <PageHeader
        title="My Salary Slips"
        subtitle="View salary history, payment statuses, and download/print monthly pay slips"
      />

      {/* Salary Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 text-zinc-400">
              Total Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Banknote className="w-4.5 h-4.5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              ₹
              {allSalaries
                .filter((s) => s.status === 'PAID')
                .reduce((acc, curr) => acc + curr.amount, 0)
                .toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-1">
              Total paid earnings recorded
            </span>
          </div>
        </Card>

        <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 text-zinc-400">
              Last Salary Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-sky-500" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {allSalaries.length > 0 ? `₹${allSalaries[0].amount.toLocaleString('en-IN')}` : '₹0'}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-1">
              {allSalaries.length > 0 ? `Month: ${getMonthName(allSalaries[0].month)}` : 'No salaries recorded'}
            </span>
          </div>
        </Card>

        <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 text-zinc-400">
              Pending Slips
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {allSalaries.filter((s) => s.status === 'PENDING').length}
            </span>
            <span className="text-[10px] text-zinc-450 block mt-1">
              Salaries awaiting payment verification
            </span>
          </div>
        </Card>
      </div>

      {/* Salary List Table */}
      <Card className="premium-card border border-border bg-card rounded-2xl overflow-hidden shadow-card p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-border">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-emerald-500" />
            Salary History
          </h2>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val ?? 'all'); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs font-semibold focus:ring-emerald-500 border-zinc-200">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Payments</SelectItem>
                <SelectItem value="PAID" className="text-xs">Paid</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                <SelectItem value="PARTIAL" className="text-xs">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-zinc-350 dark:text-zinc-650" />
            <div className="text-center">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold">No salary slips found</p>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                No salary transactions matched the current filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-zinc-400 font-bold uppercase tracking-wider text-[10px] select-none">
                    <th className="pb-3 pt-1 pl-2">Pay Period</th>
                    <th className="pb-3 pt-1">Amount</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1">Payment Date</th>
                    <th className="pb-3 pt-1">Notes</th>
                    <th className="pb-3 pt-1 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredSalaries.map((salary) => (
                    <tr key={salary.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-zinc-800 dark:text-zinc-200">
                        {getMonthName(salary.month)}
                      </td>
                      <td className="py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{salary.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                            salary.status === 'PAID' && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            salary.status === 'PENDING' && 'bg-amber-50 dark:bg-amber-550/10 text-amber-600 dark:text-amber-400',
                            salary.status === 'PARTIAL' && 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          )}
                        >
                          {salary.status === 'PAID' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {salary.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                          {salary.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-550 dark:text-zinc-400">
                        {salary.paidAt ? formatDate(salary.paidAt) : 'Pending Verification'}
                      </td>
                      <td className="py-3.5 text-zinc-550 dark:text-zinc-400 max-w-[200px] truncate">
                        {salary.note || 'Regular Monthly Payout'}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {salary.status === 'PAID' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSlip(salary)}
                            className="h-8 border-emerald-250 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 text-xs font-bold gap-1 px-3"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Slip
                          </Button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">Verifying Slip...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card mt-4 rounded-xl border">
                <p className="text-xs text-zinc-400 order-2 sm:order-1 text-center sm:text-left font-medium">
                  Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 text-xs px-3 flex-1 sm:flex-initial"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="h-8 text-xs px-3 flex-1 sm:flex-initial"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Printable Slip Dialog */}
      <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
        <DialogContent className="max-w-[650px] p-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="sr-only">
              <DialogTitle>Pay Slip Details</DialogTitle>
              <DialogDescription>Monthly break down of salary slip</DialogDescription>
            </DialogHeader>

            {/* Slip Container */}
            <div
              id="printable-slip"
              className="p-6 border border-zinc-250 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              {/* Slip Header */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-850">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center shrink-0">
                      <Building className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white uppercase">
                      WebWynk Solutions
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-tight max-w-[240px]">
                    Plot 12, Phase II, IT Park, Sector 67, Chandigarh, India
                  </p>
                  <p className="text-[9px] text-zinc-400">GSTIN: 03AAGCW1109B1ZN</p>
                </div>
                
                <div className="text-right space-y-1">
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pay Slip
                  </span>
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {selectedSalary ? getMonthName(selectedSalary.month) : ''}
                  </h3>
                  <p className="text-[9px] text-zinc-400">
                    Slip ID: {selectedSalary?.id.substring(0, 12).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Employee Details Grid */}
              <div className="grid grid-cols-2 gap-4 py-5 border-b border-zinc-100 dark:border-zinc-900 text-[11px]">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Employee Name
                    </span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-100">
                      {selectedSalary?.user.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Designation
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {selectedSalary?.user.designation || session?.user?.designation || 'Team Member'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Payout Date
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {selectedSalary?.paidAt ? formatDate(selectedSalary.paidAt) : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Payment Mode
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Bank Transfer (NEFT/RTGS)
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-5 text-[11px]">
                {/* Earnings Column */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-900">
                    Earnings Breakdown
                  </h4>
                  {selectedSalary && (() => {
                    const bd = getSalaryBreakdown(selectedSalary.amount);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Basic Salary</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.basic.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">House Rent Allowance (HRA)</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.hra.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Special Allowance</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.specialAllowance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-850 font-bold text-zinc-900 dark:text-zinc-100">
                          <span>Gross Earnings</span>
                          <span>₹{bd.gross.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Deductions Column */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[10px] text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-900">
                    Deductions Breakdown
                  </h4>
                  {selectedSalary && (() => {
                    const bd = getSalaryBreakdown(selectedSalary.amount);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Provident Fund (PF)</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.pf.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">TDS (Income Tax)</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.tds.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Professional Tax (PT)</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{bd.pt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-850 font-bold text-zinc-900 dark:text-zinc-100">
                          <span>Total Deductions</span>
                          <span>₹{bd.deductions.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Net Salary Summary Block */}
              {selectedSalary && (() => {
                const bd = getSalaryBreakdown(selectedSalary.amount);
                return (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-250 dark:border-emerald-500/20 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wide block">
                        Net Payout (Take Home)
                      </span>
                      <span className="text-zinc-450 dark:text-zinc-500 text-[10px] mt-0.5 block">
                        Paid out on {selectedSalary.paidAt ? formatDate(selectedSalary.paidAt) : '--'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                        ₹{bd.netPay.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Note */}
              <div className="mt-6 text-center text-[9px] text-zinc-400 leading-normal border-t border-zinc-100 dark:border-zinc-900 pt-4">
                This is a system generated pay slip and does not require a physical signature.
                <br />
                For queries regarding pay components, please contact HR Department or admin support.
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 no-print">
              <Button
                variant="ghost"
                onClick={() => setIsSlipOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 text-xs font-semibold h-9"
              >
                Close
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold h-9 px-4 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </Button>
              <Button
                onClick={() => selectedSalary && exportSalarySlipPDF(selectedSalary)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
