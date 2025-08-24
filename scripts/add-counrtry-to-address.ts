// import { db } from "@/backend/db";
// import { sql } from "drizzle-orm";

// async function main() {
//   await db.transaction(async (tx) => {
//     await tx.run(sql`
//         UPDATE listings
//         SET address = json_set(address, '$.country', 'usa')
//         WHERE address IS NOT NULL
//         `);
//   });
// }

// main();
