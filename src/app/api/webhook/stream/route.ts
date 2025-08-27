import { db } from "@/backend/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/env";

type SuccessWebhookPayload = {
  uid: string;
  readyToStream: boolean;
  status: SuccessStatus;
  meta: Meta;
  created: Date;
  modified: Date;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Meta = {};

type SuccessStatus = {
  state: string;
};

export type FailureWebhookPayload = {
  uid: string;
  readyToStream: boolean;
  status: FailureStatus;
};

type FailureStatus = {
  state: string;
  step: string;
  pctComplete: string;
  errReasonCode: string;
  errReasonText: string;
};

export async function POST(req: NextRequest) {
  const sigHeader = req.headers.get("Webhook-Signature");

  console.log("[CLOUDFLARE STREAM WEHOOK] received");
  console.log("[CLOUDFLARE STREAM WEHOOK] Header signature: ", sigHeader);

  if (!sigHeader) {
    return NextResponse.json(
      { message: "Signature verification failed" },
      { status: 401 }
    );
  }

  const sigParts = sigHeader.split(",");
  const time = sigParts[0]?.split("=")[1];
  const dangerousSignature = sigParts[1]?.split("=")[1];

  if (!time || !dangerousSignature) {
    return NextResponse.json(
      { message: "Signature verification failed" },
      { status: 401 }
    );
  }

  const text = await req.text();

  const toVerify = `${time}.${text}`;
  const hash = crypto
    .createHmac("sha256", env.STREAM_WEBHOOK_SECRET)
    .update(toVerify);

  const computedSignature = hash.digest("hex");

  if (dangerousSignature != computedSignature) {
    return NextResponse.json(
      { message: "Signature verification failed" },
      { status: 401 }
    );
  }

  const body = JSON.parse(text) as
    | SuccessWebhookPayload
    | FailureWebhookPayload;

  console.log("[CLOUDFLARE STREAM WEHOOK] Body: ", body);

  const canStream = body.readyToStream && body.status.state === "ready";

  const result = await db.run(sql`
        UPDATE listings
        SET 
          video = json_set(video, '$.status', ${sql.param(
            canStream ? "ready" : "pending"
          )}),
          updatedAt = CURRENT_TIMESTAMP
        WHERE 
          video IS NOT NULL AND json_extract(video, '$.uid') = ${sql.param(
            body.uid
          )}
        RETURNING id
        `);

  console.log("[CLOUDFLARE STREAM WEHOOK] Update result: ", result);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
