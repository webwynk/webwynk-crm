import type { Role, ProjectType, ProjectStatus, AttendanceStatus, SalaryStatus, NotificationType } from "@prisma/client";

// ─── Re-export Prisma enums ───────────────────────────────
export type { Role, ProjectType, ProjectStatus, AttendanceStatus, SalaryStatus, NotificationType };

// ─── User ────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  designation: string | null;
  bio: string | null;
  isOnline: boolean;
  isFirstLogin: boolean;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStats extends User {
  _count: {
    assignedProjects: number;
    attendance: number;
  };
}

// ─── Session ─────────────────────────────────────────────
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  isFirstLogin: boolean;
}

// ─── Project ─────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  clientEmail: string | null;
  type: ProjectType;
  status: ProjectStatus;
  coverImage: string | null;
  startDate: Date;
  dueDate: Date | null;
  progress: number;
  isDeadlineAlertSent: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithAssignees extends Project {
  assignments: Array<{
    id: string;
    userId: string;
    user: Pick<User, "id" | "name" | "avatar" | "designation">;
  }>;
  createdBy: Pick<User, "id" | "name">;
}

export interface ProjectWithCredentials extends ProjectWithAssignees {
  credentials: WebDevCredentials | null;
}

// ─── Web Dev Credentials ─────────────────────────────────
export interface WebDevCredentials {
  id: string;
  projectId: string;
  devUrl: string;
  username: string;
  password: string;
  notes: string | null;
}

// ─── Project Message ─────────────────────────────────────
export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
  sender: Pick<User, "id" | "name" | "avatar" | "role">;
}

// ─── Global Message ──────────────────────────────────────
export interface GlobalMessage {
  id: string;
  senderId: string;
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
  sender: Pick<User, "id" | "name" | "avatar" | "role">;
}

// ─── Attendance ──────────────────────────────────────────
export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  workHours: number | null;
  status: AttendanceStatus;
  markedAbsentById: string | null;
  note: string | null;
  createdAt: Date;
}

export interface AttendanceWithUser extends Attendance {
  user: Pick<User, "id" | "name" | "avatar" | "designation">;
}

// ─── Salary ──────────────────────────────────────────────
export interface Salary {
  id: string;
  userId: string;
  month: string;
  amount: number;
  status: SalaryStatus;
  paidAt: Date | null;
  note: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryWithUser extends Salary {
  user: Pick<User, "id" | "name" | "avatar" | "designation">;
}

// ─── Notification ─────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

// ─── Activity Log ────────────────────────────────────────
export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ─── API Response Helpers ────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

// ─── Presence ────────────────────────────────────────────
export interface PresenceUser {
  userId: string;
  userName: string;
  onlineAt: string;
}

// ─── Onboarding ──────────────────────────────────────────
export interface OnboardingData {
  password: string;
  confirmPassword: string;
  avatar?: string;
  designation?: string;
  bio?: string;
}

// ─── Form Types ──────────────────────────────────────────
export interface CreateProjectForm {
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  type: ProjectType;
  coverImage?: string;
  startDate: string;
  dueDate?: string;
  assigneeIds: string[];
}

export interface CreateEmployeeForm {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  role: "HR" | "EMPLOYEE";
  bio?: string;
}

export interface CreateSalaryForm {
  userId: string;
  month: string;
  amount: number;
  note?: string;
}

export interface MarkAbsentForm {
  userId: string;
  date: string;
  note?: string;
}
