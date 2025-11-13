import { openapiSpecification } from "@/lib/swagger";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.0",
    info: { title: "EatAuthentically External Api", version: "1.0.0" },
    paths: {
      "/api/external/v1/outreach/claimlink": {
        post: {
          produces: ["application/json"],
          parameters: [
            { name: "producerId", in: "body", required: true, type: "string" },
            {
              name: "recipientEmail",
              in: "body",
              required: true,
              type: "string",
            },
          ],
        },
      },
      "/api/external/v1/outreach/injest-events": {
        post: {
          parameters: [
            {
              name: "events",
              in: "body",
              required: true,
              schema: {
                type: "object",
                required: ["events"],
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "type",
                        "producerId",
                        "recipient",
                        "timestamp",
                      ],
                      properties: {
                        type: {
                          type: "string",
                          enum: [
                            "delivered",
                            "opened",
                            "clicked",
                            "bounced",
                            "complained",
                            "unsubscribed",
                          ],
                        },
                        producerId: { type: "string", format: "uuid" },
                        recipient: { type: "string", format: "email" },
                        timestamp: { type: "string", format: "date-time" },
                        providerMessageId: { type: "string" },
                        meta: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      "/api/external/v1/outreach/mark": {
        post: {
          parameters: [
            { name: "producerId", in: "body", required: true, type: "string" },
            {
              name: "status",
              in: "body",
              required: true,
              type: { type: "string", enum: ["queued", "sent", "failed"] },
            },
            { name: "producerId", in: "body", required: true, type: "string" },
            { name: "note", in: "body", required: false, type: "string" },
          ],
        },
      },
      "/api/external/v1/producers/[id]/stats": { get: null },
      "/api/external/v1/producers/unclaimed": {
        get: {
          parameters: [
            { name: "limit", in: "query", required: false, type: "number" },
            { name: "offset", in: "query", required: false, type: "number" },
            {
              name: "filter",
              in: "query",
              required: false,
              type: "object",
              properties: {
                alpha3CountryCode: { type: "string", required: false },
                hasEmail: { type: "boolean", required: false },
              },
            },
          ],
        },
      },
    },
    components: {},
    tags: [],
  });
}
