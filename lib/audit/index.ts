import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/types";

/** Subset of PrismaClient available inside an interactive transaction. */
export type TransactionClient = Prisma.TransactionClient;

export type AuditEntry = {
  actor: AuthUser;
  action: string;
  resourceType: string;
  resourceId: string;
  /** State before the write; null for creates. */
  oldValue?: unknown;
  /** State after the write; null for deletes. */
  newValue?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** Writes one audit row. Call it on the transaction client of the write. */
export async function recordAudit(tx: TransactionClient, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: entry.actor.id,
      actorEmail: entry.actor.email,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      oldValue: toJson(entry.oldValue),
      newValue: toJson(entry.newValue),
    },
  });
}

/**
 * Runs a write and its audit row in one transaction, so a mutation can never
 * be committed without its log entry (or the log without the mutation).
 *
 * `mutate` returns the written record plus the values to log; anything a
 * future tool writes can use this without adding per-feature logging code.
 *
 *   const flag = await withAudit(
 *     { actor, action: "feature_flag.update", resourceType: "feature_flag" },
 *     async (tx) => {
 *       const before = await tx.featureFlag.findUniqueOrThrow({ where: { id } });
 *       const after = await tx.featureFlag.update({ where: { id }, data });
 *       return { resourceId: id, oldValue: before, newValue: after, result: after };
 *     },
 *   );
 */
export async function withAudit<T>(
  context: { actor: AuthUser; action: string; resourceType: string },
  mutate: (tx: TransactionClient) => Promise<{
    resourceId: string;
    oldValue?: unknown;
    newValue?: unknown;
    result: T;
  }>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const { resourceId, oldValue, newValue, result } = await mutate(tx);
    await recordAudit(tx, { ...context, resourceId, oldValue, newValue });
    return result;
  });
}

export type AuditLogFilter = {
  resourceType?: string;
  resourceId?: string;
  limit?: number;
};

/** Reads the log. There is deliberately no update or delete counterpart. */
export async function listAuditLogs(filter: AuditLogFilter = {}) {
  return prisma.auditLog.findMany({
    where: {
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
    },
    orderBy: { createdAt: "desc" },
    take: filter.limit ?? 200,
  });
}
