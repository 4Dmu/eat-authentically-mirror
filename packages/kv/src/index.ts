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

export const PRODUCER_PROFILE_ANALYTICS = {
  retention: 60 * 60 * 24 * 90,

  date(sub = 0) {
    return format(subDays(new Date(), sub), "dd/MM/yyyy");
  },

  generateKey(producerId: string, date: string) {
    const staticKey = `producer:${producerId}:profile-analytics`;
    return `${staticKey}:${date}`;
  },

  async track(producerId: string, mode: "public" | "authenticated") {
    const key = this.generateKey(producerId, this.date());
    let hash: Record<string, unknown>;
    const existingHash = await redis.hgetall(key);
    if (existingHash) {
      hash = existingHash;
      hash[mode] = Number(hash[mode]) + 1;
    } else {
      hash = { public: 0, authenticated: 0 };
      hash[mode] = 1;
    }

    await redis.hset(key, hash);
    await redis.expire(key, this.retention);
  },

  async retrieve(producerId: string, date: string) {
    const key = this.generateKey(producerId, date);
    const hash = await redis.hgetall<{ public: number; authenticated: number }>(
      key
    );

    return {
      date: date,
      stats: hash
        ? { ...hash, total: hash.authenticated + hash.public }
        : { public: 0, authenticated: 0, total: 0 },
    };
  },

  async retrieveDays(producerId: string, nDays: number) {
    type RetrievePromise = ReturnType<typeof this.retrieve>;
    const promises: RetrievePromise[] = [];
    for (let i = 0; i < nDays; i++) {
      const date = this.date(i);
      promises.push(this.retrieve(producerId, date));
    }

    const fetched = await Promise.all(promises);

    const data = fetched.sort((a, b) => {
      if (
        parse(a.date, "dd/MM/yyyy", new Date()) >
        parse(b.date, "dd/MM/yyyy", new Date())
      ) {
        return 1;
      }
      return -1;
    });

    return {
      days: data,
      total: data.reduce((total, item) => {
        return item.stats.total + total;
      }, 0),
    };
  },
};

export type NDaysAnalytics = Awaited<
  ReturnType<typeof PRODUCER_PROFILE_ANALYTICS.retrieveDays>
>;
