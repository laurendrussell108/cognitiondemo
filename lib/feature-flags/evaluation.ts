import { prisma } from "@/lib/db";
import type { Environment } from "@/lib/feature-flags/service";

/**
 * Read side of the flag system: how a *consuming* service turns a flag row into
 * a yes/no for one request. The admin panel writes flags; this is what makes a
 * toggle actually change behavior somewhere else.
 *
 * Deliberately dependency-free and synchronous so it can be lifted into any
 * service (or a client SDK) without pulling in Prisma or Next.
 */

export type EvaluationContext = {
  /**
   * Stable per-subject key (user id, account id, device id). The same key
   * always lands in the same bucket, so a partial rollout is sticky instead of
   * flickering between requests.
   */
  userKey: string;
};

export type FlagDefinition = {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
};

export type EvaluationReason =
  | "flag_missing"
  | "flag_disabled"
  | "rollout_included"
  | "rollout_excluded";

export type Evaluation = { enabled: boolean; reason: EvaluationReason };

/** FNV-1a: small, stable across processes and languages, and not security-sensitive. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function bucketOf(flagName: string, userKey: string): number {
  return hash(`${flagName}:${userKey}`) % 100;
}

export function evaluate(
  flag: FlagDefinition | null,
  context: EvaluationContext,
): Evaluation {
  if (!flag) return { enabled: false, reason: "flag_missing" };
  if (!flag.enabled) return { enabled: false, reason: "flag_disabled" };
  if (bucketOf(flag.name, context.userKey) < flag.rolloutPercentage) {
    return { enabled: true, reason: "rollout_included" };
  }
  return { enabled: false, reason: "rollout_excluded" };
}

/**
 * STUB. Reads straight from Postgres on every call, which is fine for the admin
 * panel itself and for a demo, but not for a hot request path. A real
 * deployment replaces the body with a cached snapshot refreshed by
 * `publishFlagChange` — see the README ("Making a toggle change behavior").
 */
export async function isEnabled(
  name: string,
  environment: Environment,
  context: EvaluationContext,
): Promise<Evaluation> {
  const flag = await prisma.featureFlag.findFirst({
    where: { name, environment },
    select: { name: true, enabled: true, rolloutPercentage: true },
  });
  return evaluate(flag, context);
}
