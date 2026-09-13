"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENVIRONMENTS } from "@/lib/feature-flags/service";

export type FlagFormValues = {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: string;
};

export function FlagForm({
  initial,
  flagId,
}: {
  initial: FlagFormValues;
  flagId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(flagId ? `/api/flags/${flagId}` : "/api/flags", {
      method: flagId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
      };
      setError(body.detail ?? body.error ?? `Request failed (${response.status})`);
      return;
    }
    router.push("/flags");
    router.refresh();
  }

  return (
    <form className="card" style={{ maxWidth: 520 }} onSubmit={submit}>
      <label>
        <span>Name</span>
        <input
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </label>
      <label>
        <span>Description</span>
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </label>
      <label>
        <span>Environment</span>
        <select
          value={values.environment}
          onChange={(e) => setValues({ ...values, environment: e.target.value })}
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Rollout percentage</span>
        <input
          type="number"
          min={0}
          max={100}
          value={values.rolloutPercentage}
          onChange={(e) =>
            setValues({ ...values, rolloutPercentage: Number(e.target.value) })
          }
        />
      </label>
      <label className="row">
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={values.enabled}
          onChange={(e) => setValues({ ...values, enabled: e.target.checked })}
        />
        <span style={{ margin: 0 }}>Enabled</span>
      </label>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit" disabled={pending}>
        {flagId ? "Save changes" : "Create flag"}
      </button>
    </form>
  );
}
