// "use server";
// import { createServerFn } from "@tanstack/react-start";
// import { authenticate, hasMemberSub } from "../middleware";
// import {
//   associateStripeCustomerWithUser,
//   getStripeCustomerIdByUserId,
//   getStripeSubByUserId,
//   getUserData,
// } from "../kv";
// import { stripe } from "../lib/stripe";
// import { env } from "@/env";
// import { getRequestURL } from "@tanstack/react-start/server";

// export const createMemberCheckoutSession = createServerFn()
//   .middleware([authenticate])
//   .handler(async ({ context: { userId } }) => {
//     const existingSub = await getStripeSubByUserId(userId);

//     if (existingSub?.status === "active") {
//       throw new Error("You already have an active subscription");
//     }

//     let stripeCustomerId =
//       (await getStripeCustomerIdByUserId(userId)) ?? undefined;

//     console.log(
//       "CREATE MEMBER CHECKOUT SESSION Here's the stripe id we got from kv:",
//       stripeCustomerId
//     );

//     if (!stripeCustomerId) {
//       console.log(
//         "CREATE MEMBER CHECKOUT SESSION No stripe id found in kv, creatring new customer",
//         stripeCustomerId
//       );

//       const userData = await getUserData(userId);

//       const newCustomer = await stripe.customers.create({
//         email:
//           userData?.email_addresses?.find(
//             (e) => e.id === userData.primary_email_address_id
//           )?.email_address ?? userData?.email_addresses?.[0]?.email_address,
//         metadata: {
//           userId: userId,
//         },
//       });

//       await associateStripeCustomerWithUser(userId, newCustomer.id);

//       console.log(
//         "CREATE MEMBER CHECKOUT SESSION Customer Created",
//         newCustomer
//       );

//       stripeCustomerId = newCustomer.id;
//     }

//     let session;
//     try {
//       const url = getRequestURL();
//       console.log(new URL("/members/subscribe/success", url).toString());
//       session = await stripe.checkout.sessions.create({
//         line_items: [
//           { price: env.COMMUNITY_MEMBER_MONTLY_PRICE_ID, quantity: 1 },
//         ],
//         mode: "subscription",
//         success_url: new URL("/members/subscribe/success", url).toString(),
//         cancel_url: new URL("/members/subscribe/cancel", url).toString(),
//         subscription_data: {
//           metadata: {
//             userId: userId,
//           },
//         },
//         customer: stripeCustomerId,
//         allow_promotion_codes: true,
//       });
//     } catch (err) {
//       console.error(err);
//       throw new Error(
//         "Failed to create checkout session. Pleae refresh and try again."
//       );
//     }

//     return session.url!;
//   });

// export const createBillingPortalSession = createServerFn()
//   .middleware([hasMemberSub])
//   .handler(async ({ context: { userId } }) => {
//     const customerId = await getStripeCustomerIdByUserId(userId);

//     if (!customerId) {
//       throw new Error("Error creating billing session");
//     }
//     const url = getRequestURL();
//     const session = await stripe.billingPortal.sessions.create({
//       customer: customerId,
//       return_url: new URL("/", url).toString(),
//     });

//     return session.url;
//   });
