import { differenceInDays, format } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';

interface DeadlineBadgeProps {
  dueDate: Date | string | null | undefined;
  compact?: boolean;
}

export default function DeadlineBadge({ dueDate, compact = false }: DeadlineBadgeProps) {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const today = new Date();
  const diffDays = differenceInDays(date, today);

  if (diffDays <= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 ring-1 ring-rose-400/40 select-none">
        <AlertCircle className="w-3 h-3" />
        {compact ? <span>!</span> : <span>URGENT</span>}
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 select-none">
        <Clock className="w-3 h-3" />
        {compact ? `${diffDays}d` : `Due soon (${diffDays}d)`}
      </span>
    );
  }

  if (compact) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 select-none">
      <span>Due: {format(date, 'MMM d, yyyy')}</span>
    </span>
  );
}
