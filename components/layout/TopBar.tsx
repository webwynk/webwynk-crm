"use client";

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useUIStore } from '@/store/uiStore';
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from '@/components/shared/ThemeToggle';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import RoleBadge from '@/components/shared/RoleBadge';

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleSidebar } = useUIStore();

  // Resolve Page Title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'WebWynk CRM';
    
    // Get the last segment
    const lastSegment = segments[segments.length - 1];
    
    // Map segments to friendly names
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      projects: 'Projects Management',
      employees: 'Employees Directory',
      attendance: 'Attendance Logs',
      salary: 'Salary Payroll',
      activity: 'Activity Audit Log',
      chat: 'Global Team Chat',
      notifications: 'Notifications Center',
      profile: 'My Profile Settings',
    };

    return titleMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/notifications/unread-count');
        if (!res.ok) return 0;
        const data = await res.json();
        return data.count || 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 15000, // Poll every 15s
    initialData: 0,
  });


  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const user = session?.user;
  const userRole = user?.role?.toLowerCase() || 'employee';

  return (
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 select-none">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:flex hidden text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Command Palette Hint (Hidden on Mobile) */}
      <button
        className="hidden lg:flex items-center gap-2 max-w-xs w-full mx-8 px-3 h-9 rounded-lg border border-border bg-zinc-50/60 dark:bg-zinc-900/30 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer select-none"
        onClick={() => {
          const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
          document.dispatchEvent(event);
        }}
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left text-sm">Search or jump to...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] font-mono text-zinc-400 font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile cmd+K hint */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
          aria-label="Open search"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
        >
          <Search className="w-[18px] h-[18px]" />
        </Button>

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <Link
          href={`/${userRole}/notifications`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            "relative text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
          )}
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-card px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="w-[1px] h-6 bg-border hidden sm:block" />

        {/* User Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 h-auto hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-xl"
                />
              }
            >
              <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={user.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-xs">
                  {getInitials(user.name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block max-w-[120px]">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-none">
                  {user.name}
                </p>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate block">
                  {user.designation || 'Team Member'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-modal border-border">
              <DropdownMenuLabel className="font-sans">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-zinc-400 font-normal truncate">{user.email}</span>
                  <div className="mt-1">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem
                render={
                  <Link href={`/${userRole}/dashboard`} className="flex items-center gap-2" />
                }
                className="cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-900/40 py-2.5"
              >
                <User className="w-4 h-4 text-zinc-450" />
                <span>Dashboard</span>
              </DropdownMenuItem>

              {user.role === 'EMPLOYEE' && (
                <DropdownMenuItem
                  render={
                    <Link href="/employee/profile" className="flex items-center gap-2" />
                  }
                  className="cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-900/40 py-2.5"
                >
                  <Settings className="w-4 h-4 text-zinc-450" />
                  <span>My Profile</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-500/10 py-2.5"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
