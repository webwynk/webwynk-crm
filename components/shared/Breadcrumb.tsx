"use client";

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-zinc-400 dark:text-zinc-500 select-none pb-4', className)}
    >
      <Link
        href="/"
        className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
            {isLast || !item.href ? (
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
