"use server";
import { env } from "@/env";
import { and, eq, isNull, like, or, sql, SQLWrapper } from "drizzle-orm";
import { actionClient } from "./helpers/safe-action";
import {
  submitListingArgs,
  waitlistRegisterArgs,
} from "../validators/waitlist";
import { geocodeRatelimit, waitlistRegisterRatelimit } from "../lib/rate-limit";
import { resend } from "../lib/resend";
import { geocode } from "../lib/google-maps";
import { tryCatch } from "@/utils/try-catch";
import {
  preLaunchProducerWaitlist,
  ProducerInsert,
  producers,
  ProducerSelect,
} from "../db/schema";
import { db } from "../db";
import { clerk } from "../lib/clerk";
import { countryByAlpha2Code } from "@/utils/contries";
import { validateTurnstileUsingNextApis } from "../lib/cloudflare";

export const waitlistRegister = actionClient
  .name("waitlistRegister")
  .input(waitlistRegisterArgs)
  .action(async ({ input: { email, turnstileToken } }) => {
    const turnstileValid = await validateTurnstileUsingNextApis(turnstileToken);

    if (!turnstileValid) {
      throw new Error("Invalid captcha");
    }

    const { success } =
      await waitlistRegisterRatelimit.limit("waitlistRegister");

    if (!success) {
      throw new Error("Ratelimit exceeded");
    }

    const result = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: env.RESEND_WAITLIST_AUDIENCE_ID,
    });

    console.log(result);
  });

export const submitListing = actionClient
  .name("submitListing")
  .input(submitListingArgs)
  .action(async ({ input }) => {
    const turnstileValid = await validateTurnstileUsingNextApis(
      input.turnstileToken
    );

    if (!turnstileValid) {
      throw new Error("Invalid captcha");
    }

    const { success } = await geocodeRatelimit.limit("submitListing");

    if (!success) {
      throw new Error("Ratelimit exceeded");
    }

    const { data: geocodedAddress, error: geocodingError } = await tryCatch(
      geocode
    )(input.address);

    if (geocodedAddress === null) {
      console.log(geocodingError);
      throw new Error("Invalid address");
    }

    const closestAddressMatch = geocodedAddress.results[0];

    const optional: SQLWrapper[] = [];

    if (input.phone) {
      optional.push(eq(sql`json_extract(contact, '$.phone')`, input.phone));
    }

    let listing: ProducerSelect;

    await db.transaction(async (tx) => {
      const fromDb = await tx.query.producers.findFirst({
        where: and(
          isNull(producers.userId),
          eq(producers.claimed, false),
          or(
            like(producers.name, input.name),
            eq(sql`json_extract(contact, '$.email')`, input.email),
            and(
              eq(
                sql`json_extract(address, '$.coordinate.latitude')`,
                closestAddressMatch.geometry.location.lat
              ),
              eq(
                sql`json_extract(address, '$.coordinate.longitude')`,
                closestAddressMatch.geometry.location.lng
              )
            ),
            ...optional
          )
        ),
      });

      if (fromDb) {
        listing = fromDb;
      } else {
        listing = await tx
          .insert(producers)
          .values({
            id: crypto.randomUUID(),
            name: input.name,
            type: input.type,
            claimed: true,
            verified: false,
            contact: {
              email: input.email,
              phone: input.phone,
            },
            images: { items: [], primaryImgId: null },
            commodities: [],
            address: {
              street:
                `${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "street_number"))?.long_name ?? ""} ${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "route"))?.long_name ?? ""}`.trim(),
              city: `${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "locality"))?.long_name ?? ""}`.trim(),
              state:
                `${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "administrative_area_level_1"))?.long_name ?? ""}`.trim(),
              country:
                `${countryByAlpha2Code(closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "country"))?.short_name.toLowerCase() ?? "us").alpha3}`.trim(),
              zip: `${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "postal_code"))?.long_name ?? ""} ${closestAddressMatch.address_components.find((comp) => comp.types.some((t) => t === "postal_code_suffix"))?.long_name ?? ""}`.trim(),
            },
            socialMedia: { facebook: null, twitter: null, instagram: null },
            createdAt: new Date(),
            updatedAt: new Date(),
            subscriptionRank: 0,
          } satisfies ProducerInsert)
          .returning()
          .then((r) => r[0]);
      }

      let userId: string | undefined = undefined;

      if (input.account) {
        try {
          const user = await clerk.users.createUser({
            emailAddress: [input.account.email],
            firstName: input.account.firstName,
            lastName: input.account.lastName,
            password: input.account.password,
            privateMetadata: {
              producerId: listing.id,
            },
            skipPasswordChecks: true,
          });
          userId = user.id;

          await tx
            .update(producers)
            .set({
              userId: user.id,
              claimed: true,
            })
            .where(eq(producers.id, listing.id));
        } catch (err) {
          console.log(err);
          throw new Error("Invalid account data");
        }
      }

      await tx.insert(preLaunchProducerWaitlist).values({
        producerId: listing.id,
        userId: userId,
        email: input.account ? input.account.email : input.email,
        createdAt: new Date(),
      });
    });
  });
