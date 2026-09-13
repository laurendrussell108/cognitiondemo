import Link from "next/link";
import { requireUser } from "@/lib/rbac/server";
import { listFlags } from "@/lib/feature-flags/service";
import { bucketOf, evaluate } from "@/lib/feature-flags/evaluation";

export const dynamic = "force-dynamic";

/**
 * Shows what a consuming service would see for the selected flag, so toggling
 * it in the admin panel visibly changes behavior. The sample subjects
 * illustrate how a partial rollout splits traffic.
 */

const SAMPLE_SUBJECTS = ["acct_1001", "acct_1002", "acct_1003", "acct_1004", "acct_1005"];

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ flag?: string }>;
}) {
  const user = await requireUser();
  const { flag: selectedId } = await searchParams;
  const flags = await listFlags();
  const flag = flags.find((candidate) => candidate.id === selectedId) ?? flags[0];

  if (!flag) {
    return (
      <div className="page-head">
        <div>
          <h1>Flag effect</h1>
          <p>
            No flags yet — <Link href="/flags">create one</Link> to see it evaluated here.
          </p>
        </div>
      </div>
    );
  }

  const forMe = evaluate(flag, { userKey: user.subject });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Flag effect</h1>
          <p>
            What a consuming service gets from <code>isEnabled()</code>. Toggle the flag on
            the <Link href="/flags">feature flags</Link> page and reload.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <span className="subtle">Flag</span>
        {flags.map((candidate) => (
          <Link
            key={candidate.id}
            className="chip"
            href={`/demo?flag=${candidate.id}`}
            data-active={candidate.id === flag.id}
          >
            {candidate.name}
          </Link>
        ))}
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div className="stack">
          <strong>{flag.name}</strong>
          <span className="subtle">
            {flag.environment} · {flag.enabled ? "enabled" : "disabled"} ·{" "}
            {flag.rolloutPercentage}% rollout
          </span>
        </div>
        <p style={{ marginTop: 16 }}>
          {forMe.enabled ? (
            <>
              <span className="badge green">on for you</span> The gated behavior runs for{" "}
              {user.email}.
            </>
          ) : (
            <>
              <span className="badge">off for you</span> The service falls back to the old
              behavior for {user.email} ({forMe.reason.replace("_", " ")}).
            </>
          )}
        </p>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Bucket</th>
              <th>Result</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_SUBJECTS.map((subject) => {
              const result = evaluate(flag, { userKey: subject });
              return (
                <tr key={subject}>
                  <td>{subject}</td>
                  <td className="muted">{bucketOf(flag.name, subject)}</td>
                  <td>
                    <span className={result.enabled ? "badge green" : "badge"}>
                      {result.enabled ? "on" : "off"}
                    </span>
                  </td>
                  <td className="muted">{result.reason.replace(/_/g, " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
