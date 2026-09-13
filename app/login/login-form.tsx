"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth/types";

export function LoginForm({ users }: { users: AuthUser[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(subject: string) {
    setPending(subject);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    if (!response.ok) {
      setError("Login failed");
      setPending(null);
      return;
    }
    router.replace("/flags");
    router.refresh();
  }

  return (
    <>
      {users.map((user) => (
        <button
          key={user.subject}
          className="row"
          style={{ width: "100%", marginBottom: 8, padding: 12, textAlign: "left" }}
          disabled={pending !== null}
          onClick={() => signIn(user.subject)}
        >
          <span className="stack">
            <strong>{user.name}</strong>
            <span className="subtle">{user.email}</span>
          </span>
          <span className="spacer" />
          <span className={user.role === "admin" ? "badge green" : "badge"}>{user.role}</span>
        </button>
      ))}
      {error && <p className="error">{error}</p>}
    </>
  );
}
