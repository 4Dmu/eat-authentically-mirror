import { db } from "@ea/db";
import { mediaAssets, producerMedia } from "@ea/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const limit = 50;
  let offset = 50;
  while (true) {
    const images = await db.query.mediaAssets.findMany({
      columns: { id: true, url: true },
      limit: limit,
      offset: offset,
    });

    if (images.length === 0) {
      break;
    }

    await db.transaction(async (tx) => {
      for (const img of images) {
        const value = img.url.split("/");
        console.log(value[4]);
        await tx
          .update(mediaAssets)
          .set({
            cloudflareId: value[4],
          })
          .where(eq(mediaAssets.id, img.id));
      }
    });

    console.log(offset);
    offset += limit;
  }
}

main();
