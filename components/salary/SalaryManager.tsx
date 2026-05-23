"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Banknote,
  Plus,
  Download,
  Loader2,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatINR, formatDate, getInitials, getCurrentYearMonth, cn } from '@/lib/utils';
import { exportSalaryCSV, exportSalaryPDF } from '@/lib/export';

interface SalaryRecord {
  id: string;
  userId: string;
  month: string;
  amount: number;
  status: string;
  paidAt: string | null;
  note: string | null;
  user: { id: string; name: string; avatar: string | null; designation: string | null };
}

interface Employee {
  id: string;
  name: string;
}

interface SalaryManagerProps {
  role: 'ADMIN' | 'HR';
}

export default function SalaryManager({ role }: SalaryManagerProps) {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRecord, setNewRecord] = useState({
    userId: '',
    month: getCurrentYearMonth(),
    amount: '',
    note: '',
  });

  const isHR = role === 'HR';

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: salaries = [], isLoading } = useQuery<SalaryRecord[]>({
    queryKey: ['salary', selectedEmployee, month, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ month });
      if (selectedEmployee !== 'all') params.set('userId', selectedEmployee);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/salary?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const handleMarkPaid = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/salary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Salary marked as paid for ${name}`);
      queryClient.invalidateQueries({ queryKey: ['salary'] });
    } catch {
      toast.error('Failed to update salary');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this salary record?')) return;
    try {
      const res = await fetch(`/api/salary/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Salary record deleted');
      queryClient.invalidateQueries({ queryKey: ['salary'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async () => {
    if (!newRecord.userId || !newRecord.month || !newRecord.amount) {
      toast.error('Employee, month and amount are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRecord, amount: Number(newRecord.amount) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Salary record created');
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      setShowCreateForm(false);
      setNewRecord({ userId: '', month: getCurrentYearMonth(), amount: '', note: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const totalPending = salaries.filter((s) => s.status === 'PENDING').reduce((acc, s) => acc + s.amount, 0);
  const totalPaid = salaries.filter((s) => s.status === 'PAID').reduce((acc, s) => acc + s.amount, 0);

  return (
    <PageWrapper>
      <PageHeader title="Salary Payroll" subtitle="Manage and track employee salary payments">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5 text-zinc-600 hover:text-zinc-900"
          onClick={() => exportSalaryCSV(salaries, "salary-payroll")}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5 text-zinc-600 hover:text-zinc-900"
          onClick={() => exportSalaryPDF(salaries, selectedEmployee === 'all' ? 'All Employees' : (employees.find(e => e.id === selectedEmployee)?.name || 'Employee'), month)}
        >
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </Button>
        <Button
          id="add-salary-btn"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          className={cn(
            'h-8 text-sm text-white gap-1.5',
            isHR ? 'bg-sky-600 hover:bg-sky-700' : 'bg-indigo-600 hover:bg-indigo-700'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Record
        </Button>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Records', value: salaries.length.toString(), color: 'text-zinc-900 dark:text-zinc-50' },
          { label: 'Pending Amount', value: formatINR(totalPending), color: 'text-amber-600' },
          { label: 'Paid Amount', value: formatINR(totalPaid), color: 'text-emerald-600' },
          { label: 'Pending Count', value: salaries.filter((s) => s.status === 'PENDING').length.toString(), color: 'text-orange-600' },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-card text-center">
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={selectedEmployee} onValueChange={(v) => setSelectedEmployee(v ?? 'all')}>
          <SelectTrigger id="salary-employee-filter" className="w-44 text-sm h-9">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id="salary-month-filter"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={cn(
            'w-44 text-sm h-9',
            isHR ? 'focus-visible:ring-sky-500' : 'focus-visible:ring-indigo-500'
          )}
        />

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger id="salary-status-filter" className="w-36 text-sm h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create Record Inline Panel */}
      {showCreateForm && (
        <div className={cn(
          'border rounded-xl p-4 mb-5 space-y-3',
          isHR
            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20'
            : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
        )}>
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              'font-semibold text-sm',
              isHR ? 'text-sky-800 dark:text-sky-300' : 'text-indigo-800 dark:text-indigo-300'
            )}>
              New Salary Record
            </h4>
            <button onClick={() => setShowCreateForm(false)}>
              <X className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-zinc-500 font-semibold">Employee</Label>
              <Select value={newRecord.userId} onValueChange={(v) => setNewRecord((p) => ({ ...p, userId: v ?? '' }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-zinc-500 font-semibold">Month</Label>
              <Input type="month" value={newRecord.month} onChange={(e) => setNewRecord((p) => ({ ...p, month: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-zinc-500 font-semibold">Amount (₹)</Label>
              <Input type="number" placeholder="e.g. 35000" value={newRecord.amount} onChange={(e) => setNewRecord((p) => ({ ...p, amount: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-zinc-500 font-semibold">Note</Label>
              <Input placeholder="Optional note..." value={newRecord.note} onChange={(e) => setNewRecord((p) => ({ ...p, note: e.target.value }))} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            <Button
              size="sm"
              className={cn(
                'h-7 text-xs text-white',
                isHR ? 'bg-sky-600 hover:bg-sky-700' : 'bg-indigo-600 hover:bg-indigo-700'
              )}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save Record
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-zinc-50 dark:bg-zinc-900/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Paid On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-400">
                      <Banknote className="w-8 h-8 mx-auto mb-2 text-zinc-200 dark:text-zinc-700" />
                      <p className="text-sm">No salary records for this period</p>
                    </td>
                  </tr>
                ) : (
                  salaries.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={record.user.avatar || undefined} className="object-cover" />
                            <AvatarFallback className={cn(
                              'text-xs font-semibold',
                              isHR
                                ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700'
                                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700'
                            )}>
                              {getInitials(record.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-50 text-xs">{record.user.name}</p>
                            <p className="text-[10px] text-zinc-400">{record.user.designation || 'Team Member'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{record.month}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-50">{formatINR(record.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {record.paidAt ? formatDate(record.paidAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {record.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkPaid(record.id, record.user.name)}
                              className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="flex items-center gap-1 text-[10px] font-medium text-rose-500 hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
