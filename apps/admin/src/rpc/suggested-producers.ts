"use server";
import type { UserJSON } from "@clerk/backend";
import { db } from "@ea/db";
import {
  type Address,
  type ProducerInsert,
  producerContact,
  producerLocation,
  producers,
  producersSearch,
  suggestedProducers,
} from "@ea/db/schema";
import { USER_DATA_KV } from "@ea/kv";
import { type ProducerSearchResultRow, typesense } from "@ea/search";
import { approveSuggestedProducerArgs } from "@ea/validators/producers";
import { and, desc, eq } from "drizzle-orm";
import { encode } from "ngeohash";
import { authenticatedActionClient } from "./helpers/middleware";

export type SuggestedProducersListItem = {
  suggesterUserData: UserJSON | null;
  type: "farm" | "ranch" | "eatery";
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  suggesterUserId: string;
  address: Address | null;
  phone: string | null;
};

export const list = authenticatedActionClient
  .name("suggested-producers.list")
  .action(async () => {
    const producers = await db.query.suggestedProducers.findMany({
      orderBy: desc(suggestedProducers.createdAt),
      where: eq(suggestedProducers.status, "pending"),
    });

    const suggestions = [];

    for (const producer of producers) {
      const userWithSuggestion = await USER_DATA_KV.get(
        producer.suggesterUserId,
      );
      suggestions.push({ ...producer, suggesterUserData: userWithSuggestion });
    }

    return suggestions satisfies SuggestedProducersListItem[];
  });

export const approve = authenticatedActionClient
  .input(approveSuggestedProducerArgs)
  .name("suggested-producers.approve")
  .action(async ({ input }) => {
    const suggested = await db.query.suggestedProducers.findFirst({
      where: and(
        eq(suggestedProducers.id, input.suggestedProducerId),
        eq(suggestedProducers.status, "pending"),
      ),
      orderBy: desc(suggestedProducers.createdAt),
    });

    if (!suggested) {
      throw new Error("Suggestion not found");
    }

    const producerProfileId = crypto.randomUUID();

    const subscriptionRank = 0;

    await db.insert(producers).values({
      id: producerProfileId,
      name: suggested.name,
      type: suggested.type,
      verified: true,
      about: input.additional.about,
      summary: input.additional.about.substring(0, 200),
      subscriptionRank: subscriptionRank,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies ProducerInsert);

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents();

    const typsenseDocResult = await docs.create({
      id: producerProfileId,
      userId: undefined,
      verified: true,
      name: suggested.name,
      type: suggested.type,
      summary: input.additional.about.substring(0, 200),
      avgRating: 0,
      bayesAvg: 0,
      reviewCount: 0,
      subscriptionRank: subscriptionRank,
      certifications: [],
      commodities: [],
      labels: [],
      country: suggested.address?.country,
      city: suggested.address?.city,
      adminArea: suggested.address?.state,
      locality: suggested.address?.street,
      location: [input.additional.lat, input.additional.lng],
      coverUrl: undefined,
      organic: false,
      createdAt: Math.floor(new Date().getDate() / 1000),
      updatedAt: Math.floor(new Date().getDate() / 1000),
    });

    console.log(typsenseDocResult);

    await db.insert(producersSearch).values({
      producerId: producerProfileId,
      searchName: suggested.name,
      searchSummary: input.additional.about.substring(0, 200),
    });

    await db.insert(producerContact).values({
      producerId: producerProfileId,
      email: suggested.email,
      phone: suggested.phone,
    });

    await db.insert(producerLocation).values({
      producerId: producerProfileId,
      country: suggested.address?.country,
      city: suggested.address?.city,
      adminArea: suggested.address?.state,
      locality: suggested.address?.street,
      latitude: input.additional.lat,
      longitude: input.additional.lng,
      postcode: suggested.address?.zip,
      geohash: encode(input.additional.lat, input.additional.lng),
    });

    await db.update(suggestedProducers).set({
      status: "accepted",
      updatedAt: new Date(),
    });

    return producerProfileId;
  });
