import { NextResponse } from "next/server";
import { type } from "arktype";
import { db } from "@ea/db";
import { and, eq, isNotNull, isNull, sql, SQL } from "drizzle-orm";
import { producers } from "@ea/db/schema";
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
 *       - name: filter
 *         in: query
 *         required: false
 *         type: object
 *         properties:
 *           alpha3CountryCode:
 *             type: string
 *             required: false
 *           hasEmail:
 *             type: boolean
 *             required: false
 */
export const GET = handlers.get.search(
  type({
    "limit?": type("string.json.parse").to(type.number.atLeast(1).atMost(200)),
    "offset?": type("string.json.parse").to(type.number.atLeast(1)),
    "filter?": {
      "alpha3CountryCode?": alpha3CountryCodeValidator,
      "hasEmail?": "boolean",
    },
  }),
  async ({ search }) => {
    const filters: SQL<unknown>[] = [isNull(producers.userId)];

    if (search.filter?.alpha3CountryCode) {
      filters.push(
        eq(
          sql`json_extract(address, '$.country')`,
          search.filter.alpha3CountryCode
        )
      );
    }

    if (search.filter?.hasEmail !== undefined) {
      filters.push(
        search.filter.hasEmail
          ? isNotNull(sql`json_extract(contact, '$.email')`)
          : isNull(sql`json_extract(contact, '$.email')`)
      );
    }

    const data = await db.query.producers.findMany({
      where: and(...filters),
      limit: search.limit ?? 100,
      offset: search.offset,
    });

    return NextResponse.json({ items: data });
  }
);
