import type { Role } from "@/lib/rbac/policy";

export type AuthUser = {
  id: string;
  subject: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * The seam between the application and whatever identity provider is
 * configured. Everything outside lib/auth depends on this interface only, so
 * adding a real IdP means adding a provider file, not touching callers.
 */
export type AuthProvider = {
  name: string;
  /**
   * Users offered on the login screen. Real IdPs redirect instead of listing
   * accounts, so they return an empty array.
   */
  listSelectableUsers(): Promise<AuthUser[]>;
  /**
   * Turns provider-specific login input into an application user, or null when
   * the login is not valid. `mock` takes a subject; an OIDC provider would take
   * an authorization code.
   */
  authenticate(input: { subject?: string; code?: string }): Promise<AuthUser | null>;
  /** Where the login page should send the browser, if the IdP owns the form. */
  authorizationUrl(): string | null;
};
