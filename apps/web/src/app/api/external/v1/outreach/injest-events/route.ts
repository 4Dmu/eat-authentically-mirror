import { type } from "arktype";
import { handlers } from "../../_helpers/request";
import { NextResponse } from "next/server";
import { db } from "@ea/db";
import { outreachEvent } from "@ea/db/schema";

/**
 * @swagger
 *
 * /api/external/v1/outreach/injest-events:
 *   post:
 *     parameters:
 *       - name: events
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - events
 *           properties:
 *             events:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - type
 *                   - producerId
 *                   - recipient
 *                   - timestamp
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [delivered, opened, clicked, bounced, complained, unsubscribed]
 *                   producerId:
 *                     type: string
 *                     format: uuid
 *                   recipient:
 *                     type: string
 *                     format: email
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   providerMessageId:
 *                     type: string
 *                   meta:
 *                     type: object
 */
export const POST = handlers.post.body(
  type({
    events: type({
      type: "'delivered'|'opened'|'clicked'|'bounced'|'complained'|'unsubscribed'",
      producerId: "string.uuid",
      recipient: "string.email",
      timestamp: "Date",
      "providerMessageId?": "string",
      "meta?": "object",
    }).array(),
  }),
  async ({ body }) => {
    if (body.events.length === 0) {
      return new NextResponse(null, { status: 202 });
    }

    await db.insert(outreachEvent).values(
      body.events.map((b) => ({
        producerId: b.producerId,
        type: b.type,
        recipient: b.recipient,
        timestamp: b.timestamp,
        meta: b.meta,
        createdAt: new Date(),
      }))
    );

    return new NextResponse(null, { status: 202 });
  }
);
