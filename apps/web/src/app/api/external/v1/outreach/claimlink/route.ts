import { type } from "arktype";

import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@ea/db";
import { claimInvitations } from "@ea/db/schema";
import { addDays } from "date-fns";
import { handlers } from "../../_helpers/request";
import { generateToken } from "@ea/shared/generate-tokens";

/**
 * @swagger
 *
 * /api/external/v1/outreach/claimlink:
 *   post:
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: producerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: recipientEmail
 *         in: body
 *         required: true
 *         type: string
 */
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
