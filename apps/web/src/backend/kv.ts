import type { SubscriptionJSON } from "./stripe/stripe-sync";
import type { NominationPlace } from "@ea/validators/nomination-api";
import type { SearchByGeoTextQueryArgs } from "@ea/validators/producers";
import type { GeocodeResponse } from "@ea/validators/google-geocode-api";
import { redis } from "@ea/kv/redis";

export const STRIPE_CUSTOMER_SUBSCRIPTIONS_KV = {
  generateKey(stripeCustomerId: string) {
    return `stripe.customer.${stripeCustomerId}.subscription`;
  },
  async get(stripeCustomerId: string) {
    const data = await redis.get<SubscriptionJSON[]>(
      this.generateKey(stripeCustomerId)
    );
    if (data == null) {
      return data;
    }
    return data;
  },
  async set(stripeCustomerId: string, subscriptions: SubscriptionJSON[]) {
    await redis.set(this.generateKey(stripeCustomerId), subscriptions);
  },
};

export const NominatimGeocodeResponseCache = {
  generateKey(query: string) {
    return `nominatim:geocode-response:${query}`;
  },
  async set(query: string, response: NominationPlace) {
    return await redis.set(this.generateKey(query), response);
  },
  async get(query: string) {
    return await redis.get<NominationPlace>(this.generateKey(query));
  },
};

export const GOOGLE_GEOCODE_RESPONSE_CACHE = {
  generateKey(query: string) {
    return `google:geocode-response:${query}`;
  },
  async set(query: string, response: GeocodeResponse) {
    return await redis.set(this.generateKey(query), response);
  },
  async get(query: string) {
    return await redis.get<GeocodeResponse>(this.generateKey(query));
  },
};

export const SEARCH_BY_GEO_TEXT_PAGINATION_CACHE = {
  ttlSeconds: 120,
  generateKey(query: string) {
    return `search_by_geo_text:query-pagination-cache:${query}`;
  },
  async set(id: string, query: SearchByGeoTextQueryArgs) {
    await redis.set(this.generateKey(id), query, {
      ex: this.ttlSeconds,
    });
  },
  async delete(id: string) {
    await redis.del(this.generateKey(id));
  },
  async get(id: string) {
    const key = this.generateKey(id);
    const value = await redis.get<SearchByGeoTextQueryArgs>(key);
    if (value) {
      await redis.expire(key, this.ttlSeconds);
    }
    return value;
  },
};

export const SEARCH_BY_GEO_TEXT_QUERIES_CACHE = {
  ttlSeconds: 60 * 60 * 24 * 5,
  generateKey(queryStr: string) {
    return `search_by_geo_text:transformed-query-cache:${queryStr}`;
  },
  async set(
    queryStr: string,
    queryArgs: SearchByGeoTextQueryArgs & {
      userRequestsUsingTheirLocation?: boolean;
    }
  ) {
    await redis.set(this.generateKey(queryStr), queryArgs, {
      ex: this.ttlSeconds,
    });
  },
  async delete(queryStr: string) {
    await redis.del(this.generateKey(queryStr));
  },
  async get(queryStr: string) {
    return await redis.get<
      SearchByGeoTextQueryArgs & { userRequestsUsingTheirLocation?: boolean }
    >(this.generateKey(queryStr));
  },
};
