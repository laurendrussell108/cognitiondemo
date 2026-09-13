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
      <h1>Audit log</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <span className="muted">Resource type:</span>
        <Link href="/audit">
          <span className="badge">all</span>
        </Link>
        <Link href="/audit?resourceType=feature_flag">
          <span className="badge">feature_flag</span>
        </Link>
        {resourceId && (
          <span className="muted">
            filtered to resource <code>{resourceId}</code>
          </span>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Old value</th>
            <th>New value</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No audit entries.
              </td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="muted">{log.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
              <td>{log.actorEmail}</td>
              <td>
                <span className="badge">{log.action}</span>
              </td>
              <td className="muted">
                {log.resourceType}
                <div>
                  <Link href={`/audit?resourceId=${log.resourceId}`}>{log.resourceId}</Link>
                </div>
              </td>
              <td style={{ maxWidth: 220 }}>
                <pre>{JSON.stringify(log.oldValue, null, 1)}</pre>
              </td>
              <td style={{ maxWidth: 220 }}>
                <pre>{JSON.stringify(log.newValue, null, 1)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
