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
  MoreHorizontal,
  Bell,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

  // Define main items (shown in bar) and more items (shown in dropdown)
  const getNavItems = (): { main: MobileNavItem[]; more: MobileNavItem[] } => {
    switch (role) {
      case 'ADMIN':
        return {
          main: [
            { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
            { label: 'Employees', href: '/admin/employees', icon: Users },
            { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
          ],
          more: [
            { label: 'Attendance', href: '/admin/attendance', icon: Clock },
            { label: 'Salary', href: '/admin/salary', icon: Banknote },
            { label: 'Notifications', href: '/admin/notifications', icon: Bell },
            { label: 'Activity Log', href: '/admin/activity', icon: Activity },
          ],
        };
      case 'HR':
        return {
          main: [
            { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
            { label: 'Employees', href: '/hr/employees', icon: Users },
            { label: 'Attendance', href: '/hr/attendance', icon: Clock },
            { label: 'Chat', href: '/hr/chat', icon: MessageSquare },
          ],
          more: [
            { label: 'Salary', href: '/hr/salary', icon: Banknote },
            { label: 'Notifications', href: '/hr/notifications', icon: Bell },
          ],
        };
      case 'EMPLOYEE':
        return {
          main: [
            { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
            { label: 'Projects', href: '/employee/projects', icon: FolderKanban },
            { label: 'Attendance', href: '/employee/attendance', icon: Clock },
            { label: 'Chat', href: '/employee/chat', icon: MessageSquare },
          ],
          more: [
            { label: 'My Salary', href: '/employee/salary', icon: Banknote },
            { label: 'Profile', href: '/employee/profile', icon: UserCircle },
            { label: 'Notifications', href: '/employee/notifications', icon: Bell },
          ],
        };
      default:
        return { main: [], more: [] };
    }
  };

  const { main, more } = getNavItems();
  const isMoreActive = more.some((item) => pathname.startsWith(item.href));

  const accentColor = {
    ADMIN: 'text-indigo-600 dark:text-indigo-400 font-semibold',
    HR: 'text-sky-600 dark:text-sky-400 font-semibold',
    EMPLOYEE: 'text-emerald-600 dark:text-emerald-400 font-semibold',
  }[role] || 'text-indigo-600';

  const dotColor = {
    ADMIN: 'bg-indigo-500',
    HR: 'bg-sky-500',
    EMPLOYEE: 'bg-emerald-500',
  }[role] || 'bg-indigo-500';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/95 backdrop-blur-lg flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] select-none">
      {main.map((item) => {
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
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isActive ? accentColor : 'hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </motion.div>

            {/* Active Dot Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabDot"
                className={cn("absolute bottom-1 w-1 h-1 rounded-full", dotColor)}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}

      {/* More Button */}
      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center flex-1 h-full relative py-1 text-zinc-455 dark:text-zinc-500 outline-none cursor-pointer">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isMoreActive ? accentColor : 'hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <MoreHorizontal className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-tight">More</span>
            </motion.div>

            {isMoreActive && (
              <motion.div
                layoutId="activeTabDot"
                className={cn("absolute bottom-1 w-1 h-1 rounded-full", dotColor)}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="top"
            className="w-40 bg-card border-border/80 rounded-xl mb-1 shadow-xl p-1 z-50"
          >
            {more.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <DropdownMenuItem key={item.href} className="focus:bg-muted rounded-lg p-0">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 w-full text-xs font-medium transition-colors duration-150",
                      isActive
                        ? accentColor
                        : "text-zinc-650 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
