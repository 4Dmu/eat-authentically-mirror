import { asc, like, or } from "drizzle-orm";
import { db } from "../src";
import { producerCertifications, producers } from "../src/schema";
import { typesense } from "@ea/search";

async function main() {
  const query1 = "%organic%";
  const results = await db.query.producers.findMany({
    where: or(like(producers.name, query1), like(producers.summary, query1)),
    with: {
      certifications: {
        with: {
          certification: true,
        },
      },
    },
    columns: { id: true },
    orderBy: asc(producers.name),
  });

  const client = typesense();
  //   const collection = client.collections("producers");
  //   const result = await collection.documents().search({
  //     q: "naturally grown",
  //     query_by: "name,summary",
  //     limit: 100,
  //   });
  //   const hit = result.hits?.map((r) => r.document);
  //   console.log(hit);

  const ready = results.map((r) => ({
    id: r.id,
    organic: r.certifications.some(
      (c) => c.certificationId === "fc340cb2-34c0-4c21-855b-4cb2c6d2d0df"
    ),
    certifications: r.certifications.map((c) => c.certification.name),
  }));

  const collection = client.collections("producers");
  console.log(await collection.documents().import(ready, { action: "update" }));

  // console.log(JSON.stringify(results));
  //   const limit = 500;
  //   let offset = 0;

  //   const filtered = results.filter((r) =>
  //     r.certifications.every(
  //       (c) => c.certificationId !== "fc340cb2-34c0-4c21-855b-4cb2c6d2d0df"
  //     )
  //   );

  //   while (true) {
  //     const section = filtered.slice(offset, offset + limit);

  //     if (section.length === 0) {
  //       break;
  //     }

  //     await db.insert(producerCertifications).values(
  //       section.map((v) => ({
  //         producerId: v.id,
  //         certificationId: "fc340cb2-34c0-4c21-855b-4cb2c6d2d0df",
  //         addedAt: new Date(),
  //       }))
  //     );

  //     offset += limit;
  //     console.log(offset);
  //   }

  // console.log(filtered.length);
}

main();
