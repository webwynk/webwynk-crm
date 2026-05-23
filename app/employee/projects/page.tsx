"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { cn, formatDate, getInitials } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  type: string;
  status: string;
  coverImage: string | null;
  startDate: string;
  dueDate: string | null;
  progress: number;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }>;
  _count: { assignments: number };
}

const FILTER_TABS = [
  { label: 'All Projects', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on-hold' },
];

export default function EmployeeProjectsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['employee-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !search ||
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.clientName.toLowerCase().includes(search.toLowerCase()) ||
      project.type.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (activeFilter === 'in-progress') {
      matchesFilter = project.status === 'ACTIVE' || project.status === 'IN_PROGRESS';
    } else if (activeFilter === 'completed') {
      matchesFilter = project.status === 'COMPLETED';
    } else if (activeFilter === 'on-hold') {
      matchesFilter = project.status === 'ON_HOLD';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <PageWrapper>
      <PageHeader
        title="My Projects"
        subtitle="View and manage the projects assigned to you"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project title, client name, type..."
            className="pl-9 text-sm h-9 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg p-1 overflow-x-auto shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                activeFilter === tab.value
                  ? 'bg-card shadow-sm text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">
            <FolderKanban className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-zinc-850 dark:text-zinc-200 mb-1">
              No Projects Found
            </h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 max-w-xs">
              {search || activeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'You are not assigned to any projects yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="premium-card flex flex-col group border border-border bg-card rounded-xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/20"
            >
              {/* Cover Gradient/Image */}
              <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative p-4 flex flex-col justify-between">
                {project.coverImage && (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-102 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                <div className="flex justify-between items-start z-10">
                  <span className="bg-black/30 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {project.type.replace('_', ' ')}
                  </span>
                  <StatusBadge status={project.status} />
                </div>

                <div className="z-10">
                  <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm group-hover:text-emerald-50 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-white/80 text-[10px] mt-0.5">
                    Client: {project.clientName}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>

                {/* Date and Progress */}
                <div className="space-y-3.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-[11px] text-zinc-450 dark:text-zinc-550 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      Due: {project.dueDate ? formatDate(project.dueDate) : 'No due date'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      {project.progress}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Team & Button */}
                <div className="flex items-center justify-between pt-1">
                  {/* Assignees */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.assignments.map((assignment) => {
                      const initials = getInitials(assignment.user.name);
                      return (
                        <Avatar
                          key={assignment.id}
                          className="w-6 h-6 border-2 border-card ring-1 ring-border"
                          title={assignment.user.name}
                        >
                          <AvatarImage
                            src={assignment.user.avatar || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-zinc-100 text-zinc-700 text-[8px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>

                  <Link
                    href={`/employee/projects/${project.id}`}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 group/link"
                  >
                    View details
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
