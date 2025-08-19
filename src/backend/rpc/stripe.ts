"use server";
import { stripe } from "../lib/stripe";
import { env } from "@/env";
import {
  authenticatedWithUserActionClient,
  membeSubedActionClient,
} from "./helpers/middleware";
import { currentUser } from "@clerk/nextjs/server";
import {
  STRIPE_CUSTOMER_SUBSCRIPTION_KV,
  USER_STRIPE_CUSTOMER_ID_KV,
} from "../kv";

export const createMemberCheckoutSession =
  authenticatedWithUserActionClient.action(
    async ({ ctx: { userId, user } }) => {
      let stripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);
      const existingSub = stripeCustomerId
        ? await STRIPE_CUSTOMER_SUBSCRIPTION_KV.get(stripeCustomerId)
        : null;

      if (existingSub?.status === "active") {
        throw new Error("You already have an active subscription");
      }

      console.log(
        "CREATE MEMBER CHECKOUT SESSION Here's the stripe id we got from kv:",
        stripeCustomerId
      );

      if (!stripeCustomerId) {
        console.log(
          "CREATE MEMBER CHECKOUT SESSION No stripe id found in kv, creatring new customer",
          stripeCustomerId
        );

        const userData = await currentUser();

        const newCustomer = await stripe.customers.create({
          email:
            user?.emailAddresses?.find(
              (e) => e.id === user.primaryEmailAddressId
            )?.emailAddress ?? userData?.emailAddresses?.[0]?.emailAddress,
          metadata: {
            userId: userId,
          },
        });

        await USER_STRIPE_CUSTOMER_ID_KV.set(userId, newCustomer.id);

        console.log(
          "CREATE MEMBER CHECKOUT SESSION Customer Created",
          newCustomer
        );

        stripeCustomerId = newCustomer.id;
      }

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          line_items: [
            { price: env.COMMUNITY_MEMBER_MONTLY_PRICE_ID, quantity: 1 },
          ],
          mode: "subscription",
          success_url: `${env.SITE_URL}/members/subscribe/success`,
          cancel_url: `${env.SITE_URL}/members/subscribe/cancel`,
          subscription_data: {
            metadata: {
              userId: userId,
            },
          },
          customer: stripeCustomerId,
          allow_promotion_codes: true,
        });
      } catch (err) {
        console.error(err);
        throw new Error(
          "Failed to create checkout session. Pleae refresh and try again."
        );
      }

      return session.url!;
    }
  );

export const createBillingPortalSession = membeSubedActionClient.action(
  async ({ ctx: { userId } }) => {
    const customerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);

    if (!customerId) {
      throw new Error("Error creating billing session");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: env.SITE_URL,
    });

    return session.url;
  }
);
