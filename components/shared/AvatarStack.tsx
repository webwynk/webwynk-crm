"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

interface AvatarUser {
  id: string;
  name: string;
  avatar?: string | null;
}

interface AvatarStackProps {
  users: AvatarUser[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function AvatarStack({
  users,
  max = 4,
  size = 'sm',
  className,
}: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((user) => {
        const color = getAvatarColor(user.id);
        return (
          <Avatar
            key={user.id}
            className={cn(
              sizeClasses,
              'border-2 border-card ring-0 shrink-0'
            )}
            title={user.name}
          >
            <AvatarImage src={user.avatar || undefined} className="object-cover" />
            <AvatarFallback className={cn("font-semibold", color.bg, color.text)}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        );
      })}
      {overflow > 0 && (
        <div
          className={cn(
            sizeClasses,
            'border-2 border-card bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-full flex items-center justify-center shrink-0'
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
