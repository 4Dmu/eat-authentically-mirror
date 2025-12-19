import type { UserJSON } from "@clerk/backend";
import { redis } from "./redis";
import { format, parse, subDays } from "date-fns";

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

export const PRODUCER_COUNTRIES_CACHE = {
  ttlSeconds: 60 * 10,
  generateKey() {
    return `producer:countries-cache`;
  },
  async set(countries: string[]) {
    await redis.set(this.generateKey(), countries, {
      ex: this.ttlSeconds,
    });
  },
  async delete() {
    await redis.del(this.generateKey());
  },
  async get() {
    return await redis.get<string[]>(this.generateKey());
  },
};

export const COMMODITIES_CACHE = {
  generateKey() {
    return `producer:commodities-cache`;
  },
  async set(commodities: string[]) {
    await redis.set(this.generateKey(), commodities);
  },
  async get() {
    return (await redis.get<string[]>(this.generateKey())) ?? [];
  },
  async add(commodity: string) {
    const existing = (await this.get()) ?? [];
    existing.push(commodity);
    await this.set(existing);
  },
  async remove(commodity: string) {
    const existing = (await this.get()) ?? [];
    await this.set(existing.filter((e) => e !== commodity));
  },
};

export const COMMODITY_VARIANTS_CACHE = {
  generateKey() {
    return `producer:commodity-aliases-cache`;
  },
  async set(variants: string[]) {
    await redis.set(this.generateKey(), variants);
  },
  async get() {
    return (await redis.get<string[]>(this.generateKey())) ?? [];
  },
  async add(variant: string) {
    const existing = (await this.get()) ?? [];
    existing.push(variant);
    await this.set(existing);
  },
  async remove(variant: string) {
    const existing = (await this.get()) ?? [];
    await this.set(existing.filter((e) => e !== variant));
  },
};

export const VERCEL_CRON = {
  key: "global:vercel:cron-ran",
  async getRan() {
    const ran = await redis.get<string>(this.key);
    return ran !== null;
  },
  async setRan() {
    await redis.set(this.key, "yes", { ex: 60 * 60 * 24 });
  },
};

/**
 * Base class: shared logic for hashing, retrieval, expiration, ranges, etc.
 */
class BaseAnalytics {
  retention = 60 * 60 * 24 * 90;

  date(sub = 0) {
    return format(subDays(new Date(), sub), "dd/MM/yyyy");
  }

  async _incrementHash(key: string, mode: "public" | "authenticated") {
    let hash = await redis.hgetall(key);

    if (hash) {
      hash[mode] = Number(hash[mode]) + 1;
    } else {
      hash = { public: 0, authenticated: 0 };
      hash[mode] = 1;
    }

    await redis.hset(key, hash);
    await redis.expire(key, this.retention);
  }

  async _retrieve(key: string) {
    const hash = await redis.hgetall<{ public: number; authenticated: number }>(
      key
    );

    return hash
      ? { ...hash, total: hash.public + hash.authenticated }
      : { public: 0, authenticated: 0, total: 0 };
  }

  async _retrieveDays(genKey: (date: string) => string, nDays: number) {
    const promises = [];

    for (let i = 0; i < nDays; i++) {
      const dt = this.date(i);
      promises.push(
        this._retrieve(genKey(dt)).then((stats) => ({ date: dt, stats }))
      );
    }

    const data = await Promise.all(promises);

    data.sort((a, b) =>
      parse(a.date, "dd/MM/yyyy", new Date()) >
      parse(b.date, "dd/MM/yyyy", new Date())
        ? 1
        : -1
    );

    return {
      days: data,
      total: data.reduce((sum, item) => sum + item.stats.total, 0),
    };
  }
}

/**
 * Per-producer analytics
 */
class ProducerAnalytics extends BaseAnalytics {
  generateKey(producerId: string, date: string) {
    return `producer:${producerId}:views:${date}`;
  }

  async track(producerId: string, mode: "public" | "authenticated") {
    const date = this.date();
    const key = this.generateKey(producerId, date);

    // 1. Increment daily producer stats
    await this._incrementHash(key, mode);

    // 2. Increment global daily stats
    await GLOBAL_PRODUCER_PROFILE_ANALYTICS.track(mode);

    // 3. Update ranking indexes
    await redis.zincrby("producer:views:alltime", 1, producerId);
    await redis.zincrby(`producer:views:${date}`, 1, producerId);

    // 4. Increment global running total
    await redis.incr("global:views:total");
  }

  async retrieve(producerId: string, date: string) {
    const stats = await this._retrieve(this.generateKey(producerId, date));
    return {
      date,
      stats,
    };
  }

  retrieveDays(producerId: string, nDays: number) {
    return this._retrieveDays(
      (date) => this.generateKey(producerId, date),
      nDays
    );
  }

  async getTopProducers(n: number) {
    const results = await redis.zrange<string[]>(
      "producer:views:alltime",
      0,
      n - 1,
      {
        rev: true,
        withScores: true,
      }
    );
    return this._formatZsetResults(results);
  }

  // Get least viewed N producers (optional but useful)
  async getLeastViewedProducers(n: number) {
    const results = await redis.zrange<string[]>(
      "producer:views:alltime",
      0,
      n - 1,
      {
        withScores: true,
      }
    );
    return this._formatZsetResults(results);
  }

  // Compare today vs yesterday (difference score)
  async getTrendingProducers(n: number) {
    const today = this.date(0);
    const yesterday = this.date(1);

    const [todayViews, yesterdayViews] = await Promise.all([
      redis.zrange<string[]>(`producer:views:${today}`, 0, -1, {
        withScores: true,
      }),
      redis.zrange<string[]>(`producer:views:${yesterday}`, 0, -1, {
        withScores: true,
      }),
    ]);

    const todayMap = this._formatZsetMap(todayViews);
    const yesterdayMap = this._formatZsetMap(yesterdayViews);

    const trending = [];

    for (const pid in todayMap) {
      const diff = todayMap[pid] - (yesterdayMap[pid] ?? 0);
      trending.push({ producerId: pid, delta: diff });
    }

    trending.sort((a, b) => b.delta - a.delta);
    return trending.slice(0, n);
  }

  /****************************
   *      TOTAL HELPERS
   ****************************/

  async getProducerTotalViews(producerId: string) {
    const score = await redis.zscore("producer:views:alltime", producerId);
    return Number(score || 0);
  }

  async getAllProducerTotals() {
    const results = await redis.zrange<string[]>(
      "producer:views:alltime",
      0,
      -1,
      {
        withScores: true,
      }
    );
    return this._formatZsetResults(results);
  }

  async getProducerCount() {
    return redis.zcard("producer:views:alltime");
  }

  async getGlobalTotalViews() {
    return Number(await redis.get("global:views:total")) || 0;
  }

  /****************************
   *      INTERNAL HELPERS
   ****************************/

  _formatZsetMap(arr: string[]) {
    const map: Record<string, number> = {};
    for (let i = 0; i < arr.length; i += 2) {
      map[arr[i]] = Number(arr[i + 1]);
    }
    return map;
  }

  _formatZsetResults(arr: string[]) {
    const results: Array<{ producerId: string; views: number }> = [];
    for (let i = 0; i < arr.length; i += 2) {
      results.push({ producerId: arr[i], views: Number(arr[i + 1]) });
    }
    return results;
  }
}

/**
 * Global analytics (no producerId)
 */
class GlobalProducerAnalytics extends BaseAnalytics {
  generateKey(date: string) {
    return `producers:views:${date}`;
  }

  async track(mode: "public" | "authenticated") {
    const key = this.generateKey(this.date());
    await this._incrementHash(key, mode);
  }

  retrieve(date: string) {
    return this._retrieve(this.generateKey(date)).then((stats) => ({
      date,
      stats,
    }));
  }

  retrieveDays(nDays: number) {
    return this._retrieveDays((date) => this.generateKey(date), nDays);
  }
}

export const PRODUCER_PROFILE_ANALYTICS = new ProducerAnalytics();
export const GLOBAL_PRODUCER_PROFILE_ANALYTICS = new GlobalProducerAnalytics();

export type NDaysAnalytics = Awaited<
  ReturnType<typeof PRODUCER_PROFILE_ANALYTICS.retrieveDays>
>;
