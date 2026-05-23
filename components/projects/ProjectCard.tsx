"use client";

import Link from 'next/link';
import { Calendar, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/shared/StatusBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import AvatarStack from '@/components/shared/AvatarStack';
import { cn, formatDate, PROJECT_TYPE_CONFIG } from '@/lib/utils';
import type { ProjectStatus, ProjectType } from '@prisma/client';

interface ProjectCardUser {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ProjectCardProps {
  id: string;
  title: string;
  clientName: string;
  type: ProjectType;
  status: ProjectStatus;
  coverImage?: string | null;
  progress: number;
  dueDate?: string | Date | null;
  assignees: ProjectCardUser[];
  totalAssignees?: number;
  href?: string;
  className?: string;
}

export default function ProjectCard({
  id,
  title,
  clientName,
  type,
  status,
  coverImage,
  progress,
  dueDate,
  assignees,
  href,
  className,
}: ProjectCardProps) {
  const typeConfig = PROJECT_TYPE_CONFIG[type];
  const linkHref = href || `/admin/projects/${id}`;

  return (
    <Link href={linkHref} className="block group">
      <Card
        className={cn(
          'premium-card overflow-hidden cursor-pointer',
          className
        )}
      >
        {/* Cover Image */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 overflow-hidden">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${getTypeGradient(type)})`,
              }}
            >
              <span className="text-3xl opacity-30 select-none">
                {getTypeEmoji(type)}
              </span>
            </div>
          )}

          {/* Urgency badge - top right */}
          {dueDate && (
            <div className="absolute top-2 right-2">
              <DeadlineBadge dueDate={dueDate} />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                typeConfig.bg,
                typeConfig.color
              )}
            >
              {typeConfig.label}
            </span>
            <StatusBadge status={status} />
          </div>

          {/* Title */}
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                {clientName}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 font-medium">Progress</span>
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Footer: assignees + due date */}
          <div className="flex items-center justify-between pt-1">
            <AvatarStack users={assignees} max={4} />
            {dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatDate(dueDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Helpers ──────────────────────────────────────────────
function getTypeGradient(type: ProjectType): string {
  const gradients: Record<ProjectType, string> = {
    WEBSITE_DEVELOPMENT: '#ede9fe, #c4b5fd',
    SEO: '#fef3c7, #fde68a',
    APP_DEVELOPMENT: '#dbeafe, #bfdbfe',
    SOCIAL_MEDIA: '#fce7f3, #fbcfe8',
    BRANDING: '#ffedd5, #fed7aa',
    OTHER: '#f1f5f9, #e2e8f0',
  };
  return gradients[type] || '#f1f5f9, #e2e8f0';
}

function getTypeEmoji(type: ProjectType): string {
  const emojis: Record<ProjectType, string> = {
    WEBSITE_DEVELOPMENT: '🌐',
    SEO: '📈',
    APP_DEVELOPMENT: '📱',
    SOCIAL_MEDIA: '📣',
    BRANDING: '🎨',
    OTHER: '📁',
  };
  return emojis[type] || '📁';
}
