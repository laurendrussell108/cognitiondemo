import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuthorization } from "@/lib/rbac/guard";
import type { AuthorizedContext } from "@/lib/rbac/guard";
import { RESOURCE, createFlag, isEnvironment, listFlags } from "@/lib/feature-flags/service";

export const GET = withAuthorization(RESOURCE, "read", async (request: NextRequest) => {
  const environment = request.nextUrl.searchParams.get("environment") ?? undefined;
  return NextResponse.json({ flags: await listFlags(environment) });
});

export const POST = withAuthorization(
  RESOURCE,
  "create",
  async (request: NextRequest, { user }: AuthorizedContext<unknown>) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const environment = typeof body.environment === "string" ? body.environment : "";
    const rollout = Number(body.rolloutPercentage ?? 0);

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!isEnvironment(environment)) {
      return NextResponse.json({ error: "invalid environment" }, { status: 400 });
    }
    if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) {
      return NextResponse.json(
        { error: "rolloutPercentage must be an integer between 0 and 100" },
        { status: 400 },
      );
    }

    const flag = await createFlag(user, {
      name,
      description: typeof body.description === "string" ? body.description : "",
      enabled: body.enabled === true,
      rolloutPercentage: rollout,
      environment,
    });
    return NextResponse.json({ flag }, { status: 201 });
  },
);
