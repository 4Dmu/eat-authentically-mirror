// import { db } from "@/backend/db";
// import { sql } from "drizzle-orm";

// async function main() {
//   const canStream = true;
//   const body = { uid: "e780088899094efb9de4df0d56980b87" };
//   console.log(
//     await db.run(sql`
//             UPDATE listings
//             SET video = json_set(video, '$.status', ${sql.param(
//               canStream ? "ready" : "pending"
//             )})
//             WHERE video IS NOT NULL AND json_extract(video, '$.uid') = ${sql.param(
//               body.uid
//             )}
//             RETURNING id
//             `)
//   );
// }
// main();
