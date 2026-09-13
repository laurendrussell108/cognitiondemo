import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/app/_components/logout-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Tools Foundation",
  description: "Auth, RBAC and audit logging starter kit with a feature-flag reference app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <strong>Internal Tools</strong>
          <Link href="/flags">Feature flags</Link>
          <Link href="/audit">Audit log</Link>
          <span className="spacer" />
          {user ? (
            <>
              <span className="muted">
                {user.email} <span className="badge">{user.role}</span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
