"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useUIStore } from '@/store/uiStore';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import RoleBadge from '../shared/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export interface NavItemSpec {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    avatar?: string | null;
    designation?: string | null;
  };
  items: NavItemSpec[];
  accentColor: 'indigo' | 'sky' | 'emerald';
}

export default function Sidebar({ user, items, accentColor }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const accentStyles = {
    indigo: {
      textActive: 'text-indigo-600 dark:text-indigo-400',
      bgActive: 'bg-indigo-50 dark:bg-indigo-500/10',
      borderLeft: 'before:bg-indigo-500',
    },
    sky: {
      textActive: 'text-sky-600 dark:text-sky-400',
      bgActive: 'bg-sky-50 dark:bg-sky-500/10',
      borderLeft: 'before:bg-sky-500',
    },
    emerald: {
      textActive: 'text-emerald-600 dark:text-emerald-400',
      bgActive: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderLeft: 'before:bg-emerald-500',
    },
  }[accentColor];

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className={`h-screen flex flex-col justify-between border-r border-border bg-card transition-all duration-300 relative select-none hidden md:flex ${
        sidebarCollapsed ? 'w-[70px]' : 'w-[245px]'
      }`}
    >
      {/* Sidebar Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-border bg-card shadow-sm z-50 hover:bg-muted"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-zinc-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-zinc-500" />
        )}
      </Button>

      {/* Top Section: Brand */}
      <div>
        <div className={`p-5 flex items-center gap-3 border-b border-border ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
              accentColor === 'indigo'
                ? 'bg-indigo-500'
                : accentColor === 'sky'
                ? 'bg-sky-500'
                : 'bg-emerald-500'
            }`}
          >
            <span className="font-bold text-base tracking-wider">W</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              Web<span className={accentColor === 'indigo' ? 'text-indigo-500' : accentColor === 'sky' ? 'text-sky-500' : 'text-emerald-500'}>Wynk</span>
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? `${accentStyles.textActive} ${accentStyles.bgActive} font-semibold sidebar-item-active ${accentStyles.borderLeft}`
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? '' : 'text-zinc-450 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-350'}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}

                {/* Collapsed Tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-[75px] bg-zinc-950 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md z-[100] border border-zinc-800">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Info & Logout */}
      <div className={`p-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/10 ${sidebarCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        {!sidebarCollapsed ? (
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-850">
                <AvatarImage src={user.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                  {user.designation || 'Team Member'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <RoleBadge role={user.role} />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg border border-zinc-250/30 text-zinc-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:border-zinc-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 group relative cursor-pointer">
              <AvatarImage src={user.avatar || undefined} className="object-cover" />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg border border-border text-zinc-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
