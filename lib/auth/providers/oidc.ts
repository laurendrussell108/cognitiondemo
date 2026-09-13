import type { AuthProvider } from "@/lib/auth/types";

/**
 * Placeholder showing the shape a real Okta/Entra provider takes. It is not
 * implemented in this prototype (see "Next steps" in the README); selecting it
 * fails loudly rather than falling back to the mock provider.
 *
 * An implementation would:
 *   - build the authorize URL from OIDC_ISSUER / OIDC_CLIENT_ID / OIDC_REDIRECT_URI
 *   - exchange the code for an id_token in `authenticate` and verify it
 *   - upsert users by the `sub` claim, mapping an IdP group claim onto a Role
 * Nothing outside this file changes.
 */
export const oidcProvider: AuthProvider = {
  name: "oidc",

  async listSelectableUsers() {
    return [];
  },

  async authenticate() {
    throw new Error("OIDC provider is not implemented in this prototype");
  },

  authorizationUrl(): string {
    throw new Error("OIDC provider is not implemented in this prototype");
  },
};
