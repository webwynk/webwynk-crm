"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  Banknote,
  MessageSquare,
  UserCircle,
} from 'lucide-react';

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session?.user) return null;

  const role = session.user.role;

  // Define navigation items based on role
  const getNavItems = (): MobileNavItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
          { label: 'Employees', href: '/admin/employees', icon: Users },
          { label: 'Attendance', href: '/admin/attendance', icon: Clock },
          { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
        ];
      case 'HR':
        return [
          { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
          { label: 'Employees', href: '/hr/employees', icon: Users },
          { label: 'Attendance', href: '/hr/attendance', icon: Clock },
          { label: 'Salary', href: '/hr/salary', icon: Banknote },
          { label: 'Chat', href: '/hr/chat', icon: MessageSquare },
        ];
      case 'EMPLOYEE':
        return [
          { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
          { label: 'Projects', href: '/employee/projects', icon: FolderKanban },
          { label: 'Attendance', href: '/employee/attendance', icon: Clock },
          { label: 'Chat', href: '/employee/chat', icon: MessageSquare },
          { label: 'Profile', href: '/employee/profile', icon: UserCircle },
        ];
      default:
        return [];
    }
  };

  const items = getNavItems();
  const accentColor = {
    ADMIN: 'bg-indigo-500 text-indigo-600 dark:text-indigo-400',
    HR: 'bg-sky-500 text-sky-600 dark:text-sky-400',
    EMPLOYEE: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400',
  }[role] || 'bg-indigo-500 text-indigo-600';

  const dotColor = {
    ADMIN: 'bg-indigo-500',
    HR: 'bg-sky-500',
    EMPLOYEE: 'bg-emerald-500',
  }[role] || 'bg-indigo-500';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/90 backdrop-blur-lg flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] select-none">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full relative py-1 text-zinc-450 dark:text-zinc-500"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center gap-1 ${
                isActive ? accentColor + ' font-semibold' : 'hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </motion.div>

            {/* Active Dot Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabDot"
                className={`absolute bottom-1 w-1 h-1 rounded-full ${dotColor}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
