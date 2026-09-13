import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthProvider, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    subject?: string;
    code?: string;
  };
  const user = await getAuthProvider().authenticate(body);
  if (!user) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }
  await setSessionCookie(user);
  return NextResponse.json({ user });
}
