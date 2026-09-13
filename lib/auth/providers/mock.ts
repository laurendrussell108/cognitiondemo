import { prisma } from "@/lib/db";
import { isRole } from "@/lib/rbac/policy";
import type { AuthProvider, AuthUser } from "@/lib/auth/types";

function toAuthUser(row: {
  id: string;
  subject: string;
  email: string;
  name: string;
  role: string;
}): AuthUser {
  if (!isRole(row.role)) {
    throw new Error(`User ${row.email} has unknown role "${row.role}"`);
  }
  return { ...row, role: row.role };
}

/**
 * Development provider: the seeded users stand in for IdP accounts and picking
 * one stands in for completing an OIDC flow. No passwords, by design — this
 * provider must never be enabled outside local development.
 */
export const mockProvider: AuthProvider = {
  name: "mock",

  async listSelectableUsers() {
    const users = await prisma.user.findMany({ orderBy: { email: "asc" } });
    return users.map(toAuthUser);
  },

  async authenticate({ subject }) {
    if (!subject) return null;
    const user = await prisma.user.findUnique({ where: { subject } });
    return user ? toAuthUser(user) : null;
  },

  authorizationUrl() {
    return null;
  },
};
