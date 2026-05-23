"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FolderKanban,
  Clock,
  Banknote,
  MessageSquare,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import StatsCard from '@/components/shared/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDate, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  type: string;
  status: string;
  coverImage: string | null;
  startDate: string;
  dueDate: string | null;
  progress: number;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
      designation: string | null;
    };
  }>;
  _count: { assignments: number };
}

interface DashboardStats {
  assignedProjectsCount: number;
  todayAttendance: {
    id: string;
    checkIn: string;
    checkOut: string | null;
    workHours: number | null;
    status: 'PRESENT' | 'ABSENT' | 'INCOMPLETE';
  } | null;
  lastSalary: {
    id: string;
    amount: number;
    month: string;
    paidAt: string | null;
  } | null;
  recentProjects: Project[];
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Set running clock
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['employee-dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/employee/dashboard-stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
  });

  // Fetch unread notifications count
  const { data: unreadNotifications = [] } = useQuery<unknown[]>({
    queryKey: ['employee-unread-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?unread=true');
      if (!res.ok) return [];
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
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
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
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Check out failed');
    },
  });

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
  if (stats?.todayAttendance) {
    if (stats.todayAttendance.checkOut) {
      deskStatus = 'checked_out';
    } else {
      deskStatus = 'checked_in';
    }
  }

  // Last salary note formatting
  const getLastSalaryNote = () => {
    if (!stats?.lastSalary) return 'No salary records';
    const [year, month] = stats.lastSalary.month.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    return `Received for ${monthName}`;
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Welcome back, {session?.user?.name || 'Team Member'} 👋
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Track your projects, record your daily work attendance, and coordinate with the team.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={FolderKanban}
            value={isLoading ? '...' : String(stats?.assignedProjectsCount || 0)}
            label="Assigned Projects"
            trend={{
              value: `${stats?.recentProjects?.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length || 0} active`,
              isPositive: true,
              label: 'milestones pending',
            }}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <StatsCard
            icon={Clock}
            value={
              isLoading
                ? '...'
                : stats?.todayAttendance
                ? `${stats.todayAttendance.workHours?.toFixed(1) || '0.0'} hrs`
                : '0.0 hrs'
            }
            label="Today's Hours"
            trend={
              stats?.todayAttendance
                ? stats.todayAttendance.checkOut
                  ? { value: 'Completed', isPositive: true, label: 'Checked out' }
                  : { value: 'Checked In', isPositive: true, label: `Since ${formatClockTime(stats.todayAttendance.checkIn)}` }
                : { value: 'Absent', isPositive: false, label: 'Not checked in' }
            }
            iconColor="text-sky-500"
            iconBg="bg-sky-50 dark:bg-sky-500/10"
          />
          <StatsCard
            icon={Banknote}
            value={
              isLoading
                ? '...'
                : stats?.lastSalary
                ? `₹${stats.lastSalary.amount.toLocaleString('en-IN')}`
                : '₹0'
            }
            label="Last Salary"
            trend={{
              value: stats?.lastSalary ? 'PAID' : 'PENDING',
              isPositive: !!stats?.lastSalary,
              label: getLastSalaryNote(),
            }}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <StatsCard
            icon={MessageSquare}
            value={String(unreadNotifications.length)}
            label="Unread Alerts"
            trend={{
              value: unreadNotifications.length > 0 ? `${unreadNotifications.length} new` : 'All caught up',
              isPositive: unreadNotifications.length === 0,
              label: 'notifications feed',
            }}
            iconColor="text-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-500/10"
          />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-emerald-500" />
                My Active Projects
              </h3>
              <Link
                href="/employee/projects"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
              >
                View all projects
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="border border-border bg-card rounded-xl p-12 flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : !stats?.recentProjects || stats.recentProjects.length === 0 ? (
              <Card className="border border-border bg-card rounded-xl p-12 shadow-card min-h-[300px] flex flex-col items-center justify-center text-center gap-3">
                <FolderKanban className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                <div>
                  <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    No active assignments
                  </h4>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-xs mx-auto mt-0.5">
                    You are not assigned to any projects at the moment. When the admin assigns you to a project, it will show up here.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {stats.recentProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 border border-border bg-card hover:border-emerald-250 dark:hover:border-emerald-500/20 transition-all shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                          {project.type.replace('_', ' ')}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-[11px] text-zinc-450 dark:text-zinc-500 line-clamp-1 max-w-lg">
                        {project.description || 'No description provided.'}
                      </p>
                      
                      {/* Team Avatars */}
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {project.assignments.map((assign) => (
                            <Avatar
                              key={assign.id}
                              className="w-5 h-5 border-2 border-card ring-1 ring-border"
                              title={assign.user.name}
                            >
                              <AvatarImage
                                src={assign.user.avatar || undefined}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-zinc-100 text-zinc-700 text-[7px] font-extrabold">
                                {getInitials(assign.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {project.assignments.length} team members
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-3 sm:gap-2 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border justify-between sm:justify-start">
                      {/* Due Date & Progress */}
                      <div className="text-left sm:text-right space-y-1">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 sm:justify-end">
                          <Calendar className="w-3 h-3" />
                          Due: {project.dueDate ? formatDate(project.dueDate) : 'No due date'}
                        </span>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400">
                            {project.progress}% Done
                          </span>
                          <div className="w-16 bg-zinc-150 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Link href={`/employee/projects/${project.id}`} passHref>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 gap-0.5 px-3 border border-emerald-100 dark:border-emerald-950"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Check-In Panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              Attendance Desk
            </h3>
            
            <Card className="premium-card border border-border p-6 shadow-card flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  Log your daily attendance. Ensure you check out at the end of your shifts.
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
                      Checked in at {formatClockTime(stats!.todayAttendance!.checkIn)}
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
                      Check-in: {formatClockTime(stats!.todayAttendance!.checkIn)} | Check-out: {formatClockTime(stats!.todayAttendance!.checkOut)}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400">
                      Worked {stats!.todayAttendance!.workHours} hours today
                    </p>
                  </div>
                )}

                <Link href="/employee/attendance" passHref>
                  <Button
                    variant="outline"
                    className="w-full border-zinc-200 hover:bg-zinc-50 text-xs font-semibold h-9 mt-2"
                  >
                    View Attendance History
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
