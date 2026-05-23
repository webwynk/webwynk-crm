"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Clock,
  Search,
  Download,
  Loader2,
  UserX,
  CheckCircle,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatTime, getInitials, getCurrentYearMonth, cn, getAvatarColor } from '@/lib/utils';
import { exportAttendanceCSV } from '@/lib/export';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  note: string | null;
  user: { id: string; name: string; avatar: string | null; designation: string | null };
}

interface Employee {
  id: string;
  name: string;
}

interface AttendanceManagerProps {
  role: 'ADMIN' | 'HR';
}

export default function AttendanceManager({ role }: AttendanceManagerProps) {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [markingAbsent, setMarkingAbsent] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const isHR = role === 'HR';

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data, isLoading } = useQuery<{ data: AttendanceRecord[]; total: number; page: number; limit: number }>({
    queryKey: ['attendance', selectedEmployee, month, statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ month, page: String(page), limit: '10' });
      if (selectedEmployee !== 'all') params.set('userId', selectedEmployee);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/attendance?${params}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
  });

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 10;

  const filtered = records;

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ month });
      if (selectedEmployee !== 'all') params.set('userId', selectedEmployee);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/attendance?${params}`);
      if (!res.ok) throw new Error();
      const allRecords = await res.json();
      exportAttendanceCSV(allRecords, `attendance-${month}`);
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleMarkAbsent = async (userId: string, date: string, name: string) => {
    if (!confirm(`Mark ${name} as absent on ${formatDate(date)}?`)) return;
    setMarkingAbsent(userId);
    try {
      const res = await fetch('/api/attendance/absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date }),
      });

      if (res.status === 409) {
        const data = await res.json();
        if (
          data.requiresOverride &&
          confirm(`${data.employeeName} already checked in. Override attendance as ABSENT?`)
        ) {
          await fetch('/api/attendance/absent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date, forceOverride: true }),
          });
          toast.success('Attendance overridden as Absent');
        }
      } else if (!res.ok) {
        throw new Error('Failed');
      } else {
        toast.success(`Marked ${name} as absent`);
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    } catch {
      toast.error('Failed to mark absent');
    } finally {
      setMarkingAbsent(null);
    }
  };

  return (
    <PageWrapper>
      <PageHeader title="Attendance Logs" subtitle="Track daily check-ins and working hours">
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          className="h-8 text-sm gap-1.5 text-zinc-600 hover:text-zinc-900"
          onClick={handleExport}
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Export CSV
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={selectedEmployee} onValueChange={(v) => { setSelectedEmployee(v ?? 'all'); setPage(1); }}>
          <SelectTrigger id="attendance-employee-filter" className="w-44 text-sm h-9">
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
          id="attendance-month-filter"
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setPage(1); }}
          className={cn(
            'w-44 text-sm h-9',
            isHR ? 'focus-visible:ring-sky-500' : 'focus-visible:ring-indigo-500'
          )}
        />

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1); }}>
          <SelectTrigger id="attendance-status-filter" className="w-36 text-sm h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <Input
            id="attendance-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employee..."
            className={cn(
              'pl-8 text-sm h-9',
              isHR ? 'focus-visible:ring-sky-500' : 'focus-visible:ring-indigo-500'
            )}
          />
        </div>
      </div>

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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        icon={Clock}
                        title="No attendance records"
                        description="There are no attendance records matching your search/filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={record.user.avatar || undefined} className="object-cover" />
                            <AvatarFallback className={cn(
                              'text-xs font-semibold',
                              getAvatarColor(record.userId).bg,
                              getAvatarColor(record.userId).text
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
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {record.checkIn ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {formatTime(record.checkIn)}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {record.checkOut ? formatTime(record.checkOut) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                        {record.workHours != null ? `${record.workHours}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3">
                        {record.status !== 'ABSENT' && (
                          <button
                            onClick={() => handleMarkAbsent(record.userId, record.date, record.user.name)}
                            disabled={markingAbsent === record.userId}
                            className="flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
                          >
                            {markingAbsent === record.userId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            Mark Absent
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {total > limit && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card">
              <p className="text-xs text-zinc-400 order-2 sm:order-1 text-center sm:text-left font-medium">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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
        </div>
      )}
    </PageWrapper>
  );
}
