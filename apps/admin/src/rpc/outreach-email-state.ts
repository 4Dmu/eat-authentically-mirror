"use server";

import { db } from "@ea/db";
import { authenticatedActionClient } from "./helpers/middleware";
import { asc, eq, isNotNull, sql } from "drizzle-orm";
import {
  producerContact,
  producerOutreachEmailState,
  producers,
} from "@ea/db/schema";
import { type } from "arktype";

export const list = authenticatedActionClient
  .name("outreachEmailState.list")
  .input(
    type({
      limit: "number",
      offset: "number",
    })
  )
  .action(async ({ input: { limit, offset } }) => {
    const data = await db
      .select({
        producerId: producerOutreachEmailState.producerId,
        email: sql<string>`${producerContact.email}`,
        producerName: sql<string>`${producers.name}`,
        emailStep: producerOutreachEmailState.emailStep,
        lastEmailSent: producerOutreachEmailState.lastEmailSent,
        nextEmailAt: producerOutreachEmailState.nextEmailAt,
        createdAt: producerOutreachEmailState.createdAt,
        completedAt: producerOutreachEmailState.completedAt,
        updatedAt: producerOutreachEmailState.updatedAt,
        metadata: producerOutreachEmailState.metadata,
      })
      .from(producerOutreachEmailState)
      .leftJoin(
        producerContact,
        eq(producerOutreachEmailState.producerId, producerContact.producerId)
      )
      .leftJoin(producers, eq(producers.id, producerContact.producerId))
      .where(isNotNull(producerContact.email))
      .limit(limit + 1)
      .offset(offset);

    if (data.length <= limit) {
      return {
        data: data,
        hasMore: false,
      };
    }

    return {
      data: data,
      hasMore: true,
    };
  });

export type OutreachEmailState = Awaited<
  ReturnType<typeof list>
>["data"][number];

export type OutreachEmailStateList = Awaited<ReturnType<typeof list>>;
