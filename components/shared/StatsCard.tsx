import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  loading?: boolean;
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  trend,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-50 dark:bg-primary-500/10',
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="premium-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="w-14 h-4 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-8 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="premium-card p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {trend && (
          <span 
            className={`text-xs font-semibold px-2 py-0.5 rounded-full select-none ${
              trend.isPositive 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          {value}
        </span>
        <h4 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
          {label}
        </h4>
        
        {trend && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-555 mt-2">
            {trend.label}
          </p>
        )}
      </div>
    </Card>
  );
}
