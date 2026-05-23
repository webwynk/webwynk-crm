"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCheck, 
  Loader2,
  FolderPlus,
  CheckCircle2,
  RefreshCw,
  Coins,
  Clock,
  LogIn,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { timeAgo, cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<
  string, 
  { 
    icon: React.ComponentType<{ className?: string }>; 
    bg: string; 
    color: string; 
  }
> = {
  PROJECT_ASSIGNED: { 
    icon: FolderPlus, 
    bg: 'bg-indigo-50 dark:bg-indigo-500/10', 
    color: 'text-indigo-650 dark:text-indigo-400' 
  },
  PROJECT_COMPLETED: { 
    icon: CheckCircle2, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  PROJECT_STATUS_CHANGED: { 
    icon: RefreshCw, 
    bg: 'bg-amber-50 dark:bg-amber-500/10', 
    color: 'text-amber-600 dark:text-amber-455' 
  },
  SALARY_PAID: { 
    icon: Coins, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  DEADLINE_ALERT: { 
    icon: Clock, 
    bg: 'bg-rose-50 dark:bg-rose-500/10', 
    color: 'text-rose-600 dark:text-rose-455' 
  },
  ATTENDANCE_CHECKIN: { 
    icon: LogIn, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
    color: 'text-emerald-650 dark:text-emerald-450' 
  },
  ATTENDANCE_CHECKOUT: { 
    icon: LogOut, 
    bg: 'bg-rose-50 dark:bg-rose-500/10', 
    color: 'text-rose-600 dark:text-rose-455' 
  },
};

interface NotificationListProps {
  accent: 'indigo' | 'sky' | 'emerald';
}

export default function NotificationList({ accent }: NotificationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSky = accent === 'sky';
  const isEmerald = accent === 'emerald';

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: paginatedData, isLoading } = useQuery<{ data: Notification[]; total: number; page: number; limit: number }>({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const notifications = paginatedData?.data ?? [];
  const total = paginatedData?.total ?? 0;
  const unreadCount = unreadData?.count ?? 0;

  const handleMarkAll = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    } catch {
      toast.error('Failed');
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    } catch {}
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      >
        {unreadCount > 0 && (
          <Button
            id="mark-all-read-btn"
            variant="outline"
            size="sm"
            className="h-8 text-sm gap-1.5"
            onClick={handleMarkAll}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl flex items-center justify-center border border-border">
            <Bell className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-400 text-center">You&apos;re all caught up! No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const iconConfig = TYPE_ICON[notification.type] || {
              icon: Bell,
              bg: 'bg-zinc-100 dark:bg-zinc-900/60',
              color: 'text-zinc-500 dark:text-zinc-400',
            };
            const NotificationIcon = iconConfig.icon;
            
            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors cursor-pointer',
                  notification.isRead
                    ? 'bg-card border-border'
                    : isEmerald
                      ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 border-l-4 border-l-emerald-500'
                      : isSky
                        ? 'bg-sky-50/50 dark:bg-sky-500/5 border-sky-200 dark:border-sky-500/20 border-l-4 border-l-sky-500'
                        : 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20 border-l-4 border-l-indigo-500'
                )}
                onClick={async () => {
                  if (!notification.isRead) {
                    await handleMarkOne(notification.id);
                  }
                  if (notification.link) {
                    router.push(notification.link);
                  }
                }}
              >
                {/* Icon */}
                <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center mt-0.5", iconConfig.bg, iconConfig.color)}>
                  <NotificationIcon className="w-4 h-4" />
                </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm',
                  notification.isRead
                    ? 'font-medium text-zinc-700 dark:text-zinc-300'
                    : 'font-semibold text-zinc-900 dark:text-zinc-50'
                )}>
                  {notification.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {notification.body}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1.5">{timeAgo(notification.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {!notification.isRead && (
                <span className={cn(
                  'w-2 h-2 rounded-full shrink-0 mt-1',
                  isEmerald ? 'bg-emerald-500' : isSky ? 'bg-sky-500' : 'bg-indigo-500'
                )} />
              )}
            </div>
          );
        })}
        {total > limit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card mt-4 rounded-xl border">
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
