"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Coffee,
  Hourglass,
  AlertCircle,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  status: 'PRESENT' | 'ABSENT' | 'INCOMPLETE';
}

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Set running clock
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch historic logs for the selected month
  const { data: attendanceLogs = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['employee-attendance', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to fetch attendance logs');
      return res.json();
    },
  });

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to check in');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Successfully checked in!');
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Check in failed');
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to check out');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Successfully checked out!');
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Check out failed');
    },
  });

  // Extract today's record if any
  const todayDateStr = currentTime ? currentTime.toISOString().split('T')[0] : '';
  const todayRecord = attendanceLogs.find((log) => {
    if (!log.date) return false;
    const logDateStr = new Date(log.date).toISOString().split('T')[0];
    return logDateStr === todayDateStr;
  });

  // Generate Month list options (last 12 months)
  const monthOptions = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ value: val, label });
  }

  // Filter logs for table
  const filteredLogs = attendanceLogs.filter((log) => {
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  // Calculate statistics
  const presentCount = attendanceLogs.filter(
    (log) => log.status === 'PRESENT' || log.status === 'INCOMPLETE'
  ).length;
  const totalHours = attendanceLogs.reduce((acc, log) => acc + (log.workHours || 0), 0);
  const averageHours = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : '0.0';

  const formatClockTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine attendance status for today
  let deskStatus = 'not_checked_in';
  if (todayRecord) {
    if (todayRecord.checkOut) {
      deskStatus = 'checked_out';
    } else {
      deskStatus = 'checked_in';
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Attendance Logs"
        subtitle="Manage check-ins, record working hours, and review logs"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Clock In/Out desk */}
        <Card className="premium-card border border-border p-6 shadow-card flex flex-col justify-between min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Attendance Desk
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Log your working hours for today. Your timestamps will be saved in IST.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 text-center space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                Current Time
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 font-mono block">
                {currentTime
                  ? currentTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })
                  : '--:--:--'}
              </span>
              <span className="text-[9px] text-zinc-400">
                {currentTime ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {deskStatus === 'not_checked_in' && (
              <Button
                type="button"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-sm"
              >
                {checkInMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking In...
                  </>
                ) : (
                  'Check In'
                )}
              </Button>
            )}

            {deskStatus === 'checked_in' && (
              <div className="space-y-2">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold text-center flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Checked in at {formatClockTime(todayRecord!.checkIn)}
                </p>
                <Button
                  type="button"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 shadow-sm"
                >
                  {checkOutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Checking Out...
                    </>
                  ) : (
                    'Check Out'
                  )}
                </Button>
              </div>
            )}

            {deskStatus === 'checked_out' && (
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-550 text-xs px-3 py-1 rounded-full font-semibold border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Day Completed
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Check-in: {formatClockTime(todayRecord!.checkIn)} | Check-out: {formatClockTime(todayRecord!.checkOut)}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Worked {todayRecord!.workHours} hours today
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Stats card panels */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                Present Days
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {presentCount}
              </span>
              <span className="text-[10px] text-zinc-450 block mt-1">
                Days present this month
              </span>
            </div>
          </Card>

          <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                Total Work Hours
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Coffee className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {totalHours.toFixed(1)} hrs
              </span>
              <span className="text-[10px] text-zinc-450 block mt-1">
                Total hours recorded
              </span>
            </div>
          </Card>

          <Card className="premium-card border border-border p-5 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                Avg. Daily Hours
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Hourglass className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {averageHours} hrs
              </span>
              <span className="text-[10px] text-zinc-450 block mt-1">
                Average hours per presence
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <Card className="premium-card border border-border bg-card rounded-2xl overflow-hidden shadow-card p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-border">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-emerald-500" />
            Attendance History Log
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Month Filter */}
            <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val ?? '')}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-semibold focus:ring-emerald-500 border-zinc-200">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? 'all')}>
              <SelectTrigger className="w-[130px] h-8 text-xs font-semibold focus:ring-emerald-500 border-zinc-200">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="PRESENT" className="text-xs">Present</SelectItem>
                <SelectItem value="ABSENT" className="text-xs">Absent</SelectItem>
                <SelectItem value="INCOMPLETE" className="text-xs">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-zinc-350 dark:text-zinc-650" />
            <div className="text-center">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold">No records found</p>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                No logs match the selected filters for this month.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-zinc-400 font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="pb-3 pt-1 pl-2">Date</th>
                  <th className="pb-3 pt-1">Status</th>
                  <th className="pb-3 pt-1">Clock In</th>
                  <th className="pb-3 pt-1">Clock Out</th>
                  <th className="pb-3 pt-1 pr-2 text-right">Work Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredLogs.map((log) => {
                  const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 pl-2 font-semibold text-zinc-800 dark:text-zinc-200">
                        {formattedDate}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                            log.status === 'PRESENT' && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            log.status === 'ABSENT' && 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
                            log.status === 'INCOMPLETE' && 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {log.status === 'PRESENT' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {log.status === 'ABSENT' && <XCircle className="w-2.5 h-2.5" />}
                          {log.status === 'INCOMPLETE' && <Clock className="w-2.5 h-2.5" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-400 font-mono">
                        {log.status === 'ABSENT' ? '--:--' : formatClockTime(log.checkIn)}
                      </td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-400 font-mono">
                        {log.status === 'ABSENT' || !log.checkOut ? '--:--' : formatClockTime(log.checkOut)}
                      </td>
                      <td className="py-3 pr-2 text-right font-bold text-zinc-750 dark:text-zinc-200">
                        {log.workHours !== null && log.workHours !== undefined ? `${log.workHours.toFixed(2)} hrs` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
}
