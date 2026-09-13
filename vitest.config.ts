import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// The tests run real route handlers, which read DATABASE_URL and
// SESSION_SECRET from process.env the same way the server does.
Object.assign(process.env, loadEnv("test", process.cwd(), ""));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // The tests exercise real API route handlers against the local Postgres,
    // so they must not run concurrently against shared rows.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
