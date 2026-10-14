import prisma from '../config/prisma';

export async function logAudit({
  userId,
  userName,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  userId?: number | null;
  userName: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        userName,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
