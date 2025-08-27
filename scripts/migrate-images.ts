// import { db } from "@/backend/db";
// import { listings, products } from "@/backend/db/schema";
// import { ImageData } from "@/backend/validators/listings";
// import { asc, count, eq, isNotNull } from "drizzle-orm";

// async function main() {
//   const limit = 500;
//   let page = 0;

//   while (true) {
//     const results = await db.query.listings.findMany({
//       columns: { images: true, id: true },
//       orderBy: asc(listings.createdAt),
//       limit: limit,
//       offset: page * limit,
//       where: isNotNull(listings.images),
//     });

//     if (results.length === 0) {
//       break;
//     }

//     const updates = results.map((result) => {
//       const images = result.images as unknown as {
//         primaryImgIdx: number;
//         images: ImageData[];
//       };

//       return db
//         .update(listings)
//         .set({
//           images: {
//             primaryImgId:
//               images.images[images.primaryImgIdx]?.cloudflareId ?? null,
//             items: images.images,
//           },
//         })
//         .where(eq(listings.id, result.id));
//     });

//     await db.batch([updates[0], ...updates.slice(1)]);
//     console.log(`Processed page ${page}, updated ${updates.length} listings`);

//     page++;
//   }
// }

// main();
