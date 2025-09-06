"use server";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  pinboards,
  pinListItems,
  pinLists,
  pins,
  producers,
} from "../db/schema";
import { authenticatedActionClient } from "./helpers/middleware";
import {
  addToPinboardArgs,
  getPinboardStatusArgs,
  removeFromPinboardArgs,
  updateUserPinboardArgs,
} from "../validators/pinboard";

export const getUserPinboard = authenticatedActionClient.action(
  async ({ userId }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
    });

    if (pinboard) {
      return pinboard;
    }

    const newPinboard = await db
      .insert(pinboards)
      .values({
        id: crypto.randomUUID(),
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((r) => r[1]);

    return newPinboard;
  },
);

export const getUserPinboardFull = authenticatedActionClient.action(
  async ({ userId }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      with: {
        pins: {
          with: {
            producer: {
              columns: {
                id: true,
                name: true,
                images: true,
                claimed: true,
                address: true,
              },
            },
          },
        },
        pinLists: {
          with: {
            items: true,
          },
        },
      },
    });

    if (pinboard) {
      console.log(pinboard);
      return pinboard;
    }

    const newPinboard = await db
      .insert(pinboards)
      .values({
        id: crypto.randomUUID(),
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((r) => r[1]);

    return { ...newPinboard, pins: [], pinLists: [] };
  },
);

export const updateUserPinboard = authenticatedActionClient
  .input(updateUserPinboardArgs)
  .action(async ({ ctx: { userId }, input: { viewMode } }) => {
    await db
      .update(pinboards)
      .set({ viewMode, createdAt: new Date() })
      .where(eq(pinboards.userId, userId));
  });

export const addToPinboard = authenticatedActionClient
  .input(addToPinboardArgs)
  .action(async ({ ctx: { userId }, input: { producerId, pinListId } }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      columns: {
        id: true,
      },
    });

    const producer = await db.query.producers.findFirst({
      where: eq(producers.id, producerId),
      columns: {
        id: true,
      },
    });

    if (!pinboard) {
      throw new Error("Pinboard not found");
    }

    if (!producer) {
      throw new Error("Producer not found");
    }

    if (pinListId) {
      const pinList = await db.query.pinLists.findFirst({
        where: and(
          eq(pinLists.id, pinListId),
          eq(pinLists.pinboardId, pinboard.id),
        ),
      });

      if (!pinList) {
        throw new Error("Pinlist not found");
      }
    }

    const pinId = crypto.randomUUID();

    await db.insert(pins).values({
      id: pinId,
      pinboardId: pinboard.id,
      producerId: producerId,
      createdAt: new Date(),
    });

    if (pinListId) {
      await db.insert(pinListItems).values({
        pinId: pinId,
        pinListId: pinListId,
        createdAt: new Date(),
      });
    }
  });

export const removeFromPinboard = authenticatedActionClient
  .input(removeFromPinboardArgs)
  .action(async ({ ctx: { userId }, input: { pinId } }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      columns: {
        id: true,
      },
    });

    if (!pinboard) {
      throw new Error("Pinboard not found");
    }

    const deleted = await db
      .delete(pins)
      .where(and(eq(pins.pinboardId, pinboard.id), eq(pins.id, pinId)))
      .returning();

    if (deleted.length > 0) {
      await db.delete(pinListItems).where(eq(pinListItems.pinId, pinId));
    }
  });

export const getUserProducerPin = authenticatedActionClient
  .input(getPinboardStatusArgs)
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      columns: {
        id: true,
      },
    });

    if (!pinboard) {
      throw new Error("Pinboard not found");
    }

    const pin = await db.query.pins.findFirst({
      where: and(
        eq(pins.producerId, producerId),
        eq(pins.pinboardId, pinboard.id),
      ),
    });

    return pin;
  });

export type PinboardFull = Awaited<ReturnType<typeof getUserPinboardFull>>;
