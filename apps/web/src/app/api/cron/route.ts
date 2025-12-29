import { runEmailFlow } from "@/backend/jobs/email-flow";
import { env } from "@/env";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Authorization Failed", { status: 400 });
  }

  console.log("Starting cron");
  await runEmailFlow();
  console.log("Cron finished");

  return new Response("Handled");
}
