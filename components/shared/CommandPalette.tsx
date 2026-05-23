"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  Banknote,
  MessageSquare,
  UserCircle,
  Bell,
  Activity,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';

interface CommandProject {
  id: string;
  title: string;
  clientName: string;
  progress: number;
}

interface CommandEmployee {
  id: string;
  name: string;
  email: string;
  designation?: string | null;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch projects for search
  const { data: projects = [] } = useQuery<CommandProject[]>({
    queryKey: ['cmd-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      return res.ok ? res.json() : [];
    },
    enabled: open && !!session?.user,
    staleTime: 60_000,
  });

  // Fetch employees for search (Admin / HR only)
  const { data: employees = [] } = useQuery<CommandEmployee[]>({
    queryKey: ['cmd-employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      return res.ok ? res.json() : [];
    },
    enabled: open && !!session?.user && (session.user.role === 'ADMIN' || session.user.role === 'HR'),
    staleTime: 60_000,
  });

  if (!session?.user) return null;
  const role = session.user.role;

  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  // Define navigation items based on role
  const navItems = {
    ADMIN: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
      { label: 'Employees', href: '/admin/employees', icon: Users },
      { label: 'Attendance', href: '/admin/attendance', icon: Clock },
      { label: 'Salary', href: '/admin/salary', icon: Banknote },
      { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Activity Log', href: '/admin/activity', icon: Activity },
    ],
    HR: [
      { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Attendance', href: '/hr/attendance', icon: Clock },
      { label: 'Salary', href: '/hr/salary', icon: Banknote },
      { label: 'Chat', href: '/hr/chat', icon: MessageSquare },
      { label: 'Notifications', href: '/hr/notifications', icon: Bell },
    ],
    EMPLOYEE: [
      { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
      { label: 'My Projects', href: '/employee/projects', icon: FolderKanban },
      { label: 'Attendance', href: '/employee/attendance', icon: Clock },
      { label: 'My Salary', href: '/employee/salary', icon: Banknote },
      { label: 'Chat', href: '/employee/chat', icon: MessageSquare },
      { label: 'Profile', href: '/employee/profile', icon: UserCircle },
      { label: 'Notifications', href: '/employee/notifications', icon: Bell },
    ],
  }[role] || [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="py-2">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="cursor-pointer"
              >
                <Icon className="w-4 h-4 mr-2" />
                <span>Go to {item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Projects Search Group */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() =>
                    runCommand(() =>
                      router.push(role === 'EMPLOYEE' ? `/employee/projects/${project.id}` : `/admin/projects/${project.id}`)
                    )
                  }
                  className="cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 mr-2 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs leading-none">{project.title}</span>
                    <span className="text-[10px] text-zinc-400 mt-1">{project.clientName} · {project.progress}%</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Employees Search Group */}
        {employees.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Employees">
              {employees.map((emp) => (
                <CommandItem
                  key={emp.id}
                  onSelect={() =>
                    runCommand(() =>
                      router.push(role === 'ADMIN' ? `/admin/employees` : `/hr/employees`)
                    )
                  }
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4 mr-2 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs leading-none">{emp.name}</span>
                    <span className="text-[10px] text-zinc-400 mt-1">{emp.designation || 'Team Member'} · {emp.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Settings / Actions Group */}
        <CommandSeparator />
        <CommandGroup heading="System Commands">
          <CommandItem
            onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 mr-2 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 mr-2 text-indigo-500" />
            )}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => signOut({ callbackUrl: '/' }))}
            className="text-rose-500 focus:text-rose-500 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sign Out / Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
