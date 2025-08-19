import type stripe from "stripe";
import type { UserJSON } from "@clerk/backend";
import type { Organization } from "./db/schema";
import { redis } from "./lib/redis";

type Subscription = {
  subscriptionId: string;
  status: stripe.Subscription.Status;
  priceId: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  canceledAt: number | null;
  billingCycleAnchor: number;
  billingCycleAnchorConfig: stripe.Subscription.BillingCycleAnchorConfig | null;
  billingMode: stripe.Subscription.BillingMode;
  billingThresholds: stripe.Subscription.BillingThresholds | null;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
  } | null;
};

export const USER_DATA_KV = {
  generateKey(userId: string) {
    return `users.${userId}`;
  },
  async get(userId: string) {
    const data = await redis.get<string>(this.generateKey(userId));
    if (data == null) {
      return data;
    }
    return JSON.parse(data) as UserJSON;
  },
  async set(user: UserJSON) {
    await redis.set(this.generateKey(user.id), JSON.stringify(user));
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

export const USER_STRIPE_CUSTOMER_ID_KV = {
  generateKey(userId: string) {
    return `users.${userId}.stripe-customer-id`;
  },
  async get(userId: string) {
    return await redis.get<string>(this.generateKey(userId));
  },
  async set(userId: string, stripeCustomerId: string) {
    await redis.set(this.generateKey(userId), JSON.stringify(stripeCustomerId));
  },
};

export const USER_ORG_ID_KV = {
  generateKey(userId: string) {
    return `users.${userId}.organizationId`;
  },
  async get(userId: string) {
    return await redis.get<string>(this.generateKey(userId));
  },
  async set(userId: string, orgId: string) {
    await redis.set<string>(this.generateKey(userId), orgId);
  },
};

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

export const ORG_DATA_KV = {
  generateKey(orgId: string) {
    return `orginizations.${orgId}`;
  },
  async get(orgId: string) {
    const data = await redis.get<string>(this.generateKey(orgId));
    if (data == null) {
      return data;
    }
    return JSON.parse(data) as Organization;
  },
  async set(organization: Organization) {
    await redis.set(
      this.generateKey(organization.id),
      JSON.stringify(organization)
    );
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
    await redis.set(this.generateKey(orgId), JSON.stringify(stripeCustomerId));
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

export const STRIPE_CUSTOMER_SUBSCRIPTION_KV = {
  generateKey(stripeCustomerId: string) {
    return `stripe.customer.${stripeCustomerId}.subscription`;
  },
  async get(stripeCustomerId: string) {
    const data = await redis.get<string>(this.generateKey(stripeCustomerId));
    if (data == null) {
      return data;
    }
    return JSON.parse(data) as Subscription;
  },
  async set(stripeCustomerId: string, subscription: Subscription) {
    await redis.set(
      this.generateKey(stripeCustomerId),
      JSON.stringify(subscription)
    );
  },
};
