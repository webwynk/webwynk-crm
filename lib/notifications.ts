import { prisma } from '@/lib/prisma';
import type { Role, NotificationType } from '@prisma/client';

// ─── Activity Logger ──────────────────────────────────────
export async function logActivity({
  actorId,
  actorName,
  actorRole,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId,
        actorName,
        actorRole,
        action,
        entityType,
        entityId: entityId ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: metadata ? (metadata as any) : undefined,

      },
    });
  } catch (err) {
    // Non-fatal: log silently so it doesn't break the primary operation
    console.error('[logActivity]', err);
  }
}

// ─── Notification Creator ─────────────────────────────────
export async function createNotification({
  userId,
  title,
  body,
  type,
  link,
}: {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        link: link ?? null,
      },
    });
  } catch (err) {
    console.error('[createNotification]', err);
  }
}
