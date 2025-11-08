import { typesense } from "@ea/search";

async function main() {
  const client = typesense();
  const docs = client.collections("producers").documents();
  console.log(
    await docs
      .search({
        q: "Paris",
        query_by:
          "name,summary,commodities,certifications,country,adminArea,city",
      })
      .then((r) => r.hits?.map((h) => h.document))
  );
}

main();
