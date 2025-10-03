"use server";
import { env } from "@/env";
import {
  submitListingRatelimit,
  waitlistRegisterRatelimit,
} from "./lib/rate-limit";
import { resend } from "./lib/resend";
import { actionClient } from "./safe-action";
import { submitListingArgs, waitlistRegisterArgs } from "./validators";
import { GeocodeResponse } from "./types";
import { headers } from "next/headers";
import { db } from "./db";
import { and, eq, isNull, like, or, sql, SQLWrapper } from "drizzle-orm";
import {
  preLaunchProducerWaitlist,
  ProducerInsert,
  producers,
  ProducerSelect,
} from "./db/schema";
import { clerk } from "./lib/clerk";

export const waitlistRegister = actionClient
  .name("waitlistRegister")
  .input(waitlistRegisterArgs)
  .action(async ({ input: { email } }) => {
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
    try {
      const reqHeaders = await headers();
      const ip =
        reqHeaders.get("CF-Connecting-IP") ||
        reqHeaders.get("X-Forwarded-For") ||
        "unknown";

      const formData = new FormData();
      formData.append("secret", env.TURNSTILE_SECRET_KEY);
      formData.append("response", input.turnstileToken);
      formData.append("remoteip", ip);

      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: formData,
        }
      );
      const turnstileResult = (await turnstileResponse.json()) as {
        success: boolean;
      };

      console.log(turnstileResult);

      if (turnstileResult.success !== true) {
        throw new Error("Turnstile validation error");
      }
    } catch (err) {
      throw new Error("Turnstile validation error");
    }

    const { success } = await submitListingRatelimit.limit("submitListing");

    if (!success) {
      throw new Error("Ratelimit exceeded");
    }

    const preparedAddress = input.address;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?key=${env.GOOGLE_MAPS_API_KEY}&address=${preparedAddress}`
    );

    const data = (await response.json()) as GeocodeResponse;

    console.log(data);

    if (
      data.status !== "OK" ||
      data.results === undefined ||
      data.results.length === 0
    ) {
      throw new Error("Invalid address");
    }

    const closestAddressMatch = data.results[0];

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
            images: { items: [], primaryImgId: null },
            commodities: [],
            socialMedia: { facebook: null, twitter: null, instagram: null },
            createdAt: new Date(),
            updatedAt: new Date(),
          } satisfies ProducerInsert)
          .returning()
          .then((r) => r[0]);
      }

      let userId: string | undefined = undefined;

      if (input.account) {
        const user = await clerk.users.createUser({
          emailAddress: [input.account.email],
          firstName: input.account.firstName,
          lastName: input.account.lastName,
          privateMetadata: {
            producerId: listing.id,
          },
        });

        userId = user.id;

        await tx
          .update(producers)
          .set({
            userId: user.id,
            claimed: true,
          })
          .where(eq(producers.id, listing.id));
      }

      await tx.insert(preLaunchProducerWaitlist).values({
        producerId: listing.id,
        userId: userId,
        email: input.account ? input.account.email : input.email,
        createdAt: new Date(),
      });
    });
  });
