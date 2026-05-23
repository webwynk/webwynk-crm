import { Role } from '@prisma/client';

interface RoleBadgeProps {
  role: Role | string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfigs = {
    ADMIN: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-500/20',
      label: 'Admin',
    },
    HR: {
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-100 dark:border-sky-500/20',
      label: 'HR Manager',
    },
    EMPLOYEE: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-500/20',
      label: 'Employee',
    },
  };

  const config = roleConfigs[role as Role] || {
    bg: 'bg-zinc-50 dark:bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-100 dark:border-zinc-500/20',
    label: role,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} select-none`}
    >
      {config.label}
    </span>
  );
}
