import type { UserJSON } from "@clerk/backend";
import { redis } from "./lib/redis";
import { SubscriptionJSON } from "./stripe/stripe-sync";
import { NominationPlace } from "./validators/nomination-api";
import { SearchByGeoTextQueryArgs } from "./validators/producers";

export const USER_DATA_KV = {
  generateKey(userId: string) {
    return `users.${userId}`;
  },
  async get(userId: string) {
    return await redis.get<UserJSON>(this.generateKey(userId));
  },
  async set(user: UserJSON) {
    await redis.set(this.generateKey(user.id), user);
  },
  async delete(userId: string) {
    await redis.del(this.generateKey(userId));
  },
};

export const USER_COUNT_KV = {
  key: `users.count`,
  async get() {
    return await redis.get<number>(this.key);
  },
  async set(count: number) {
    await redis.set(this.key, count);
  },
  async increment() {
    const count = await this.get();
    await redis.set(this.key, count ? count + 1 : 1);
  },
  async decrement() {
    const count = await this.get();
    await redis.set(this.key, count ? count - 1 : 0);
  },
};

export const USER_MESSAGE_NOTIFICATIONS_KV = {
  dcrOneClampScript: `
    local per = KEYS[1]; local tot = KEYS[2]
    local v = tonumber(redis.call("GET", per) or "0")
    if v > 0 then
      v = v - 1
      redis.call("SET", per, v)
      local t = tonumber(redis.call("GET", tot) or "0") - 1
      if t < 0 then t = 0 end
      redis.call("SET", tot, t)
      return 1
    end
    return 0
  `,

  resetChatScript: `
    local per = KEYS[1]; local tot = KEYS[2]
    local cur = tonumber(redis.call("GET", per) or "0")
    if cur > 0 then
      local t = tonumber(redis.call("GET", tot) or "0") - cur
      if t < 0 then t = 0 end
      redis.call("SET", tot, t)
      redis.call("SET", per, 0)
    end
    return cur
  `,

  generatePerChatKey(userId: string, chatId: string) {
    return `users.${userId}.msg.notif.unread.${chatId}`;
  },

  generateTotalKey(userId: string) {
    return `users.${userId}.msg.notif.unread`;
  },

  async incr(userId: string, chatId: string) {
    await redis
      .multi()
      .incr(this.generatePerChatKey(userId, chatId))
      .incr(this.generateTotalKey(userId))
      .exec();
  },

  async dcr(userId: string, chatId: string) {
    await redis.eval(
      this.dcrOneClampScript,
      [this.generatePerChatKey(userId, chatId), this.generateTotalKey(userId)],
      []
    );
  },

  async getForChat(userId: string, chatId: string) {
    return await redis.get<number>(this.generatePerChatKey(userId, chatId));
  },

  async getTotal(userId: string) {
    return await redis.get<number>(this.generateTotalKey(userId));
  },

  async setTotal(userId: string, value: number) {
    return await redis.set(this.generateTotalKey(userId), value);
  },

  async setForChat(userId: string, chatId: string, value: number) {
    return await redis.set(this.generatePerChatKey(userId, chatId), value);
  },

  async resetChat(userId: string, chatId: string) {
    const per = this.generatePerChatKey(userId, chatId);
    const tot = this.generateTotalKey(userId);
    await redis.eval(this.resetChatScript, [per, tot], []);
  },
};

export const USER_DELETED_COUNT_KV = {
  key: `users.deleted-count`,
  async get() {
    return await redis.get<number>(this.key);
  },
  async set(count: number) {
    await redis.set(this.key, count);
  },
  async increment() {
    const count = await this.get();
    await redis.set(this.key, count ? count + 1 : 1);
  },
  async decrement() {
    const count = await this.get();
    await redis.set(this.key, count ? count - 1 : 0);
  },
};

export const USER_STRIPE_CUSTOMER_ID_KV = {
  generateKey(userId: string) {
    return `users.${userId}.stripe-customer-id`;
  },
  async get(userId: string) {
    return await redis.get<string>(this.generateKey(userId));
  },
  async set(userId: string, stripeCustomerId: string) {
    await redis.set(this.generateKey(userId), stripeCustomerId);
  },
};

export const STRIPE_CUSTOMER_ID_USER_KV = {
  generateKey(customerId: string) {
    return `stripe-customer.${customerId}`;
  },
  async get(customerId: string) {
    return await redis.get<string>(this.generateKey(customerId));
  },
  async set(customerId: string, userId: string) {
    await redis.set(this.generateKey(customerId), userId);
  },
};

// export const USER_ORG_ID_KV = {
//   generateKey(userId: string) {
//     return `users.${userId}.organizationId`;
//   },
//   async get(userId: string) {
//     return await redis.get<string>(this.generateKey(userId));
//   },
//   async set(userId: string, orgId: string) {
//     await redis.set<string>(this.generateKey(userId), orgId);
//   },
// };

export const USER_TOTAL_GEOCODE_REQUESTS_KV = {
  generateKey(userId: string, year: number, month: number) {
    return `users.${userId}.total-geocode-requests.${year}-${month}`;
  },
  async get(userId: string, year: number, month: number) {
    return await redis.get<number>(this.generateKey(userId, year, month));
  },
  async set(userId: string, year: number, month: number, value: number) {
    return await redis.set(this.generateKey(userId, year, month), value);
  },
};

// export const ORG_DATA_KV = {
//   generateKey(orgId: string) {
//     return `orginizations.${orgId}`;
//   },
//   async get(orgId: string) {
//     const data = await redis.get<Organization>(this.generateKey(orgId));
//     if (data == null) {
//       return data;
//     }
//     return data;
//   },
//   async set(organization: Organization) {
//     await redis.set(this.generateKey(organization.id), organization);
//   },
//   async delete(organizationId: string) {
//     await redis.del(this.generateKey(organizationId));
//   },
// };

export const USER_PRODUCER_IDS_KV = {
  generateKey(userId: string) {
    return `users.${userId}.producer-profile-ids`;
  },
  async get(userId: string) {
    const data = await redis.get<string[]>(this.generateKey(userId));
    if (data == null) {
      return data;
    }
    return data;
  },
  async set(userId: string, ids: string[]) {
    await redis.set(this.generateKey(userId), ids);
  },
  async push(userId: string, id: string) {
    const current = (await this.get(userId)) ?? [];
    current.push(id);
    await this.set(userId, current);
  },
  async pop(userId: string, id: string) {
    const current = (await this.get(userId)) ?? [];
    await this.set(
      userId,
      current.filter((i) => i !== id)
    );
  },
  async delete(userId: string) {
    await redis.del(this.generateKey(userId));
  },
};

export const ORG_STRIPE_CUSTOMER_ID_KV = {
  generateKey(orgId: string) {
    return `orgs.${orgId}.stripe-customer-id`;
  },
  async get(orgId: string) {
    return await redis.get<string>(this.generateKey(orgId));
  },
  async set(orgId: string, stripeCustomerId: string) {
    await redis.set(this.generateKey(orgId), stripeCustomerId);
  },
};

export const TOTAL_GEOCODE_REQUESTS_KV = {
  generateKey(year: number, month: number) {
    return `users.total-geocode-requests.${year}-${month}`;
  },
  async get(year: number, month: number) {
    return await redis.get<number>(this.generateKey(year, month));
  },
  async set(year: number, month: number, value: number) {
    return await redis.set(this.generateKey(year, month), value);
  },
  async increment(year: number, month: number) {
    const count = await this.get(year, month);
    await redis.set(this.generateKey(year, month), count ? count + 1 : 1);
  },
  async decrement(year: number, month: number) {
    const count = await this.get(year, month);
    await redis.set(this.generateKey(year, month), count ? count - 1 : 0);
  },
};

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
  async set(queryStr: string, queryArgs: SearchByGeoTextQueryArgs) {
    await redis.set(this.generateKey(queryStr), queryArgs, {
      ex: this.ttlSeconds,
    });
  },
  async delete(queryStr: string) {
    await redis.del(this.generateKey(queryStr));
  },
  async get(queryStr: string) {
    return await redis.get<SearchByGeoTextQueryArgs>(
      this.generateKey(queryStr)
    );
  },
};
