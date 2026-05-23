"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2, Search } from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import RoleBadge from '@/components/shared/RoleBadge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getInitials, timeAgo } from '@/lib/utils';

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

const ACTION_LABEL: Record<string, { label: string; icon: string }> = {
  created_project: { label: 'Created project', icon: '📁' },
  updated_project: { label: 'Updated project', icon: '✏️' },
  project_completed: { label: 'Completed project', icon: '✅' },
  deleted_project: { label: 'Deleted project', icon: '🗑️' },
  created_employee: { label: 'Added employee', icon: '👤' },
  created_salary: { label: 'Created salary record', icon: '💼' },
  salary_paid: { label: 'Paid salary', icon: '💰' },
  marked_absent: { label: 'Marked absent', icon: '📋' },
  checked_in: { label: 'Checked in', icon: '🟢' },
  checked_out: { label: 'Checked out', icon: '🔴' },
  updated_profile: { label: 'Updated profile', icon: '⚙️' },
};

export default function AdminActivityPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ logs: ActivityLog[]; total: number; page: number; limit: number }>({
    queryKey: ['activity', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('action', search);
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  return (
    <PageWrapper>
      <PageHeader
        title="Activity Audit Log"
        subtitle={`${total} total activities recorded`}
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          id="activity-search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Filter by action type..."
          className="pl-9 text-sm h-9"
        />
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
                      icon: '📌',
                    };
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
                          <span className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                            <span className="text-base">{actionInfo.icon}</span>
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
                        <td className="px-4 py-3 text-[10px] text-zinc-400 whitespace-nowrap">
                          {timeAgo(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-zinc-400">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs border border-border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/40 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="px-3 py-1 text-xs border border-border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/40 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
