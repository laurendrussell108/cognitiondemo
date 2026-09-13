"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FlagRowActions({
  id,
  enabled,
  canWrite,
}: {
  id: string;
  enabled: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string };
      setError(body.detail ?? `Request failed (${response.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="row">
      <Link href={`/audit?resourceId=${id}`}>History</Link>
      {canWrite && (
        <>
          <Link href={`/flags/${id}/edit`}>Edit</Link>
          <button onClick={toggle} disabled={pending}>
            {enabled ? "Disable" : "Enable"}
          </button>
        </>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
