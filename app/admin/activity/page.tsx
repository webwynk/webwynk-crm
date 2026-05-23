"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Loader2, 
  Search,
  FolderPlus,
  Pencil,
  CheckCircle2,
  Trash2,
  UserPlus,
  Briefcase,
  Coins,
  CalendarX,
  LogIn,
  LogOut,
  Settings,
  Pin
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import RoleBadge from '@/components/shared/RoleBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getInitials, timeAgo, cn, formatDateTime } from '@/lib/utils';

interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

const ACTION_LABEL: Record<
  string, 
  { 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    bg: string; 
    color: string; 
  }
> = {
  created_project: { 
    label: 'Created project', 
    icon: FolderPlus, 
    bg: 'bg-indigo-50 dark:bg-indigo-500/10', 
    color: 'text-indigo-650 dark:text-indigo-400' 
  },
  updated_project: { 
    label: 'Updated project', 
    icon: Pencil, 
    bg: 'bg-amber-50 dark:bg-amber-500/10', 
    color: 'text-amber-600 dark:text-amber-450' 
  },
  project_completed: { 
    label: 'Completed project', 
    icon: CheckCircle2, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  deleted_project: { 
    label: 'Deleted project', 
    icon: Trash2, 
    bg: 'bg-rose-50 dark:bg-rose-500/10', 
    color: 'text-rose-600 dark:text-rose-455' 
  },
  created_employee: { 
    label: 'Added employee', 
    icon: UserPlus, 
    bg: 'bg-sky-50 dark:bg-sky-500/10', 
    color: 'text-sky-655 dark:text-sky-400' 
  },
  created_salary: { 
    label: 'Created salary record', 
    icon: Briefcase, 
    bg: 'bg-violet-50 dark:bg-violet-500/10', 
    color: 'text-violet-650 dark:text-violet-400' 
  },
  salary_paid: { 
    label: 'Paid salary', 
    icon: Coins, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  marked_absent: { 
    label: 'Marked absent', 
    icon: CalendarX, 
    bg: 'bg-rose-50 dark:bg-rose-500/10', 
    color: 'text-rose-600 dark:text-rose-455' 
  },
  checked_in: { 
    label: 'Checked in', 
    icon: LogIn, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  checked_out: { 
    label: 'Checked out', 
    icon: LogOut, 
    bg: 'bg-rose-50 dark:bg-rose-500/10', 
    color: 'text-rose-600 dark:text-rose-455' 
  },
  updated_profile: { 
    label: 'Updated profile', 
    icon: Settings, 
    bg: 'bg-zinc-100 dark:bg-zinc-900/60', 
    color: 'text-zinc-600 dark:text-zinc-400' 
  },
};

export default function AdminActivityPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dateFilterType, setDateFilterType] = useState<'today' | 'past'>('today');

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

  const [fromDate, setFromDate] = useState(sevenDaysAgoStr);
  const [toDate, setToDate] = useState(todayStr);

  const { data, isLoading } = useQuery<{ logs: ActivityLog[]; total: number; page: number; limit: number }>({
    queryKey: ['activity', search, page, dateFilterType, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('action', search);

      let fromISO = '';
      let toISO = '';
      if (dateFilterType === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        fromISO = todayStart.toISOString();
        toISO = todayEnd.toISOString();
      } else {
        if (fromDate) {
          try {
            fromISO = new Date(`${fromDate}T00:00:00`).toISOString();
          } catch {}
        }
        if (toDate) {
          try {
            toISO = new Date(`${toDate}T23:59:59.999`).toISOString();
          } catch {}
        }
      }

      if (fromISO) params.set('from', fromISO);
      if (toISO) params.set('to', toISO);

      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 10;

  return (
    <PageWrapper>
      <PageHeader
        title="Activity Audit Log"
        subtitle={`${total} total activities recorded`}
      />

      {/* Filters and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            id="activity-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by action type..."
            className="pl-9 text-sm h-9 w-full"
          />
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Toggle buttons */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-border self-start sm:self-auto">
            <button
              onClick={() => {
                setDateFilterType('today');
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                dateFilterType === 'today'
                  ? "bg-card text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-305"
              )}
            >
              Today
            </button>
            <button
              onClick={() => {
                setDateFilterType('past');
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                dateFilterType === 'past'
                  ? "bg-card text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-305"
              )}
            >
              Past (Calendar)
            </button>
          </div>

          {/* Custom Date Inputs */}
          {dateFilterType === 'past' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-9 w-[130px] px-2 py-1"
              />
              <span className="text-xs text-zinc-400">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-9 w-[130px] px-2 py-1"
              />
            </div>
          )}
        </div>
      </div>

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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-zinc-200 dark:text-zinc-700" />
                      <p className="text-sm">No activity logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionInfo = ACTION_LABEL[log.action] || {
                      label: log.action.replace(/_/g, ' '),
                      icon: Pin,
                      bg: 'bg-zinc-100 dark:bg-zinc-900/60',
                      color: 'text-zinc-600 dark:text-zinc-400',
                    };
                    const ActionIcon = actionInfo.icon;
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7 shrink-0">
                              <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 text-[10px] font-semibold">
                                {getInitials(log.actorName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{log.actorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={log.actorRole} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                            <span className={cn("p-1.5 rounded-lg shrink-0 flex items-center justify-center", actionInfo.bg, actionInfo.color)}>
                              <ActionIcon className="w-3.5 h-3.5" />
                            </span>
                            <span>{actionInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{log.entityType}</td>
                        <td className="px-4 py-3 max-w-xs">
                          {log.metadata && (
                            <span className="text-[10px] text-zinc-400 font-mono truncate block max-w-[160px]">
                              {Object.entries(log.metadata)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            {formatDateTime(log.createdAt)}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {timeAgo(log.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card">
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
        </div>
      )}
    </PageWrapper>
  );
}
