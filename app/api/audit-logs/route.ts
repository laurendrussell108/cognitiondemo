import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listAuditLogs } from "@/lib/audit";
import { withAuthorization } from "@/lib/rbac/guard";

export const GET = withAuthorization("audit_log", "read", async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const logs = await listAuditLogs({
    resourceType: params.get("resourceType") ?? undefined,
    resourceId: params.get("resourceId") ?? undefined,
  });
  return NextResponse.json({ logs });
});
