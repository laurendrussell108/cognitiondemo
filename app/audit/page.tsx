import Link from "next/link";
import { listAuditLogs } from "@/lib/audit";
import { requireUser } from "@/lib/rbac/server";

export const dynamic = "force-dynamic";

/** Read-only view of the audit log. There is no write path from the UI. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ resourceType?: string; resourceId?: string }>;
}) {
  await requireUser();
  const { resourceType, resourceId } = await searchParams;
  const logs = await listAuditLogs({ resourceType, resourceId });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p>Append-only. Enforced by a Postgres trigger, not by this UI.</p>
        </div>
      </div>

      <div className="filter-bar">
        <span className="subtle">Resource type</span>
        <Link className="chip" href="/audit" data-active={!resourceType && !resourceId}>
          All
        </Link>
        <Link
          className="chip"
          href="/audit?resourceType=feature_flag"
          data-active={resourceType === "feature_flag"}
        >
          feature_flag
        </Link>
        {resourceId && (
          <span className="subtle">
            filtered to <code>{resourceId}</code>
          </span>
        )}
      </div>

      <div className="panel">
      <table>
        <thead>
          <tr>
            <th style={{ width: 130 }}>Timestamp</th>
            <th style={{ width: 150 }}>Actor</th>
            <th style={{ width: 130 }}>Action</th>
            <th style={{ width: 110 }}>Resource</th>
            <th>Old value</th>
            <th>New value</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                No audit entries.
              </td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="muted" style={{ whiteSpace: "nowrap" }}>
                {log.createdAt.toISOString().replace("T", " ").slice(0, 19)}
              </td>
              <td>{log.actorEmail}</td>
              <td>
                <span className={actionBadge(log.action)}>{log.action}</span>
              </td>
              <td>
                <div className="stack">
                  <span className="muted">{log.resourceType}</span>
                  <Link
                    className="subtle"
                    href={`/audit?resourceId=${log.resourceId}`}
                    title={log.resourceId}
                  >
                    {log.resourceId.slice(0, 8)}…
                  </Link>
                </div>
              </td>
              <td>
                <pre className="json">{JSON.stringify(log.oldValue, null, 1)}</pre>
              </td>
              <td>
                <pre className="json">{JSON.stringify(log.newValue, null, 1)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function actionBadge(action: string): string {
  if (action.endsWith(".create")) return "badge green";
  if (action.endsWith(".delete")) return "badge red";
  if (action.endsWith(".update")) return "badge orange";
  return "badge";
}
