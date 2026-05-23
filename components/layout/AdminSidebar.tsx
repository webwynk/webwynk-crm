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
  },
  {
    label: 'Projects',
    href: '/admin/projects',
    icon: FolderKanban,
  },
  {
    label: 'Employees',
    href: '/admin/employees',
    icon: Users,
  },
  {
    label: 'Attendance',
    href: '/admin/attendance',
    icon: Clock,
  },
  {
    label: 'Salary',
    href: '/admin/salary',
    icon: Banknote,
  },
  {
    label: 'Activity Log',
    href: '/admin/activity',
    icon: Activity,
  },
  {
    label: 'Chat',
    href: '/admin/chat',
    icon: MessageSquare,
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  return <Sidebar user={user} items={adminNavItems} accentColor="indigo" />;
}
