import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuthorization } from "@/lib/rbac/guard";
import type { AuthorizedContext } from "@/lib/rbac/guard";
import {
  RESOURCE,
  deleteFlag,
  getFlag,
  isEnvironment,
  updateFlag,
  type FlagInput,
} from "@/lib/feature-flags/service";

type Params = { params: Promise<{ id: string }> };

export const GET = withAuthorization(
  RESOURCE,
  "read",
  async (_request: NextRequest, { params }: AuthorizedContext<Params>) => {
    const flag = await getFlag((await params).id);
    if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ flag });
  },
);

export const PATCH = withAuthorization(
  RESOURCE,
  "update",
  async (request: NextRequest, { params, user }: AuthorizedContext<Params>) => {
    const { id } = await params;
    if (!(await getFlag(id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: Partial<FlagInput> = {};

    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    if (body.rolloutPercentage !== undefined) {
      const rollout = Number(body.rolloutPercentage);
      if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) {
        return NextResponse.json(
          { error: "rolloutPercentage must be an integer between 0 and 100" },
          { status: 400 },
        );
      }
      patch.rolloutPercentage = rollout;
    }
    if (body.environment !== undefined) {
      if (typeof body.environment !== "string" || !isEnvironment(body.environment)) {
        return NextResponse.json({ error: "invalid environment" }, { status: 400 });
      }
      patch.environment = body.environment;
    }

    return NextResponse.json({ flag: await updateFlag(user, id, patch) });
  },
);

export const DELETE = withAuthorization(
  RESOURCE,
  "delete",
  async (_request: NextRequest, { params, user }: AuthorizedContext<Params>) => {
    const { id } = await params;
    if (!(await getFlag(id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteFlag(user, id);
    return NextResponse.json({ ok: true });
  },
);
