import { mockProvider } from "@/lib/auth/providers/mock";
import { oidcProvider } from "@/lib/auth/providers/oidc";
import type { AuthProvider } from "@/lib/auth/types";

const providers: Record<string, AuthProvider> = {
  mock: mockProvider,
  oidc: oidcProvider,
};

/** Resolves the provider named by AUTH_PROVIDER (defaults to "mock"). */
export function getAuthProvider(): AuthProvider {
  const name = process.env.AUTH_PROVIDER ?? "mock";
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown AUTH_PROVIDER "${name}"`);
  }
  return provider;
}

export { getCurrentUser, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
export type { AuthUser, AuthProvider } from "@/lib/auth/types";
