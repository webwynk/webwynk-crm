interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const badgeConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    // Project statuses
    ACTIVE: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-450', dot: 'bg-emerald-500', label: 'Active' },
    IN_PROGRESS: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'In Progress' },
    COMPLETED: { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-400', label: 'Completed' },
    ON_HOLD: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'On Hold' },
    CANCELLED: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', label: 'Cancelled' },

    // Attendance statuses
    PRESENT: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-450', dot: 'bg-emerald-500', label: 'Present' },
    ABSENT: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', label: 'Absent' },
    INCOMPLETE: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-450', dot: 'bg-amber-500', label: 'Incomplete' },

    // Salary statuses
    PENDING: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Pending' },
    PAID: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-450', dot: 'bg-emerald-500', label: 'Paid' },
    PARTIAL: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-400', label: 'Partial' },
  };

  const normalized = status.toUpperCase().replace(' ', '_');
  const config = badgeConfig[normalized] || {
    bg: 'bg-zinc-50 dark:bg-zinc-500/10',
    text: 'text-zinc-700 dark:text-zinc-400',
    dot: 'bg-zinc-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent select-none ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
