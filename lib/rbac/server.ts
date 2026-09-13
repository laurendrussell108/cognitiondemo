import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth/types";
import { can, type Action } from "@/lib/rbac/policy";

/**
 * Page-level helpers for server components. These exist for navigation and
 * rendering decisions; the authoritative checks live in withAuthorization on
 * the API routes that perform the writes.
 */

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(
  resource: string,
  action: Action,
): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user.role, resource, action)) redirect("/flags");
  return user;
}
