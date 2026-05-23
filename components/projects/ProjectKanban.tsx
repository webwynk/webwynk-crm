"use client";

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import AvatarStack from '@/components/shared/AvatarStack';
import { Progress } from '@/components/ui/progress';
import { cn, PROJECT_TYPE_CONFIG } from '@/lib/utils';
import type { ProjectStatus, ProjectType } from '@prisma/client';

interface KanbanProject {
  id: string;
  title: string;
  clientName: string;
  type: ProjectType;
  status: ProjectStatus;
  progress: number;
  dueDate: string | null;
  assignments: Array<{
    user: { id: string; name: string; avatar: string | null };
  }>;
}

interface ProjectKanbanProps {
  projects: KanbanProject[];
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
}

const COLUMNS: { key: ProjectStatus; label: string; color: string; headerBg: string }[] = [
  { key: 'ACTIVE', label: 'Active', color: 'border-emerald-300 dark:border-emerald-500/40', headerBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-300 dark:border-blue-500/40', headerBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { key: 'ON_HOLD', label: 'On Hold', color: 'border-amber-300 dark:border-amber-500/40', headerBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { key: 'COMPLETED', label: 'Completed', color: 'border-slate-200 dark:border-slate-500/30', headerBg: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400' },
];

export default function ProjectKanban({ projects, onStatusChange }: ProjectKanbanProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(columnKey);
  };

  const handleDrop = (e: React.DragEvent, columnKey: ProjectStatus) => {
    e.preventDefault();
    if (draggingId && draggingId !== columnKey) {
      const project = projects.find((p) => p.id === draggingId);
      if (project && project.status !== columnKey) {
        onStatusChange(draggingId, columnKey);
      }
    }
    setDraggingId(null);
    setOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.key);
        const isOver = overColumn === col.key;

        return (
          <div
            key={col.key}
            className="flex flex-col gap-3 min-w-[280px] w-[280px] shrink-0"
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            onDragLeave={() => setOverColumn(null)}
          >
            {/* Column Header */}
            <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg border', col.color, col.headerBg)}>
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="text-xs font-bold opacity-70 bg-white/30 dark:bg-black/20 rounded-full px-2 py-0.5">
                {colProjects.length}
              </span>
            </div>

            {/* Drop Zone */}
            <div
              className={cn(
                'flex-1 flex flex-col gap-2 min-h-[200px] rounded-xl border-2 border-dashed p-1 transition-colors',
                isOver
                  ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5'
                  : 'border-transparent'
              )}
            >
              {colProjects.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-zinc-300 dark:text-zinc-600 select-none">
                    Drop projects here
                  </p>
                </div>
              )}

              {colProjects.map((project) => (
                <KanbanCard
                  key={project.id}
                  project={project}
                  isDragging={draggingId === project.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  project,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  project: KanbanProject;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.type];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'group bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-card-hover transition-all select-none',
        isDragging && 'opacity-40 scale-95 shadow-none'
      )}
    >
      {/* Title + drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0 group-hover:text-zinc-400" />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
            {project.title}
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{project.clientName}</p>
        </div>
      </div>

      {/* Type badge */}
      <span className={cn(
        'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full border mb-2',
        typeConfig.bg,
        typeConfig.color
      )}>
        {typeConfig.label}
      </span>

      {/* Progress */}
      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span className="text-xs text-zinc-400">Progress</span>
          <span className="text-xs font-semibold text-zinc-500">{project.progress}%</span>
        </div>
        <Progress
          value={project.progress}
          className="h-1"
          indicatorClassName={
            project.progress < 30
              ? 'bg-rose-500'
              : project.progress < 70
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <AvatarStack users={project.assignments.map((a) => a.user)} max={3} size="sm" />
        {project.dueDate && (
          <DeadlineBadge dueDate={project.dueDate} compact />
        )}
      </div>
    </div>
  );
}
