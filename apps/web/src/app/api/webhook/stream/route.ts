import crypto from "node:crypto";
import { db } from "@ea/db";
import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/backend/lib/log";

type SuccessWebhookPayload = {
  uid: string;
  readyToStream: boolean;
  status: SuccessStatus;
  meta: Meta;
  created: Date;
  modified: Date;
};

// biome-ignore lint/complexity/noBannedTypes: Meta is an empty object?
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

  logger.info("[CLOUDFLARE STREAM WEHOOK] received");
  logger.info("[CLOUDFLARE STREAM WEHOOK] Header signature", {
    signature: sigHeader,
  });

  if (!sigHeader) {
    logger.info(
      "[CLOUDFLARE STREAM WEHOOK] Signature verification failed because of missing signature"
    );
    return NextResponse.json(
      { message: "Signature verification failed" },
      { status: 401 }
    );
  }

  const sigParts = sigHeader.split(",");
  const time = sigParts[0]?.split("=")[1];
  const dangerousSignature = sigParts[1]?.split("=")[1];

  if (!time || !dangerousSignature) {
    logger.info(
      "[CLOUDFLARE STREAM WEHOOK] Signature verification failed because of missing or invalid signature parts"
    );
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

  if (dangerousSignature !== computedSignature) {
    logger.info(
      "[CLOUDFLARE STREAM WEHOOK] Signature verification failed because of signature was invalid"
    );
    return NextResponse.json(
      { message: "Signature verification failed" },
      { status: 401 }
    );
  }

  const body = JSON.parse(text) as
    | SuccessWebhookPayload
    | FailureWebhookPayload;

  logger.info("[CLOUDFLARE STREAM WEHOOK] Body", { body });

  const canStream = body.readyToStream && body.status.state === "ready";

  const result = await db.run(sql`
        UPDATE producers
        SET 
          video = json_set(video, '$.status', ${sql.param(
            canStream ? "ready" : "pending"
          )}),
          updatedAt = unixepoch()
        WHERE 
          video IS NOT NULL AND json_extract(video, '$.uid') = ${sql.param(
            body.uid
          )}
        RETURNING id
        `);

  logger.info("[CLOUDFLARE STREAM WEHOOK] Update result", { result });
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
