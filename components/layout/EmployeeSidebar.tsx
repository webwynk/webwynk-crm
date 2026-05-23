"use client";

import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  Banknote,
  MessageSquare,
  UserCircle,
  Bell,
} from 'lucide-react';
import Sidebar, { NavItemSpec } from './Sidebar';

interface EmployeeSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    avatar?: string | null;
    designation?: string | null;
  };
}

const employeeNavItems: NavItemSpec[] = [
  {
    label: 'Dashboard',
    href: '/employee/dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    label: 'My Projects',
    href: '/employee/projects',
    icon: FolderKanban,
    group: 'Workplace',
  },
  {
    label: 'Attendance',
    href: '/employee/attendance',
    icon: Clock,
    group: 'Workplace',
  },
  {
    label: 'My Salary',
    href: '/employee/salary',
    icon: Banknote,
    group: 'Workplace',
  },
  {
    label: 'Chat',
    href: '/employee/chat',
    icon: MessageSquare,
    group: 'Communication',
  },
  {
    label: 'Notifications',
    href: '/employee/notifications',
    icon: Bell,
    group: 'Communication',
  },
  {
    label: 'Profile',
    href: '/employee/profile',
    icon: UserCircle,
    group: 'Account',
  },
];

export default function EmployeeSidebar({ user }: EmployeeSidebarProps) {
  return <Sidebar user={user} items={employeeNavItems} accentColor="emerald" />;
}
