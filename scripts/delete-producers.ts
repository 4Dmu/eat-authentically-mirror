import { db } from "@/backend/db";
import { cloudflare } from "@/backend/lib/cloudflare";
import { env } from "@/env";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "@/backend/db/schema";

const items = [
  "b639db5f-9587-4c1e-aa93-9b8390a1bd8a",
  "e83ad6a3-4ba9-4c23-bd42-a77c065ee719",
];

async function main() {
  const producers = await db.query.producers.findMany({
    columns: {
      id: true,
      images: true,
    },
    where: inArray(schema.producers.id, items),
  });

  for (const producer of producers) {
    for (const image of producer.images.items) {
      await cloudflare.images.v1.delete(image.cloudflareId, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });
    }

    await db
      .delete(schema.producers)
      .where(eq(schema.producers.id, producer.id));
  }
}

main();
