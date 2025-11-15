import { urls } from "./default-urls";
import { hashToIndex } from "@/lib/image-fallback";
import type { ProducerSelect, ProducerWith } from "@ea/db/schema";
import type { ProducerSearchResultRow } from "@ea/search";

/**
 * Gets the image url of the primary image.
 * Fallsback through:
 *  - first image
 *  - legacy image property
 *  - placeholder unsplash url
 */
export function primaryImageUrl(
  producer:
    | Pick<ProducerWith<"media">, "media" | "type" | "id">
    | Pick<ProducerSearchResultRow, "coverUrl" | "type" | "id">
) {
  const url: string | undefined | null =
    "coverUrl" in producer
      ? producer.coverUrl
      : (producer.media?.find((p) => p.role === "cover")?.asset.url ??
        producer.media?.[0]?.asset.url);

  if (url) {
    return url;
  }

  let i: number;
  switch (producer.type) {
    case "eatery":
      i = hashToIndex(producer.id, urls.eateries.photos.length);
      return urls.eateries.photos[i];
    case "ranch":
      i = hashToIndex(producer.id, urls.ranches.photos.length);
      return urls.ranches.photos[i];
    case "farm":
      i = hashToIndex(producer.id, urls.farms.photos.length);
      return urls.farms.photos[i];
  }
}

/**
 * Generates slug from listing name,
 * to be used with self healing urls only
 *
 * Includes the trailing -
 * @example
 *  'Daves Ranch' returns 'daves-ranch-'
 */
export function producerSlug(name: string) {
  return encodeURIComponent(
    `${name.toLowerCase().trim().split(" ").join("-")}-`
  );
}

/**
 * Generates slug from listing name,
 * to be used with self healing urls only
 *
 * Includes the trailing -
 * @example
 *  'Daves Ranch' returns 'daves-ranch-id'
 */
export function producerSlugFull(
  producer: Pick<ProducerSelect, "name" | "id">
) {
  return `${producer.name.toLowerCase().trim().split(" ").join("-")}-${
    producer.id
  }`;
}
