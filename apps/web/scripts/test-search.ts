import { searchByGeoTextV2 } from "@/backend/data/producer";

async function main() {
  // const client = typesense();

  // const results = await client.collections("producers").documents().search({
  //   q: "beef",
  //   query_by: "name,summary",
  // });
  // console.log(results);

  const results = await searchByGeoTextV2({
    keywords: ["quinta", "nova"],
    limit: 100,
    offset: 0,
  });
  console.log(results.hits?.[0].document.name);
}

main();
