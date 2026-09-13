import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { PATCH as patchFlagRoute } from "@/app/api/flags/[id]/route";
import { POST as createFlagRoute } from "@/app/api/flags/route";
import { loadUser, request, routeParams, signIn, signOut } from "./helpers";
import type { AuthUser } from "@/lib/auth/types";

const NAME = "audit-test-flag";
const ENVIRONMENT = "development";

let admin: AuthUser;
let viewer: AuthUser;
let flagId: string;

async function logsForFlag(id: string) {
  return prisma.auditLog.findMany({
    where: { resourceType: "feature_flag", resourceId: id },
    orderBy: { createdAt: "asc" },
  });
}

beforeAll(async () => {
  admin = await loadUser("venus.admin@example.com");
  viewer = await loadUser("lauren.viewer@example.com");
});

beforeEach(async () => {
  signOut();
  // Audit rows are append-only, so each test works against a fresh flag id
  // rather than clearing the log.
  await prisma.featureFlag.deleteMany({ where: { name: NAME } });
  const flag = await prisma.featureFlag.create({
    data: {
      name: NAME,
      description: "before",
      enabled: false,
      rolloutPercentage: 10,
      environment: ENVIRONMENT,
      createdBy: admin.email,
    },
  });
  flagId = flag.id;
});

afterAll(async () => {
  await prisma.featureFlag.deleteMany({ where: { name: NAME } });
  await prisma.$disconnect();
});

describe("audit log", () => {
  it("writes exactly one row with accurate old and new values when a flag is toggled", async () => {
    await signIn(admin);
    const response = await patchFlagRoute(
      request(`/api/flags/${flagId}`, { method: "PATCH", body: { enabled: true } }),
      routeParams(flagId),
    );
    expect(response.status).toBe(200);

    const logs = await logsForFlag(flagId);
    expect(logs).toHaveLength(1);

    const [log] = logs;
    expect(log.action).toBe("feature_flag.update");
    expect(log.actorEmail).toBe(admin.email);
    expect(log.actorId).toBe(admin.id);
    expect(log.resourceType).toBe("feature_flag");
    expect(log.resourceId).toBe(flagId);

    const oldValue = log.oldValue as { enabled: boolean; rolloutPercentage: number };
    const newValue = log.newValue as { enabled: boolean; rolloutPercentage: number };
    expect(oldValue.enabled).toBe(false);
    expect(newValue.enabled).toBe(true);
    // Untouched fields are captured on both sides, not dropped.
    expect(oldValue.rolloutPercentage).toBe(10);
    expect(newValue.rolloutPercentage).toBe(10);
  });

  it("records a create with no old value", async () => {
    await signIn(admin);
    await prisma.featureFlag.deleteMany({ where: { name: NAME } });
    const response = await createFlagRoute(
      request("/api/flags", {
        method: "POST",
        body: { name: NAME, environment: ENVIRONMENT, rolloutPercentage: 5 },
      }),
      {},
    );
    expect(response.status).toBe(201);
    const { flag } = (await response.json()) as { flag: { id: string } };

    const logs = await logsForFlag(flag.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("feature_flag.create");
    expect(logs[0].oldValue).toBeNull();
    expect((logs[0].newValue as { rolloutPercentage: number }).rolloutPercentage).toBe(5);
  });

  it("writes no audit row when the write is rejected by RBAC", async () => {
    await signIn(viewer);
    const response = await patchFlagRoute(
      request(`/api/flags/${flagId}`, { method: "PATCH", body: { enabled: true } }),
      routeParams(flagId),
    );
    expect(response.status).toBe(403);
    expect(await logsForFlag(flagId)).toHaveLength(0);
  });

  it("rejects updates and deletes of audit rows at the database level", async () => {
    await signIn(admin);
    await patchFlagRoute(
      request(`/api/flags/${flagId}`, { method: "PATCH", body: { enabled: true } }),
      routeParams(flagId),
    );
    const [log] = await logsForFlag(flagId);

    await expect(
      prisma.$executeRaw`UPDATE audit_log SET action = 'tampered' WHERE id = ${log.id}`,
    ).rejects.toThrow(/append-only/);
    await expect(
      prisma.$executeRaw`DELETE FROM audit_log WHERE id = ${log.id}`,
    ).rejects.toThrow(/append-only/);
  });
});
