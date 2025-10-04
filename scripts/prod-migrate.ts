// import { db } from "@/backend/db";
// import {
//   Certification,
//   certifications,
//   producers,
//   ProducerSelect,
// } from "@/backend/db/schema";
// import { eq } from "drizzle-orm";
// import { readFile } from "fs/promises";

// async function main() {
//   const json = await readFile("./scripts/producers.json", "utf8");
//   const items = (await JSON.parse(json)) as ProducerSelect[];
//   for (const item of items) {
//     await db
//       .update(producers)
//       .set({
//         createdAt: new Date((item.createdAt as unknown as number) * 1000),
//         updatedAt: new Date((item.updatedAt as unknown as number) * 1000),
//       })
//       .where(eq(producers.id, item.id));
//     console.log(item.createdAt);
//   }
// }

// main();
