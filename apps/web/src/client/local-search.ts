import type { ProducerSearchResultRow } from "@/backend/data/producer";
import { typesense } from "@ea/search";
import {
  countryByAlpha2Code,
  countryByAlpha3Code,
  countryByName,
} from "@ea/shared/countries";
import type { ProducerTypes } from "@ea/validators/producers";
import np from "compromise";

const LOCAL_INTENT_RE =
  /\b(near\s*me|around\s*me|close\s*by|nearby|in\s*my\s*area)\b/i;

const RE_ORGANIC = /\b(organic)\b/i;

function extractLocationInfo(query: string) {
  let newQuery = query;
  const localIntent = LOCAL_INTENT_RE.test(query);

  if (localIntent) {
    newQuery = query.replace(LOCAL_INTENT_RE, "");
  }

  const doc = np(query);
  const places = doc.places();
  const custom = doc.match("(florence|Florence)");
  const results = (
    places.concat(custom).unique().sort("chron").json() as { text: string }[]
  ).map((r) => r.text);

  const countryFromPlacenames = results
    .map((place) => ({
      country: attemptDetectCountry(place),
      placeName: place,
    }))
    .find((p): p is CountryWithPlacename => p.country !== null);

  if (countryFromPlacenames) {
    newQuery.replace(
      countryFromPlacenames.placeName,
      countryFromPlacenames.country.alpha3
    );
  }

  // if (placeName) {
  //   newQuery = newQuery.replace(placeName, "");
  // }

  return {
    placeNames: results,
    localIntent,
    query: newQuery.trim(),
    countryFromPlacenames,
  };
}

function attemptDetectCountry(query: string) {
  const string = query.trim().toLowerCase();

  let country = countryByName(string);

  if (country) {
    return country;
  }

  country = countryByAlpha3Code(string);

  if (country) {
    return country;
  }

  country = countryByAlpha2Code(string);

  return country;
}

function findCategory(query: string) {
  const aliases = {
    farm: ["farm", "farms"],
    ranch: ["ranch", "ranches"],
    eatery: ["eatery", "restaurant", "restaurants"],
  };

  const exceptions = [
    "farm to table",
    "farm-to-table",
    "farm to-table",
    "farm-to table",
    "farmers market",
    "farm to fork",
    "farm shop",
  ];

  const queryLower = query.toLowerCase();
  let safeQuery = queryLower;

  for (const phrase of exceptions) {
    const regex = new RegExp(phrase, "gi");
    safeQuery = safeQuery.replace(regex, " "); // replace with space to preserve separation
  }

  for (const [canonical, words] of Object.entries(aliases)) {
    for (const word of words) {
      // Match as a whole word
      const regex = new RegExp(`\\b${word}\\b`, "ig");
      if (regex.test(safeQuery)) {
        return {
          category: canonical as ProducerTypes,
          query: query.replaceAll(regex, ""),
        };
      }
    }
  }

  return { category: undefined, query: query }; // No match found
}

function findCommodities(query: string, commodities: string[]) {
  if (commodities.length === 0) {
    return [];
  }
  const commoditiesRegex = new RegExp(
    "\\b(" +
      commodities
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
      ")\\b",
    "g"
  );
  const matches = query.match(commoditiesRegex);
  if (!matches) return [];
  // Find *all* matches (not just first)
  return Array.from(query.matchAll(commoditiesRegex), (m) =>
    m[1].toLowerCase().trim()
  ).filter((r) => r.length > 0);
}

async function extractFilters(
  rawQuery: string
): Promise<{ filters: Filters; query: string }> {
  const { category, query } = findCategory(rawQuery);
  const commodities: string[] = [];
  //await COMMODITIES_CACHE.get();
  const variants: string[] = [];
  //await COMMODITY_VARIANTS_CACHE.get();
  const includedCommodities = findCommodities(rawQuery, commodities);
  const includedVariants = findCommodities(rawQuery, variants);
  const organic = RE_ORGANIC.test(rawQuery);

  return {
    filters: {
      category: category,
      commodities:
        includedCommodities.length === 0 ? undefined : includedCommodities,
      variants: includedVariants.length === 0 ? undefined : includedVariants,
      organicOnly: organic ? true : undefined,
    },
    query: query,
  };
}

type CountryWithPlacename = {
  country:
    | {
        id: number;
        alpha2: string;
        alpha3: string;
        name: string;
        aliases?: undefined;
      }
    | {
        id: number;
        alpha2: string;
        alpha3: string;
        name: string;
        aliases: string[];
      };
  placeName: string;
};

type Filters = {
  category?: "farm" | "ranch" | "eatery" | undefined;
  commodities?: string[] | undefined;
  variants?: string[] | undefined;
  certifications?: string[] | undefined;
  organicOnly?: boolean | undefined;
  verified?: boolean | undefined;
  isClaimed?: boolean | undefined;
  locality?: string | undefined;
  adminArea?: string | undefined;
  country?: string | undefined;
  subscriptionRankMin?: number | undefined;
  subscriptionRankMax?: number | undefined;
  minAvgRating?: number | undefined;
  minBayesAvg?: number | undefined;
  minReviews?: number | undefined;
  hasCover?: boolean | undefined;
  ids?: string[] | undefined;
  excludeIds?: string[] | undefined;
  searchArea?:
    | {
        bounds: google.maps.LatLngBoundsLiteral;
      }
    | {
        center: { lat: number; lon: number };
        radius: number;
      }
    | undefined;
};

type FiltersKey = keyof Filters;

export async function searchProducersLocalV2(props: {
  query: string;
  page: number;
  filters: Filters;
  userLocation?:
    | {
        position: { lat: number; lon: number };
        radius: number;
      }
    | undefined;
}) {
  // 1. Extract local intent - eg. does query contain "near me". This will return a boolean and replace any matches
  // with an empty string
  // 2. Extract placenames by local np
  // 3. Check if any of the placenames match a country and return the country if so
  const {
    query: locationExtractedQuery,
    localIntent,
    countryFromPlacenames,
  } = extractLocationInfo(props.query);

  // If local intent is detected, replace search area with user location and radius
  if (localIntent && props.userLocation) {
    props.filters.searchArea = {
      center: props.userLocation.position,
      radius: props.userLocation.radius,
    };
  }

  // If query contains a country and the user didn't filter by country, filter by countr
  if (countryFromPlacenames && props.filters.country === undefined) {
    props.filters.country = countryFromPlacenames.country.alpha3;
  }

  // Extract filters from query
  const { filters: extractedFilters, query: filtersExtractedQuery } =
    await extractFilters(locationExtractedQuery);

  for (const [key, value] of Object.entries(extractedFilters)) {
    if (props.filters[key as FiltersKey] === undefined) {
      props.filters[key as FiltersKey] = value as unknown as undefined;
    }
  }

  let finalQuery = filtersExtractedQuery.trim();

  if (finalQuery.length === 0) {
    finalQuery = "*";
  }

  const filters = [];

  if (props.filters.searchArea) {
    if ("bounds" in props.filters.searchArea) {
      filters.push(
        `location:(${props.filters.searchArea.bounds.south}, ${props.filters.searchArea.bounds.west}, ${props.filters.searchArea.bounds.north}, ${props.filters.searchArea.bounds.west}, ${props.filters.searchArea.bounds.north}, ${props.filters.searchArea.bounds.east}, ${props.filters.searchArea.bounds.south}, ${props.filters.searchArea.bounds.east}, ${props.filters.searchArea.bounds.south}, ${props.filters.searchArea.bounds.west})`
      );
    } else {
      filters.push(
        `location:(${props.filters.searchArea.center.lat}, ${props.filters.searchArea.center.lon}, ${props.filters.searchArea.radius} km)`
      );
    }
  }

  if (props.filters?.country) filters.push(`country:=${props.filters.country}`);

  if (props.filters?.category) filters.push(`type:=${props.filters.category}`);
  if (props.filters?.verified === true) filters.push(`verified:=true`);
  if (props.filters?.verified === false) filters.push(`verified:=false`);
  if (props.filters?.isClaimed === true) filters.push(`userId:!=""`);
  if (props.filters?.isClaimed === false) filters.push(`userId:=""`);

  if (props.filters?.organicOnly) filters.push(`organic:=true`);

  if (props.filters?.certifications?.length)
    filters.push(
      props.filters.certifications.map((c) => `certifications:=${c}`).join("&&")
    );

  if (props.filters?.commodities?.length)
    filters.push(`commodities:=[${props.filters.commodities.join(",")}]`);

  if (props.filters?.locality)
    filters.push(`locality:=${JSON.stringify(props.filters.locality)}`);
  if (props.filters?.adminArea)
    filters.push(`adminArea:=${JSON.stringify(props.filters.adminArea)}`);

  if (props.filters?.subscriptionRankMin != null)
    filters.push(`subscriptionRank:>=${props.filters.subscriptionRankMin}`);
  if (props.filters?.subscriptionRankMax != null)
    filters.push(`subscriptionRank:<=${props.filters.subscriptionRankMax}`);

  if (props.filters?.minAvgRating != null)
    filters.push(`avgRating:>=${props.filters.minAvgRating}`);
  if (props.filters?.minBayesAvg != null)
    filters.push(`bayesAvg:>=${props.filters.minBayesAvg}`);
  if (props.filters?.minReviews != null)
    filters.push(`reviewCount:>=${props.filters.minReviews}`);

  if (props.filters?.ids?.length)
    filters.push(
      `id:=[${props.filters.ids.map((s) => JSON.stringify(s)).join(",")}]`
    );
  if (props.filters?.excludeIds?.length)
    filters.push(
      `!id:=[${props.filters.excludeIds
        .map((s) => JSON.stringify(s))
        .join(",")}]`
    );

  const filter_by = filters.length === 0 ? undefined : filters.join(" && ");

  let sort_by: string;

  if (props.filters.searchArea && "center" in props.filters.searchArea) {
    sort_by = `location(${props.filters.searchArea.center.lat}, ${props.filters.searchArea.center.lon}):asc, _text_match:desc, subscriptionRank:desc`;
  } else if (finalQuery !== "*") {
    sort_by = `_text_match:desc, subscriptionRank:desc, bayesAvg:desc`;
  } else {
    sort_by = `subscriptionRank:desc, bayesAvg:desc, reviewCount:desc`;
  }

  const client = typesense();
  const docs = client
    .collections<ProducerSearchResultRow>("producers")
    .documents();

  console.log("finalQuery", finalQuery);
  console.log("filters", props.filters);
  console.log("filterBy", filter_by);
  console.log("sortyBy", sort_by);

  const results = await docs.search({
    q: finalQuery,
    query_by:
      "name,summary,labels,commodities,certifications,country,adminArea,city,locality",
    query_by_weights: "8,3,2,4,2,2,2,2,2",
    filter_by: filter_by,
    sort_by: sort_by,
    page: props.page,
    prioritize_exact_match: true,
    num_typos: 1,
    drop_tokens_threshold: 1,
  });

  return {
    result: results,
    userLocation: {
      userRequestsUsingTheirLocation: localIntent,
      searchRadius:
        props.filters.searchArea && "center" in props.filters.searchArea
          ? props.filters.searchArea.radius
          : 100,
    },
  };
}
