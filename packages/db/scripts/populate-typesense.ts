import { ProducersCollectionDocument, typesense } from "@ea/search";
import { db } from "../src";
import { asc } from "drizzle-orm";
import { producers } from "../src/schema";

async function main() {
  const client = typesense();

  const limit = 1000;
  let offset = 0;

  while (true) {
    const results = await db.query.producers.findMany({
      limit,
      offset,
      orderBy: asc(producers.createdAt),
      with: {
        labels: {
          with: {
            label: true,
          },
        },
        certifications: {
          with: {
            certification: true,
          },
        },
        ratingAgg: true,
        location: true,
        commodities: {
          with: {
            commodity: true,
          },
        },
        media: {
          with: {
            asset: true,
          },
        },
      },
    });

    if (results.length == 0) {
      break;
    }

    const prepared: ProducersCollectionDocument[] = results.map((r) => {
      const avgRating =
        r.ratingAgg && r.ratingAgg.reviewCount > 0
          ? (r.ratingAgg.ratingSum * 1.0) / r.ratingAgg.reviewCount
          : 0;

      const bayesAvg = r.ratingAgg
        ? ((r.ratingAgg.ratingSum + 10 * 4.2) * 1.0) /
          (r.ratingAgg.reviewCount + 10)
        : 0;

      return {
        id: r.id,
        name: r.name,
        type: r.type,
        verified: r.verified,
        summary: r.summary ?? undefined,
        labels: r.labels.map((l) => l.label.name),
        subscriptionRank: r.subscriptionRank,
        avgRating: avgRating,
        bayesAvg: bayesAvg,
        reviewCount: r.ratingAgg?.reviewCount ?? 0,
        country: r.location?.country ?? undefined,
        organic: r.certifications.some((c) =>
          c.certification.name.toLowerCase().includes("organic")
        ),
        location:
          r.location && r.location.latitude && r.location.longitude
            ? [r.location.latitude, r.location.longitude]
            : undefined,
        certifications: r.certifications.map((c) => c.certification.name),
        commodities: r.commodities.map((c) => c.commodity.name),
        createdAt: r.createdAt.getTime() / 1000,
        updatedAt: r.updatedAt.getTime() / 1000,
        coverUrl:
          r.media.find((r) => r.role === "cover")?.asset.url ??
          r.media[0]?.asset?.url,
        userId: r.userId ?? undefined,
      } satisfies ProducersCollectionDocument;
    });

    console.log(prepared[0]);

    const collection = client.collections("producers");
    await collection.documents().import(prepared, { action: "upsert" });
    offset += limit;
    console.log(offset);
  }
}

main();
