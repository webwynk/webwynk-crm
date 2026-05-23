"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
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

const TYPE_ICON: Record<string, string> = {
  PROJECT_ASSIGNED: '📁',
  PROJECT_COMPLETED: '✅',
  PROJECT_STATUS_CHANGED: '🔄',
  SALARY_PAID: '💰',
  DEADLINE_ALERT: '⏰',
  ATTENDANCE_CHECKIN: '🟢',
  ATTENDANCE_CHECKOUT: '🔴',
};

interface NotificationListProps {
  accent: 'indigo' | 'sky' | 'emerald';
}

export default function NotificationList({ accent }: NotificationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSky = accent === 'sky';
  const isEmerald = accent === 'emerald';

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          {notifications.map((notification) => (
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
              <span className="text-xl mt-0.5 shrink-0">
                {TYPE_ICON[notification.type] || '🔔'}
              </span>

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
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
