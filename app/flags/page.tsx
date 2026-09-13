import Link from "next/link";
import { requireUser } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/policy";
import { ENVIRONMENTS, RESOURCE, listFlags } from "@/lib/feature-flags/service";
import { FlagRowActions } from "@/app/flags/flag-row-actions";

export const dynamic = "force-dynamic";

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string }>;
}) {
  const user = await requireUser();
  const { environment } = await searchParams;
  const flags = await listFlags(environment);
  const canWrite = can(user.role, RESOURCE, "update");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Feature flags</h1>
          <p>Every write is authorized server-side and recorded in the audit log.</p>
        </div>
        <span className="spacer" />
        {canWrite && (
          <Link className="btn primary" href="/flags/new">
            New flag
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <span className="subtle">Environment</span>
        <Link className="chip" href="/flags" data-active={!environment}>
          All
        </Link>
        {ENVIRONMENTS.map((env) => (
          <Link
            key={env}
            className="chip"
            href={`/flags?environment=${env}`}
            data-active={environment === env}
          >
            {env}
          </Link>
        ))}
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th style={{ width: "34%" }}>Name</th>
              <th>Environment</th>
              <th>Rollout</th>
              <th>State</th>
              <th>Created by</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No flags yet.
                </td>
              </tr>
            )}
            {flags.map((flag) => (
              <tr key={flag.id}>
                <td>
                  <div className="stack">
                    <strong>{flag.name}</strong>
                    <span className="subtle">{flag.description}</span>
                  </div>
                </td>
                <td>
                  <span className="badge">{flag.environment}</span>
                </td>
                <td className="muted">{flag.rolloutPercentage}%</td>
                <td>
                  <span className={flag.enabled ? "badge green" : "badge"}>
                    {flag.enabled ? "enabled" : "disabled"}
                  </span>
                </td>
                <td className="muted">{flag.createdBy}</td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>
                  {flag.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <FlagRowActions id={flag.id} enabled={flag.enabled} canWrite={canWrite} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
