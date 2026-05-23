"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  iconColor?: string;
  iconBg?: string;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = 'text-zinc-400 dark:text-zinc-500',
  iconBg = 'bg-zinc-100 dark:bg-zinc-800/60',
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon container */}
      <div className={cn('rounded-2xl p-4 mb-4 ring-1 ring-border', iconBg)}>
        <Icon className={cn(compact ? 'w-7 h-7' : 'w-9 h-9', iconColor)} />
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn('text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}

      {/* CTA Button */}
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
