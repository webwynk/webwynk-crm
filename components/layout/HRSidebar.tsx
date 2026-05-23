"use client";

import {
  LayoutDashboard,
  Clock,
  Banknote,
  MessageSquare,
  Bell,
  Users,
} from 'lucide-react';
import Sidebar, { NavItemSpec } from './Sidebar';

interface HRSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    avatar?: string | null;
    designation?: string | null;
  };
}

const hrNavItems: NavItemSpec[] = [
  {
    label: 'Dashboard',
    href: '/hr/dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    label: 'Employees',
    href: '/hr/employees',
    icon: Users,
    group: 'People',
  },
  {
    label: 'Attendance',
    href: '/hr/attendance',
    icon: Clock,
    group: 'People',
  },
  {
    label: 'Salary',
    href: '/hr/salary',
    icon: Banknote,
    group: 'People',
  },
  {
    label: 'Chat',
    href: '/hr/chat',
    icon: MessageSquare,
    group: 'Communication',
  },
  {
    label: 'Notifications',
    href: '/hr/notifications',
    icon: Bell,
    group: 'Communication',
  },
];

export default function HRSidebar({ user }: HRSidebarProps) {
  return <Sidebar user={user} items={hrNavItems} accentColor="sky" />;
}
