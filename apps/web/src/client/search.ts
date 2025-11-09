import type {
  ProducerSearchResult,
  ProducerSearchResultRow,
} from "@/backend/data/producer";
import { typesense } from "@ea/search";
import {
  countryByAlpha2Code,
  countryByAlpha3Code,
  countryByName,
} from "@ea/shared/countries";
import {
  ProducerTypes,
  QueryFilters,
  SearchByGeoTextArgs,
  SearchByGeoTextQueryArgs,
  SearchProducersArgs,
} from "@ea/validators/producers";
import np from "compromise";

type GeoPoint = { lat: number; lon: number };
type BBox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

function buildGeoFilter(
  geo?:
    | { center: GeoPoint; radiusKm?: number }
    | { center: GeoPoint; bbox: BBox }
) {
  if (!geo) return null;
  if ("bbox" in geo) {
    return `location:(${geo.bbox.minLat}, ${geo.bbox.minLon}, ${geo.bbox.minLat}, ${geo.bbox.maxLon}, ${geo.bbox.maxLat}, ${geo.bbox.maxLon}, ${geo.bbox.maxLat}, ${geo.bbox.minLon}, ${geo.bbox.minLat}, ${geo.bbox.minLon})`;
  }
  return `location:(${geo.center.lat}, ${geo.center.lon}, ${geo.radiusKm} km)`;
}

function buildFacetFilters(
  filters: SearchByGeoTextArgs["filters"],
  countryAlpha3?: string | null
) {
  const parts: string[] = [];

  if (countryAlpha3) parts.push(`country:=${countryAlpha3}`);

  if (filters?.category) parts.push(`type:=${filters.category}`);
  if (filters?.verified === true) parts.push(`verified:=true`);
  if (filters?.verified === false) parts.push(`verified:=false`);
  if (filters?.isClaimed === true) parts.push(`userId:!=""`);
  if (filters?.isClaimed === false) parts.push(`userId:=""`);

  if (filters?.organicOnly) parts.push(`organic:=true`);

  if (filters?.certifications?.length)
    parts.push(`certifications:=[${filters.certifications.join(",")}]`);

  if (filters?.commodities?.length)
    parts.push(`commodities:=[${filters.commodities.join(",")}]`);

  if (filters?.locality)
    parts.push(`locality:=${JSON.stringify(filters.locality)}`);
  if (filters?.adminArea)
    parts.push(`adminArea:=${JSON.stringify(filters.adminArea)}`);

  if (filters?.subscriptionRankMin != null)
    parts.push(`subscriptionRank:>=${filters.subscriptionRankMin}`);
  if (filters?.subscriptionRankMax != null)
    parts.push(`subscriptionRank:<=${filters.subscriptionRankMax}`);

  if (filters?.minAvgRating != null)
    parts.push(`avgRating:>=${filters.minAvgRating}`);
  if (filters?.minBayesAvg != null)
    parts.push(`bayesAvg:>=${filters.minBayesAvg}`);
  if (filters?.minReviews != null)
    parts.push(`reviewCount:>=${filters.minReviews}`);

  if (filters?.ids?.length)
    parts.push(`id:=[${filters.ids.map((s) => JSON.stringify(s)).join(",")}]`);
  if (filters?.excludeIds?.length)
    parts.push(
      `!id:=[${filters.excludeIds.map((s) => JSON.stringify(s)).join(",")}]`
    );

  return parts.length ? parts.join(" && ") : null;
}

function buildSort(center: GeoPoint | null, keywords: string[]) {
  // Prefer geo distance if we have a center; otherwise text → paid → rating
  if (center) {
    return `location(${center.lat}, ${center.lon}):asc, _text_match:desc, subscriptionRank:desc`;
  }
  if (keywords.length) {
    return `_text_match:desc, subscriptionRank:desc, bayesAvg:desc`;
  }
  return `subscriptionRank:desc, bayesAvg:desc, reviewCount:desc`;
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

async function searchByGeoTextV2(
  args: SearchByGeoTextArgs & { locations: string[] }
) {
  const client = typesense();

  const { keywords, geo, filters, countryHint, page, locations } = args;

  let q = (keywords && keywords.length ? keywords.join(" ") : "*") || "*";

  let countryFromLocations: {
    placeName: string;
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
  } | null = null;

  for (const location of locations) {
    const c = attemptDetectCountry(location);
    if (c !== null) {
      countryFromLocations = { country: c, placeName: location };
      break;
    }
  }

  console.log(countryFromLocations);

  if (countryFromLocations) {
    q = q.replace(countryFromLocations.placeName, "");
  }

  if (q.trim() === "") {
    q = "*";
  }

  const country = countryHint ? attemptDetectCountry(countryHint) : null;

  const geoFilter = buildGeoFilter(geo);
  const facetFilter = buildFacetFilters(
    filters,
    countryFromLocations?.country?.alpha3 ?? null
  );
  const filter_by = [geoFilter, facetFilter].filter(Boolean).join(" && ");

  const sort_by = buildSort(
    geo ? ("center" in geo ? geo.center : null) : null,
    keywords
  );

  console.log(page, "page");

  const docs = client
    .collections<ProducerSearchResultRow>("producers")
    .documents();

  const results = await docs.search({
    q: q,
    query_by:
      "name,summary,labels,commodities,certifications,country,adminArea,city,locality",
    query_by_weights: "8,3,2,4,2,2,2,2,2",
    filter_by: filter_by,
    sort_by: sort_by,
    page: page,
    prioritize_exact_match: true,
    num_typos: 1,
    drop_tokens_threshold: 1,
  });
  return results;
}

const LOCAL_INTENT_RE =
  /\b(near\s*me|around\s*me|close\s*by|nearby|in\s*my\s*area)\b/i;

const RE_ORGANIC = /\b(organic)\b/i;

type FindCategoryResult = {
  category: ProducerTypes | undefined;
  query: string;
};

function findCategory(query: string): FindCategoryResult {
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
  const placeNames = results;

  // if (placeName) {
  //   newQuery = newQuery.replace(placeName, "");
  // }

  return { placeNames, localIntent, query: newQuery.trim() };
}

function findCommodities(query: string, commodities: string[]) {
  if (commodities.length == 0) {
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
): Promise<{ filters: QueryFilters; query: string }> {
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

async function prepareQuery(rawQuery: string) {
  const {
    localIntent,
    placeNames,
    query: queryV1,
  } = extractLocationInfo(rawQuery);
  const { filters, query } = await extractFilters(queryV1);
  const rawKeywords = query
    .split(" ")
    .filter((r) => r.trim().length > 3)
    .map((r) => r.trim().toLowerCase());
  const keywords = new Set(rawKeywords).values().toArray().slice(0, 8); // cap 8 keywords

  return {
    localIntent,
    location: placeNames,
    keywords,
    filters,
  };
}

export async function searchProducersLocal({
  userLocation,
  userIpGeo,
  customUserLocationRadius,
  customFilterOverrides,
  page,
  ...rest
}: SearchProducersArgs & {
  userIpGeo: { lat: number; lon: number } | undefined;
}) {
  const userGeo = userLocation
    ? {
        lat: userLocation.coords.latitude,
        lon: userLocation.coords.longitude,
      }
    : userIpGeo;

  const userLocationRadius = customUserLocationRadius ?? 100;

  const rawParams = localStorage.getItem(rest.query);
  console.log(rawParams);

  if (rawParams) {
    const params: SearchByGeoTextQueryArgs & {
      userRequestsUsingTheirLocation?: boolean;
      locations: string[];
    } = JSON.parse(rawParams);
    console.log("Cache hit for query", rest.query, "params", params);

    const geo =
      params.userRequestsUsingTheirLocation === true
        ? {
            center: userGeo!,
            radiusKm: userLocationRadius,
          }
        : undefined;

    if (customFilterOverrides?.category) {
      params.filters = params.filters
        ? { ...params.filters, category: customFilterOverrides.category }
        : { category: customFilterOverrides.category };
    }

    if (
      customFilterOverrides?.certifications &&
      customFilterOverrides.certifications.length > 0
    ) {
      params.filters = params.filters
        ? {
            ...params.filters,
            certifications: customFilterOverrides.certifications,
          }
        : { certifications: customFilterOverrides.certifications };
    }

    const result = await searchByGeoTextV2({
      ...params,
      page,
      geo: geo ?? params.geo,
      countryHint: customFilterOverrides?.country
        ? customFilterOverrides.country
        : params.countryHint,
    });

    return {
      result: result,
      userLocation: {
        userRequestsUsingTheirLocation: params.userRequestsUsingTheirLocation,
        searchRadius: userLocationRadius,
      },
    };
  }

  // Query is not cached so pagination is invalid
  page = 1;

  const query = await prepareQuery(rest.query);
  console.log(query);

  let output: ProducerSearchResult;

  localStorage.setItem(
    rest.query,
    JSON.stringify({
      keywords: query.keywords,
      filters: query.filters,
      locations: query.location,
      userRequestsUsingTheirLocation: query.localIntent,
    })
  );

  const result = await searchByGeoTextV2({
    geo:
      query.localIntent === true && userGeo !== undefined
        ? {
            center: userGeo!,
            radiusKm: userLocationRadius,
          }
        : undefined,
    keywords: query.keywords,
    filters: query.filters,
    locations: query.location,
    page: page,
  });

  output = result;

  return {
    result: output,
    userLocation: {
      userRequestsUsingTheirLocation: query.localIntent,
      searchRadius: userLocationRadius,
    },
  };
}
