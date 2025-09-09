// app/api/unread/route.ts
import { USER_MESSAGE_NOTIFICATIONS_KV } from "@/backend/kv";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  // get user from your auth/session instead of query params
  // const { userId } = await auth();
  const session = await auth();

  if (!session.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const raw = await USER_MESSAGE_NOTIFICATIONS_KV.getTotal(session.userId);
  const count = Number(raw ?? 0);

  return NextResponse.json({ count });
}
