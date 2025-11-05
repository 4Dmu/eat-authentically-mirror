import { db } from "@ea/db";
import { COMMODITIES_CACHE, COMMODITY_VARIANTS_CACHE } from "@/backend/kv";

export async function main() {
  const commodities = await db.query.commodities
    .findMany({
      columns: {
        name: true,
      },
    })
    .then((r) =>
      r.map((v) => v.name.toLowerCase().trim()).filter((v) => v.length > 0)
    );

  const commodityVariants = await db.query.commodityVariants
    .findMany({
      columns: {
        name: true,
      },
    })
    .then((r) =>
      r.map((v) => v.name.toLowerCase().trim()).filter((v) => v.length > 0)
    );

  await COMMODITIES_CACHE.set(new Set(commodities).values().toArray());
  await COMMODITY_VARIANTS_CACHE.set(
    new Set(commodityVariants).values().toArray()
  );
}

// export async function main() {
//   const commodities = await COMMODITIES_CACHE.get();
//   const set = new Set(commodities);
//   await COMMODITIES_CACHE.set(set.values().toArray());
// }

// function findCommodities(query: string, commodities: string[]) {
//   const commoditiesRegex = new RegExp(
//     "\\b(" +
//       commodities
//         .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
//         .join("|") +
//       ")\\b",
//     "g"
//   );
//   const matches = query.match(commoditiesRegex);
//   if (!matches) return [];
//   // Find *all* matches (not just first)
//   return Array.from(query.matchAll(commoditiesRegex), (m) =>
//     m[1].toLowerCase()
//   );
// }

// const RE_FARM_RANCH_EATERY = /\b(farm|ranch|eatery)\b/i;
// async function test(query: string) {
//   const matches = query.match(RE_FARM_RANCH_EATERY);
//   const value = matches ? matches[0] : undefined;
//   console.log(value);
// }

// test(
//   "test ranc hokkori far, red noodle strawberry colldok230seedsri239u927 83*Y^( seeds"
// );

main();
