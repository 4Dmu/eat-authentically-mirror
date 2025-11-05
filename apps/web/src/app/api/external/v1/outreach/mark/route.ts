import { type } from "arktype";
import { handlers } from "../../_helpers/request";
import { NextResponse } from "next/server";
import { db } from "@ea/db";
import { outreachData } from "@ea/db/schema";

/**
 * @swagger
 *
 * /api/external/v1/outreach/mark:
 *   post:
 *     parameters:
 *       - name: producerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: status
 *         in: body
 *         required: true
 *         type:
 *           type: string
 *           enum: [queued, sent, failed]
 *       - name: producerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: note
 *         in: body
 *         required: false
 *         type: string
 */
export const POST = handlers.post.body(
  type({
    producerId: "string.uuid",
    status: "'queued'|'sent'|'failed'",
    providerMessageId: "string",
    "note?": "string",
  }),
  async ({ body }) => {
    await db
      .insert(outreachData)
      .values({
        producerId: body.producerId,
        status: body.status,
        note: body.note,
        providerMessageId: body.providerMessageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: outreachData.producerId,
        set: {
          status: body.status,
          note: body.note,
          providerMessageId: body.providerMessageId,
          updatedAt: new Date(),
        },
      });
    return new NextResponse(null, { status: 204 });
  }
);
