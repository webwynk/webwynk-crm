"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Grid3X3,
  Columns,
  Search,
  FolderKanban,
  Loader2,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectCreateModal from '@/components/projects/ProjectCreateModal';
import ProjectKanban from '@/components/projects/ProjectKanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { ProjectStatus } from '@prisma/client';

interface Project {
  id: string;
  title: string;
  clientName: string;
  type: string;
  status: string;
  coverImage: string | null;
  progress: number;
  dueDate: string | null;
  assignments: Array<{
    user: { id: string; name: string; avatar: string | null };
  }>;
  _count: { assignments: number };
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'grid' | 'kanban'>('grid');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activeStatus, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (search) params.set('search', search);
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    staleTime: 30_000,
  });

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project status updated');
    } catch {
      toast.error('Failed to update project status');
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} found`}
      >
        {/* View Toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('grid')}
            className={cn(
              'rounded-none px-3 h-8',
              view === 'grid' && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('kanban')}
            className={cn(
              'rounded-none px-3 h-8',
              view === 'kanban' && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
            )}
          >
            <Columns className="w-4 h-4" />
          </Button>
        </div>

        <Button
          id="new-project-btn"
          onClick={() => setShowCreateModal(true)}
          className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </PageHeader>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg p-1 overflow-x-auto shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                activeStatus === tab.value
                  ? 'bg-card shadow-sm text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            id="projects-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project title or client..."
            className="pl-9 text-sm h-9"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              clientName={project.clientName}
              type={project.type as never}
              status={project.status as never}
              coverImage={project.coverImage}
              progress={project.progress}
              dueDate={project.dueDate}
              assignees={project.assignments.map((a) => a.user)}
              totalAssignees={project._count.assignments}
            />
          ))}
        </div>
      ) : (
        <ProjectKanban
          projects={projects as never}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create Modal */}
      <ProjectCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </PageWrapper>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
        <FolderKanban className="w-8 h-8 text-indigo-400" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">No projects found</h3>
        <p className="text-sm text-zinc-400 max-w-xs">
          Get started by creating your first project. You can assign team members and track progress.
        </p>
      </div>
      <Button
        onClick={onCreateClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Create First Project
      </Button>
    </div>
  );
}
