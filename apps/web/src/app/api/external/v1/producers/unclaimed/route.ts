import { NextResponse } from "next/server";
import { type } from "arktype";
import { db } from "@ea/db";
import { and, desc, eq, isNotNull, isNull, type SQL } from "drizzle-orm";
import { producerContact, producerLocation, producers } from "@ea/db/schema";
import { alpha3CountryCodeValidator } from "@ea/validators/country";
import { handlers } from "../../_helpers/request";

/**
 * @swagger
 *
 * /api/external/v1/producers/unclaimed:
 *   get:
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         type: number
 *       - name: offset
 *         in: query
 *         required: false
 *         type: number
 *       - name: alpha3CountryCode
 *         in: query
 *         required: false
 *         type: string
 *       - name: hasEmail
 *         in: query
 *         required: false
 *         type: boolean
 */
export const GET = handlers.get.search(
  type({
    "limit?": type("string.json.parse").to(type.number.atLeast(1).atMost(200)),
    "offset?": type("string.json.parse").to(type.number.atLeast(0)),
    "alpha3CountryCode?": alpha3CountryCodeValidator,
    "hasEmail?": type("string.json.parse").to(type.boolean),
  }),
  async ({ search }) => {
    const filters: SQL<unknown>[] = [isNull(producers.userId)];

    if (search.alpha3CountryCode) {
      filters.push(eq(producerLocation.country, search.alpha3CountryCode));
    }

    // Filter by whether email exists (now on the contact table)
    if (search?.hasEmail !== undefined) {
      filters.push(
        search.hasEmail
          ? isNotNull(producerContact.email)
          : isNull(producerContact.email)
      );
    }

    const query = await db
      .select()
      .from(producers)
      .leftJoin(producerContact, eq(producers.id, producerContact.producerId))
      .leftJoin(producerLocation, eq(producers.id, producerLocation.producerId))
      .where(and(...filters))
      .offset(search.offset ?? 0)
      .limit(search.limit ?? 100)
      .orderBy(desc(producers.createdAt));

    return NextResponse.json({
      items: query.map((r) => ({
        ...r.producers,
        contact: r.producer_contact,
        location: r.producer_location,
      })),
    });
  }
);
