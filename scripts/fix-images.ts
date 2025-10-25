import { db } from "@/backend/db";
import { producerMedia } from "@/backend/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const limit = 50;
  let offset = 50;
  while (true) {
    const producers = await db.query.producers.findMany({
      with: {
        media: {
          columns: { createdAt: true, producerId: true, assetId: true },
        },
      },
      columns: {},
      limit: limit,
      offset: offset,
    });

    if (producers.length === 0) {
      break;
    }

    await db.transaction(async (tx) => {
      for (const producer of producers) {
        for (let i = 0; i < producer.media.length; i++) {
          const media = producer.media[i];

          await tx
            .update(producerMedia)
            .set({
              updatedAt: media.createdAt,
              role: i === 0 ? "cover" : "gallery",
              position: i,
            })
            .where(
              and(
                eq(producerMedia.producerId, media.producerId),
                eq(producerMedia.assetId, media.assetId)
              )
            );
        }
      }
    });

    console.log(offset);
    offset += limit;
  }
}

main();
