import { vi } from "vitest";

/**
 * The route handlers read the session from the cookie store that Next provides
 * per request. Outside a server request there is no store, so tests get a
 * process-wide one; `signIn` in tests/helpers.ts writes to it.
 */
export const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));
