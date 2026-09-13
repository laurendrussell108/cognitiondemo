import type { FeatureFlag } from "@prisma/client";

/**
 * STUB. The seam between "the admin panel committed a change" and "every
 * consuming service sees it". Called after each flag write commits, so a
 * failure here can never roll back the write or its audit row.
 *
 * A real implementation publishes the change (Redis pub/sub, SNS, a webhook,
 * or a CDN purge) so each service refreshes its cached snapshot instead of
 * querying Postgres per request. See the README ("Making a toggle change
 * behavior") for the wiring.
 */

export type FlagChange = {
  type: "created" | "updated" | "deleted";
  flag: Pick<FeatureFlag, "id" | "name" | "environment" | "enabled" | "rolloutPercentage">;
};

export async function publishFlagChange(change: FlagChange): Promise<void> {
  if (process.env.FLAG_PUBLISH_WEBHOOK_URL) {
    // Intentionally unimplemented: a real deployment signs and retries this.
    throw new Error("FLAG_PUBLISH_WEBHOOK_URL is set but publishing is not implemented");
  }
  console.info("[flags] change published", {
    type: change.type,
    name: change.flag.name,
    environment: change.flag.environment,
    enabled: change.flag.enabled,
    rolloutPercentage: change.flag.rolloutPercentage,
  });
}
