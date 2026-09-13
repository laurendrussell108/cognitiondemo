import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac/policy";
import { POST as createFlagRoute } from "@/app/api/flags/route";
import { GET as listFlagsRoute } from "@/app/api/flags/route";
import { DELETE as deleteFlagRoute, PATCH as patchFlagRoute } from "@/app/api/flags/[id]/route";
import { loadUser, request, routeParams, signIn, signOut } from "./helpers";
import type { AuthUser } from "@/lib/auth/types";

const NAME = "rbac-test-flag";
const ENVIRONMENT = "development";

let admin: AuthUser;
let viewer: AuthUser;
let flagId: string;

beforeAll(async () => {
  admin = await loadUser("venus.admin@example.com");
  viewer = await loadUser("lauren.viewer@example.com");
});

beforeEach(async () => {
  signOut();
  await prisma.featureFlag.deleteMany({ where: { name: NAME } });
  const flag = await prisma.featureFlag.create({
    data: {
      name: NAME,
      description: "",
      enabled: false,
      rolloutPercentage: 0,
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

describe("policy", () => {
  it("grants admins every action on any resource, including future ones", () => {
    expect(can("admin", "feature_flag", "delete")).toBe(true);
    expect(can("admin", "kyc_review", "update")).toBe(true);
  });

  it("grants viewers read only, on any resource", () => {
    expect(can("viewer", "feature_flag", "read")).toBe(true);
    expect(can("viewer", "kyc_review", "read")).toBe(true);
    expect(can("viewer", "feature_flag", "update")).toBe(false);
    expect(can("viewer", "kyc_review", "create")).toBe(false);
  });
});

describe("API enforcement", () => {
  it("rejects anonymous requests with 401", async () => {
    const response = await listFlagsRoute(request("/api/flags"), {});
    expect(response.status).toBe(401);
  });

  it("lets a viewer read flags", async () => {
    await signIn(viewer);
    const response = await listFlagsRoute(request("/api/flags"), {});
    expect(response.status).toBe(200);
  });

  it("blocks a viewer from creating a flag with 403", async () => {
    await signIn(viewer);
    const response = await createFlagRoute(
      request("/api/flags", { method: "POST", body: { name: "nope", environment: ENVIRONMENT } }),
      {},
    );
    expect(response.status).toBe(403);
    expect(await prisma.featureFlag.findFirst({ where: { name: "nope" } })).toBeNull();
  });

  it("blocks a viewer from toggling a flag with 403 and leaves the row untouched", async () => {
    await signIn(viewer);
    const response = await patchFlagRoute(
      request(`/api/flags/${flagId}`, { method: "PATCH", body: { enabled: true } }),
      routeParams(flagId),
    );
    expect(response.status).toBe(403);
    const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { id: flagId } });
    expect(flag.enabled).toBe(false);
  });

  it("blocks a viewer from deleting a flag with 403", async () => {
    await signIn(viewer);
    const response = await deleteFlagRoute(
      request(`/api/flags/${flagId}`, { method: "DELETE" }),
      routeParams(flagId),
    );
    expect(response.status).toBe(403);
    expect(await prisma.featureFlag.findUnique({ where: { id: flagId } })).not.toBeNull();
  });

  it("allows an admin to toggle a flag", async () => {
    await signIn(admin);
    const response = await patchFlagRoute(
      request(`/api/flags/${flagId}`, { method: "PATCH", body: { enabled: true } }),
      routeParams(flagId),
    );
    expect(response.status).toBe(200);
    const flag = await prisma.featureFlag.findUniqueOrThrow({ where: { id: flagId } });
    expect(flag.enabled).toBe(true);
  });
});
