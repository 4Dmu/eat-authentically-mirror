import { ProducerSearchResultRow, typesense } from "@ea/search";

export async function searchProducersLocal(props: {
  query: string;
  page: number;
}) {
  const client = typesense();
  const docs = client
    .collections<ProducerSearchResultRow>("producers")
    .documents();

  const results = await docs.search({
    q: props.query,
    query_by: "name,summary",
    query_by_weights: "8,3",
    sort_by:
      props.query === "*"
        ? "createdAt:desc"
        : "_text_match:desc,createdAt:desc",
    page: props.page,
    prioritize_exact_match: true,
    num_typos: 1,
    drop_tokens_threshold: 1,
  });

  console.log(results);

  return results;
}
