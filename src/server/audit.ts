import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function createAuditLog({
  action,
  actorId,
  targetId,
  targetType,
  metadata,
}: {
  action: AuditAction;
  actorId: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.auditLog.create({
      data: { action, actorId, targetId, targetType, metadata },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}
