"use client";

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FolderKanban,
  Users,
  Clock,
  Activity,
  ArrowRight,
  Banknote,

} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import AvatarStack from '@/components/shared/AvatarStack';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo, PROJECT_TYPE_CONFIG } from '@/lib/utils';


interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalEmployees: number;
  todayAttendance: number;
  attendanceRate: number;
  pendingSalaries: number;
  recentProjects: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    progress: number;
    dueDate: string | null;
    assignments: Array<{ user: { id: string; name: string; avatar: string | null } }>;
    _count: { assignments: number };
  }>;
}

interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

const ACTION_LABEL: Record<string, { label: string; icon: string }> = {
  created_project: { label: 'Created a project', icon: '📁' },
  updated_project: { label: 'Updated a project', icon: '✏️' },
  project_completed: { label: 'Completed a project', icon: '✅' },
  deleted_project: { label: 'Deleted a project', icon: '🗑️' },
  created_employee: { label: 'Added an employee', icon: '👤' },
  created_salary: { label: 'Created salary record', icon: '💼' },
  salary_paid: { label: 'Paid salary', icon: '💰' },
  marked_absent: { label: 'Marked absent', icon: '📋' },
  checked_in: { label: 'Checked in', icon: '🟢' },
  checked_out: { label: 'Checked out', icon: '🔴' },
  updated_profile: { label: 'Updated profile', icon: '⚙️' },
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 60_000, // Re-fetch every minute
    staleTime: 30_000,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await fetch('/api/admin/recent-activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Admin'} 👋
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Here is what is happening with WebWynk today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={FolderKanban}
            value={statsLoading ? '...' : stats?.totalProjects ?? 0}
            label="Total Projects"
            trend={{
              value: `${stats?.activeProjects ?? 0} active`,
              isPositive: true,
              label: 'currently running',
            }}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
            loading={statsLoading}
          />
          <StatsCard
            icon={Users}
            value={statsLoading ? '...' : stats?.totalEmployees ?? 0}
            label="Total Employees"
            trend={{
              value: 'HR + Staff',
              isPositive: true,
              label: 'active team members',
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
            label="Today's Attendance"
            trend={{
              value: `${stats?.attendanceRate ?? 0}%`,
              isPositive: (stats?.attendanceRate ?? 0) >= 70,
              label: 'presence rate today',
            }}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            loading={statsLoading}
          />
          <StatsCard
            icon={Banknote}
            value={statsLoading ? '...' : stats?.pendingSalaries ?? 0}
            label="Pending Salaries"
            trend={{
              value: stats?.pendingSalaries === 0 ? 'All paid' : 'Needs action',
              isPositive: stats?.pendingSalaries === 0,
              label: 'salary payments',
            }}
            iconColor="text-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-500/10"
            loading={statsLoading}
          />
        </div>

        {/* Main Content: Recent Projects + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 border border-border bg-card rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                  Recent Projects
                </h3>
              </div>
              <Link
                href="/admin/projects"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48 bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-2.5 w-24 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))
              ) : stats?.recentProjects?.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FolderKanban className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No projects yet. Create one to get started.</p>
                </div>
              ) : (
                stats?.recentProjects?.map((project) => {
                  const typeConfig = PROJECT_TYPE_CONFIG[project.type as keyof typeof PROJECT_TYPE_CONFIG];
                  return (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors group"
                    >
                      {/* Type icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${typeConfig?.bg || 'bg-zinc-100'}`}>
                        {getTypeEmoji(project.type)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={project.status} />
                          <span className="text-[10px] text-zinc-400">{project.progress}% done</span>
                        </div>
                      </div>

                      {/* Assignees */}
                      <AvatarStack
                        users={project.assignments.map((a) => a.user)}
                        max={3}
                        size="sm"
                        className="shrink-0"
                      />
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border border-border bg-card rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-500" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                  Recent Activity
                </h3>
              </div>
              <Link
                href="/admin/activity"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-y-auto divide-y divide-border">
              {activitiesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full bg-zinc-200 dark:bg-zinc-800" />
                      <Skeleton className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Activity className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No activity recorded yet.</p>
                </div>
              ) : (
                activities.map((log) => {
                  const actionInfo = ACTION_LABEL[log.action] || {
                    label: log.action.replace(/_/g, ' '),
                    icon: '📌',
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-2.5 px-4 py-3">
                      <span className="text-base shrink-0 mt-0.5">{actionInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                          <span className="font-semibold">{log.actorName}</span>{' '}
                          {actionInfo.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {timeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    WEBSITE_DEVELOPMENT: '🌐',
    SEO: '📈',
    APP_DEVELOPMENT: '📱',
    SOCIAL_MEDIA: '📣',
    BRANDING: '🎨',
    OTHER: '📁',
  };
  return emojis[type] || '📁';
}
