/**
 * Role definitions and the permission matrix. Adding a resource to a future
 * internal tool means adding it here; the guard and the route handlers do not
 * change.
 */

export const ROLES = ["admin", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const ACTIONS = ["read", "create", "update", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

/** Resource names are free-form strings so new tools can add their own. */
export type Permission = `${string}:${Action}` | `${string}:*` | "*:*";

const POLICY: Record<Role, readonly Permission[]> = {
  // Full access to every resource, current and future.
  admin: ["*:*"],
  // Read-only across every resource.
  viewer: ["*:read"],
};

/**
 * Whether `role` may perform `action` on `resource`. Matching is exact, with
 * `*` allowed in either position of a granted permission.
 */
export function can(role: Role, resource: string, action: Action): boolean {
  return POLICY[role].some((permission) => {
    const [grantedResource, grantedAction] = permission.split(":");
    return (
      (grantedResource === "*" || grantedResource === resource) &&
      (grantedAction === "*" || grantedAction === action)
    );
  });
}

/** Permissions for a role, used by the UI to decide what to render. */
export function permissionsFor(role: Role): readonly Permission[] {
  return POLICY[role];
}
