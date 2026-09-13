import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth/session";
import { isRole } from "@/lib/rbac/policy";
import type { AuthUser } from "@/lib/auth/types";
import { cookieJar } from "./setup";

export async function loadUser(email: string): Promise<AuthUser> {
  const row = await prisma.user.findUniqueOrThrow({ where: { email } });
  if (!isRole(row.role)) throw new Error(`Unexpected role ${row.role}`);
  return { id: row.id, subject: row.subject, email: row.email, name: row.name, role: row.role };
}

export async function signIn(user: AuthUser): Promise<void> {
  cookieJar.set(SESSION_COOKIE, await createSessionToken(user));
}

export function signOut(): void {
  cookieJar.clear();
}

export function request(
  path: string,
  init?: { method?: string; body?: unknown },
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
}

export function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
