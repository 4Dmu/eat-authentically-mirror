import { type } from "arktype";
import { handlers } from "../_helpers/request";
import { NextResponse } from "next/server";
import { generateToken } from "@/backend/utils/generate-tokens";
import { env } from "@/env";
import { db } from "@/backend/db";
import { claimInvitations, claimRequests } from "@/backend/db/schema";
import { addDays } from "date-fns";
import { clerk } from "@/backend/lib/clerk";

export const POST = handlers.post.body(
  type({ producerId: "string.uuid", recipientEmail: "string.email" }),
  async ({ body }) => {
    const token = generateToken();

    const claimUrl = `${env.SITE_URL}/join-and-claim?token=${token}`;
    const id = crypto.randomUUID();

    const expiresAt = addDays(new Date(), 30);

    await db.insert(claimInvitations).values({
      id,
      producerId: body.producerId,
      status: {
        type: "waiting",
      },
      expiresAt,
      claimerEmail: body.recipientEmail,
      claimToken: token,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ claimUrl, claimInvitationId: id, expiresAt });
  }
);
