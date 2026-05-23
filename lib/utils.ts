import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import type { ProjectType, ProjectStatus, AttendanceStatus, SalaryStatus } from "@prisma/client";

// ─── Tailwind class merger ────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ─────────────────────────────────────
export function formatDate(date: Date | string, fmt = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return differenceInDays(d, new Date());
}

export function isOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  return getDaysUntilDue(dueDate) < 0;
}

export function isDueSoon(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  const days = getDaysUntilDue(dueDate);
  return days >= 0 && days <= 1;
}

// ─── Currency formatting (INR) ───────────────────────────
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Avatar helpers ───────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Project type styling ────────────────────────────────
export const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { label: string; color: string; bg: string }
> = {
  WEBSITE_DEVELOPMENT: {
    label: "Website Development",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
  },
  SEO: {
    label: "SEO",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  APP_DEVELOPMENT: {
    label: "App Development",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  SOCIAL_MEDIA: {
    label: "Social Media",
    color: "text-pink-700",
    bg: "bg-pink-50 border-pink-200",
  },
  BRANDING: {
    label: "Branding",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
  OTHER: {
    label: "Other",
    color: "text-slate-600",
    bg: "bg-slate-100 border-slate-200",
  },
};

// ─── Project status styling ──────────────────────────────
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  ACTIVE: {
    label: "Active",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-400",
  },
};

// ─── Attendance status styling ───────────────────────────
export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string }
> = {
  PRESENT: {
    label: "Present",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  ABSENT: {
    label: "Absent",
    color: "text-red-700",
    bg: "bg-red-50",
  },
  INCOMPLETE: {
    label: "Incomplete",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
};

// ─── Salary status styling ───────────────────────────────
export const SALARY_STATUS_CONFIG: Record<
  SalaryStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  PAID: {
    label: "Paid",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  PARTIAL: {
    label: "Partial",
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
};

// ─── Work hours calculation ──────────────────────────────
export function calculateWorkHours(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10; // rounded to 1 decimal
}

// ─── Month formatter ─────────────────────────────────────
export function formatMonth(yearMonth: string): string {
  // Input: "2025-05" → Output: "May 2025"
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMMM yyyy");
}

export function getCurrentYearMonth(): string {
  return format(new Date(), "yyyy-MM");
}
