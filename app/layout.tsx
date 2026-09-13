import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/app/_components/logout-button";
import { NavLink } from "@/app/_components/nav-link";
import { ThemeToggle, themeBootstrapScript } from "@/app/_components/theme-toggle";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Internal Tools Foundation",
  description: "Auth, RBAC and audit logging starter kit with a feature-flag reference app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <header className="app-header">
          <Link className="brand" href="/flags">
            <Image src="/cognition-mark.svg" alt="Cognition" width={20} height={20} priority />
            <span>Cognition</span>
            <span className="divider" />
            <span className="product">Internal Tools</span>
          </Link>
          <nav className="row">
            <NavLink href="/flags">Feature flags</NavLink>
            <NavLink href="/demo">Flag effect</NavLink>
            <NavLink href="/audit">Audit log</NavLink>
          </nav>
          <span className="spacer" />
          <ThemeToggle />
          {user ? (
            <>
              <span className="row">
                <span className="muted">{user.email}</span>
                <span className="badge">{user.role}</span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link className="btn" href="/login">
              Sign in
            </Link>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
