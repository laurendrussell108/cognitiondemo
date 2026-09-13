import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth/types";
import { can, type Action } from "@/lib/rbac/policy";

export type AuthorizedContext<Ctx> = Ctx & { user: AuthUser };

type Handler<Ctx> = (
  request: NextRequest,
  context: AuthorizedContext<Ctx>,
) => Promise<Response> | Response;

/**
 * Wraps a route handler so it only runs for a signed-in user whose role grants
 * `action` on `resource`. Unauthenticated requests get 401, unauthorized ones
 * get 403, and the handler receives the authenticated user in its context.
 *
 * This is the only place authorization is enforced: the UI hides controls as a
 * convenience, never as a control.
 *
 *   export const POST = withAuthorization("feature_flag", "create", handler);
 */
export function withAuthorization<Ctx>(
  resource: string,
  action: Action,
  handler: Handler<Ctx>,
) {
  return async (request: NextRequest, context: Ctx): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!can(user.role, resource, action)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: `Role "${user.role}" cannot ${action} ${resource}`,
        },
        { status: 403 },
      );
    }
    return handler(request, { ...context, user });
  };
}
