import { prisma } from "@/lib/db";
import { withAudit } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Reference-app logic. Feature-flag specific — the reusable part is that every
 * write here goes through `withAudit`, never through `prisma` directly.
 */

export const RESOURCE = "feature_flag";

export const ENVIRONMENTS = ["development", "staging", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export function isEnvironment(value: string): value is Environment {
  return (ENVIRONMENTS as readonly string[]).includes(value);
}

export type FlagInput = {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: Environment;
};

export function listFlags(environment?: string) {
  return prisma.featureFlag.findMany({
    where: environment ? { environment } : undefined,
    orderBy: [{ environment: "asc" }, { name: "asc" }],
  });
}

export function getFlag(id: string) {
  return prisma.featureFlag.findUnique({ where: { id } });
}

export function createFlag(actor: AuthUser, input: FlagInput) {
  return withAudit(
    { actor, action: "feature_flag.create", resourceType: RESOURCE },
    async (tx) => {
      const created = await tx.featureFlag.create({
        data: { ...input, createdBy: actor.email },
      });
      return { resourceId: created.id, newValue: created, result: created };
    },
  );
}

export function updateFlag(actor: AuthUser, id: string, input: Partial<FlagInput>) {
  return withAudit(
    { actor, action: "feature_flag.update", resourceType: RESOURCE },
    async (tx) => {
      const before = await tx.featureFlag.findUniqueOrThrow({ where: { id } });
      const after = await tx.featureFlag.update({ where: { id }, data: input });
      return { resourceId: id, oldValue: before, newValue: after, result: after };
    },
  );
}

export function deleteFlag(actor: AuthUser, id: string) {
  return withAudit(
    { actor, action: "feature_flag.delete", resourceType: RESOURCE },
    async (tx) => {
      const before = await tx.featureFlag.findUniqueOrThrow({ where: { id } });
      await tx.featureFlag.delete({ where: { id } });
      return { resourceId: id, oldValue: before, result: before };
    },
  );
}
