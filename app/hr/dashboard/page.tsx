"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Clock,
  Banknote,
  Bell,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getInitials, formatINR, formatTime } from '@/lib/utils';

interface HRStats {
  totalEmployees: number;
  todayAttendance: number;
  attendanceRate: number;
  pendingSalariesAmount: number;
  pendingSalariesCount: number;
  attendanceWatchlist: Array<{
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    date: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
      designation: string | null;
    };
  }>;
  payrollHighlights: Array<{
    id: string;
    month: string;
    amount: number;
    status: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
      designation: string | null;
    };
  }>;
}

interface Notification {
  id: string;
  isRead: boolean;
}

export default function HRDashboardPage() {
  const { data: session } = useSession();
  const [watchlistPage, setWatchlistPage] = useState(1);
  const watchlistLimit = 5;
  const [highlightsPage, setHighlightsPage] = useState(1);
  const highlightsLimit = 5;

  const { data: stats, isLoading: statsLoading } = useQuery<HRStats>({
    queryKey: ['hr-dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/hr/dashboard-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const watchlist = stats?.attendanceWatchlist ?? [];
  const totalWatchlist = watchlist.length;
  const paginatedWatchlist = watchlist.slice(
    (watchlistPage - 1) * watchlistLimit,
    watchlistPage * watchlistLimit
  );

  const highlights = stats?.payrollHighlights ?? [];
  const totalHighlights = highlights.length;
  const paginatedHighlights = highlights.slice(
    (highlightsPage - 1) * highlightsLimit,
    highlightsPage * highlightsLimit
  );

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Welcome back, {session?.user?.name || 'HR Manager'} 👋
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor attendance, manage payroll, and support our agency team.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Users}
            value={statsLoading ? '...' : stats?.totalEmployees.toString() ?? '0'}
            label="Total Employees"
            trend={{
              value: 'Staff directory',
              isPositive: true,
              label: 'active members',
            }}
            iconColor="text-sky-500"
            iconBg="bg-sky-50 dark:bg-sky-500/10"
            loading={statsLoading}
          />
          <StatsCard
            icon={Clock}
            value={
              statsLoading
                ? '...'
                : `${stats?.todayAttendance ?? 0} / ${stats?.totalEmployees ?? 0}`
            }
            label="Today's Presence"
            trend={{
              value: `${stats?.attendanceRate ?? 0}%`,
              isPositive: (stats?.attendanceRate ?? 0) >= 70,
              label: 'attendance rate',
            }}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            loading={statsLoading}
          />
          <StatsCard
            icon={Banknote}
            value={statsLoading ? '...' : formatINR(stats?.pendingSalariesAmount ?? 0)}
            label="Pending Salaries"
            trend={{
              value: `${stats?.pendingSalariesCount ?? 0} record${
                stats?.pendingSalariesCount !== 1 ? 's' : ''
              }`,
              isPositive: (stats?.pendingSalariesCount ?? 0) === 0,
              label: 'unpaid this month',
            }}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
            loading={statsLoading}
          />
          <StatsCard
            icon={Bell}
            value={unreadCount.toString()}
            label="Unread Notifications"
            trend={{
              value: unreadCount === 0 ? 'All caught up' : 'Needs attention',
              isPositive: unreadCount === 0,
              label: 'in-app alerts',
            }}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
        </div>

        {/* Content Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Watchlist */}
          <div className="border border-border bg-card rounded-xl shadow-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                  Attendance Watchlist
                </h3>
              </div>
              <Link
                href="/hr/attendance"
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                View all logs
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[350px]">
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-2.5 w-20 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))
              ) : stats?.attendanceWatchlist?.length === 0 ? (
                <div className="px-5 py-12 text-center flex flex-col items-center justify-center h-full">
                  <Clock className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mb-2" />
                  <h4 className="font-medium text-xs text-zinc-700 dark:text-zinc-350">No Active Check-ins</h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-xs mx-auto mt-0.5">
                    All employees are currently offline or checked out.
                  </p>
                </div>
              ) : (
                paginatedWatchlist.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={record.user.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 text-xs font-semibold">
                          {getInitials(record.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {record.user.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {record.user.designation || 'Team Member'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {record.checkIn ? formatTime(record.checkIn) : '—'}
                      </span>
                      <p className="text-[9px] text-zinc-400 mt-0.5">
                        {record.checkOut ? `Out: ${formatTime(record.checkOut)}` : 'Checked In'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalWatchlist > watchlistLimit && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/10">
                <p className="text-xs text-zinc-400 order-2 sm:order-1 text-center sm:text-left font-medium">
                  Showing {(watchlistPage - 1) * watchlistLimit + 1}–{Math.min(watchlistPage * watchlistLimit, totalWatchlist)} of {totalWatchlist}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWatchlistPage(p => Math.max(1, p - 1))}
                    disabled={watchlistPage <= 1}
                    className="h-7 text-xs px-2.5 flex-1 sm:flex-initial"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWatchlistPage(p => p + 1)}
                    disabled={watchlistPage * watchlistLimit >= totalWatchlist}
                    className="h-7 text-xs px-2.5 flex-1 sm:flex-initial"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payroll Highlights */}
          <div className="border border-border bg-card rounded-xl shadow-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-sky-500" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                  Payroll Highlights
                </h3>
              </div>
              <Link
                href="/hr/salary"
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                Manage payroll
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[350px]">
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-2.5 w-20 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))
              ) : stats?.payrollHighlights?.length === 0 ? (
                <div className="px-5 py-12 text-center flex flex-col items-center justify-center h-full">
                  <Banknote className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mb-2" />
                  <h4 className="font-medium text-xs text-zinc-700 dark:text-zinc-350">No Pending Payroll</h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-xs mx-auto mt-0.5">
                    All employee salaries for the current run are fully paid!
                  </p>
                </div>
              ) : (
                paginatedHighlights.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={record.user.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 text-xs font-semibold">
                          {getInitials(record.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {record.user.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {record.user.designation || 'Team Member'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                        {formatINR(record.amount)}
                      </span>
                      <div className="flex items-center justify-end mt-0.5">
                        <StatusBadge status={record.status} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalHighlights > highlightsLimit && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/10">
                <p className="text-xs text-zinc-400 order-2 sm:order-1 text-center sm:text-left font-medium">
                  Showing {(highlightsPage - 1) * highlightsLimit + 1}–{Math.min(highlightsPage * highlightsLimit, totalHighlights)} of {totalHighlights}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHighlightsPage(p => Math.max(1, p - 1))}
                    disabled={highlightsPage <= 1}
                    className="h-7 text-xs px-2.5 flex-1 sm:flex-initial"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHighlightsPage(p => p + 1)}
                    disabled={highlightsPage * highlightsLimit >= totalHighlights}
                    className="h-7 text-xs px-2.5 flex-1 sm:flex-initial"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
