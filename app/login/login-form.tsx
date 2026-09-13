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
        <div key={user.subject} className="row" style={{ marginBottom: 8 }}>
          <button
            className="primary"
            disabled={pending !== null}
            onClick={() => signIn(user.subject)}
          >
            Sign in as {user.name}
          </button>
          <span className="muted">{user.email}</span>
          <span className="badge">{user.role}</span>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </>
  );
}
