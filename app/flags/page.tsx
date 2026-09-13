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
      <div className="row" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Feature flags</h1>
        <span className="spacer" style={{ flex: 1 }} />
        {canWrite && (
          <Link href="/flags/new">
            <button className="primary">New flag</button>
          </Link>
        )}
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <span className="muted">Environment:</span>
        <Link href="/flags">
          <span className="badge">all</span>
        </Link>
        {ENVIRONMENTS.map((env) => (
          <Link key={env} href={`/flags?environment=${env}`}>
            <span className="badge">{env}</span>
          </Link>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Environment</th>
            <th>Rollout</th>
            <th>Enabled</th>
            <th>Created by</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {flags.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No flags yet.
              </td>
            </tr>
          )}
          {flags.map((flag) => (
            <tr key={flag.id}>
              <td>
                <strong>{flag.name}</strong>
                <div className="muted">{flag.description}</div>
              </td>
              <td>
                <span className="badge">{flag.environment}</span>
              </td>
              <td>{flag.rolloutPercentage}%</td>
              <td>{flag.enabled ? "on" : "off"}</td>
              <td className="muted">{flag.createdBy}</td>
              <td className="muted">{flag.updatedAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td>
                <FlagRowActions id={flag.id} enabled={flag.enabled} canWrite={canWrite} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
