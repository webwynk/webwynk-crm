"use client";

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  Banknote,
  Activity,
  MessageSquare,
  Bell,
} from 'lucide-react';
import Sidebar, { NavItemSpec } from './Sidebar';

interface AdminSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    avatar?: string | null;
    designation?: string | null;
  };
}

const adminNavItems: NavItemSpec[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    label: 'Projects',
    href: '/admin/projects',
    icon: FolderKanban,
    group: 'Management',
  },
  {
    label: 'Employees',
    href: '/admin/employees',
    icon: Users,
    group: 'Management',
  },
  {
    label: 'Attendance',
    href: '/admin/attendance',
    icon: Clock,
    group: 'Management',
  },
  {
    label: 'Salary',
    href: '/admin/salary',
    icon: Banknote,
    group: 'Management',
  },
  {
    label: 'Chat',
    href: '/admin/chat',
    icon: MessageSquare,
    group: 'Communication',
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    group: 'Communication',
  },
  {
    label: 'Activity Log',
    href: '/admin/activity',
    icon: Activity,
    group: 'Audit',
  },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  return <Sidebar user={user} items={adminNavItems} accentColor="indigo" />;
}
