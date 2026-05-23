import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  loading?: boolean;
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  trend,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-50 dark:bg-primary-500/10',
  accentColor = '#6366f1',
  loading = false,
}: StatsCardProps) {
  const animatedValue = useCountUp(value);

  if (loading) {
    return (
      <Card className="premium-card p-5 space-y-4 overflow-hidden">
        <div className="flex items-start justify-between">
          <Skeleton className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="w-16 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-20 h-8 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden premium-card p-5 flex flex-col justify-between gap-4',
        'transition-all duration-200'
      )}
    >
      {/* Accent top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor}33)` }}
      />

      {/* Subtle background glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] blur-xl pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* Header row: icon + trend chip */}
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-xl shrink-0', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full select-none',
              trend.isPositive
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {/* Value + label */}
      <div>
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans tabular-nums">
          {animatedValue}
        </span>
        <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
          {label}
        </h4>
        {trend && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            {trend.label}
          </p>
        )}
      </div>
    </Card>
  );
}
