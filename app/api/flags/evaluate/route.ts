import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuthorization } from "@/lib/rbac/guard";
import { isEnabled } from "@/lib/feature-flags/evaluation";
import { RESOURCE, isEnvironment } from "@/lib/feature-flags/service";

/**
 * Read endpoint a consuming service calls to ask "is this flag on for this
 * subject?".
 *
 * STUB in one respect: it authorizes with the operator's session, because the
 * mock provider only issues human sessions. A real deployment authenticates
 * services here instead (machine-to-machine token exchanged for a principal
 * with `feature_flag:read`) — the guard and the policy file stay unchanged.
 */
export const GET = withAuthorization(
  RESOURCE,
  "read",
  async (request: NextRequest) => {
    const params = request.nextUrl.searchParams;
    const name = params.get("name");
    const environment = params.get("environment");
    const userKey = params.get("userKey");

    if (!name || !userKey) {
      return NextResponse.json({ error: "name and userKey are required" }, { status: 400 });
    }
    if (!environment || !isEnvironment(environment)) {
      return NextResponse.json({ error: "invalid environment" }, { status: 400 });
    }

    return NextResponse.json(await isEnabled(name, environment, { userKey }));
  },
);
