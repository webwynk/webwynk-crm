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
  },
  {
    label: 'My Projects',
    href: '/employee/projects',
    icon: FolderKanban,
  },
  {
    label: 'Attendance',
    href: '/employee/attendance',
    icon: Clock,
  },
  {
    label: 'My Salary',
    href: '/employee/salary',
    icon: Banknote,
  },
  {
    label: 'Chat',
    href: '/employee/chat',
    icon: MessageSquare,
  },
  {
    label: 'Profile',
    href: '/employee/profile',
    icon: UserCircle,
  },
  {
    label: 'Notifications',
    href: '/employee/notifications',
    icon: Bell,
  },
];

export default function EmployeeSidebar({ user }: EmployeeSidebarProps) {
  return <Sidebar user={user} items={employeeNavItems} accentColor="emerald" />;
}
