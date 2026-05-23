"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Users,
  Search,
  Mail,
  Phone,
  Loader2,
  Circle,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeCreateModal from '@/components/employees/EmployeeCreateModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBadge from '@/components/shared/RoleBadge';
import { cn, getInitials } from '@/lib/utils';
import { usePresence } from '@/components/providers/PresenceTracker';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  designation: string | null;
  bio: string | null;
  isOnline: boolean;
  createdAt: string;
  _count: { assignedProjects: number; attendance: number };
}

interface EmployeeManagerProps {
  role: 'ADMIN' | 'HR';
}

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: '🟢 Online', value: 'online' },
  { label: '⚫ Offline', value: 'offline' },
];

export default function EmployeeManager({ role }: EmployeeManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { onlineUserIds } = usePresence();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
    staleTime: 30_000,
  });

  const employeesWithPresence = employees.map((emp) => ({
    ...emp,
    isOnline: onlineUserIds.includes(emp.id),
  }));

  // Filter employees
  const filtered = employeesWithPresence.filter((emp) => {
    const matchesSearch =
      !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'online' && emp.isOnline) ||
      (activeFilter === 'offline' && !emp.isOnline);

    return matchesSearch && matchesFilter;
  });

  const onlineCount = employeesWithPresence.filter((e) => e.isOnline).length;
  const isHR = role === 'HR';

  return (
    <PageWrapper>
      <PageHeader
        title="Employee Directory"
        subtitle={`${employees.length} team members`}
      >
        {!isHR && (
          <Button
            id="add-employee-btn"
            onClick={() => setShowCreateModal(true)}
            className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        )}
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg p-1 shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                activeFilter === tab.value
                  ? 'bg-card shadow-sm text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            id="employees-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or designation..."
            className={cn(
              'pl-9 text-sm h-9',
              isHR ? 'focus-visible:ring-sky-500' : 'focus-visible:ring-indigo-500'
            )}
          />
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-3 py-1.5">
          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
          <span>{onlineCount} online now</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          role={role}
          onAddClick={() => setShowCreateModal(true)}
          hasFilter={!!search || activeFilter !== 'all'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} role={role} />
          ))}
        </div>
      )}

      {/* Create Modal - Admin only */}
      {!isHR && (
        <EmployeeCreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
        />
      )}
    </PageWrapper>
  );
}

function EmployeeCard({ employee, role }: { employee: Employee; role: 'ADMIN' | 'HR' }) {
  const isHR = role === 'HR';
  return (
    <div className={cn(
      'premium-card p-4 flex flex-col gap-3 group border border-border bg-card rounded-xl shadow-card transition-all duration-300 hover:shadow-md',
      isHR ? 'hover:border-sky-200 dark:hover:border-sky-500/30' : 'hover:border-indigo-200 dark:hover:border-indigo-500/30'
    )}>
      {/* Avatar + Online indicator */}
      <div className="flex items-start justify-between">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-border">
            <AvatarImage src={employee.avatar || undefined} className="object-cover" />
            <AvatarFallback className={cn(
              'font-semibold text-sm',
              isHR
                ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            )}>
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          {/* Online dot */}
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
              employee.isOnline ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
            )}
          />
        </div>
        <RoleBadge role={employee.role} />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
          {employee.name}
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          {employee.designation || 'Team Member'}
        </p>
      </div>

      {/* Contact */}
      <div className="space-y-1 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        {employee.phone && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Phone className="w-3 h-3 shrink-0" />
            <span>{employee.phone}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-center pt-1">
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg py-1.5">
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {employee._count.assignedProjects}
          </p>
          <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Projects</p>
        </div>
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg py-1.5">
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {employee._count.attendance}
          </p>
          <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Days</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onAddClick,
  hasFilter,
  role,
}: {
  onAddClick: () => void;
  hasFilter: boolean;
  role: 'ADMIN' | 'HR';
}) {
  const isHR = role === 'HR';
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center border',
        isHR
          ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20'
          : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
      )}>
        <Users className={cn('w-8 h-8', isHR ? 'text-sky-500' : 'text-indigo-500')} />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          {hasFilter ? 'No employees match your search' : 'No employees yet'}
        </h3>
        <p className="text-sm text-zinc-400 max-w-xs">
          {hasFilter
            ? 'Try adjusting your filters or search term.'
            : 'No employee records are available in the system.'}
        </p>
      </div>
      {!hasFilter && !isHR && (
        <Button
          onClick={onAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add First Employee
        </Button>
      )}
    </div>
  );
}
