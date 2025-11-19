import { type CollectionSchema, typesense } from "../src";

async function main() {
  const client = typesense();

  await client.collections("producers").delete();

  const schema: CollectionSchema = {
    name: "producers",
    fields: [
      { name: "id", type: "string" },
      { name: "name", type: "string" },
      { name: "summary", type: "string", optional: true },
      { name: "type", type: "string", facet: true },
      { name: "labels", type: "string[]", facet: true },
      { name: "verified", type: "bool", facet: true },
      { name: "subscriptionRank", type: "int32" },
      { name: "avgRating", type: "float" },
      { name: "bayesAvg", type: "float" },
      { name: "reviewCount", type: "int32" },
      { name: "country", type: "string", facet: true, optional: true },
      { name: "adminArea", type: "string", facet: true, optional: true },
      { name: "city", type: "string", facet: true, optional: true },
      { name: "locality", type: "string", facet: true, optional: true },
      { name: "organic", type: "bool", facet: true },
      { name: "location", type: "geopoint", optional: true },
      { name: "certifications", type: "string[]", facet: true },
      { name: "commodities", type: "string[]", facet: true },
      { name: "createdAt", type: "int64" },
      { name: "updatedAt", type: "int64" },
    ],
  };

  console.log(await client.collections().create(schema));
}

main();
