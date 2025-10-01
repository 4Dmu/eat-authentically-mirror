"use server";
import { and, count, eq, inArray } from "drizzle-orm";
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
  deletePinListArgs,
  getPinboardStatusArgs,
  newPinListArgs,
  removeFromPinboardArgs,
  syncPinsPinlistMembershipsArgs,
  updateUserPinboardArgs,
} from "../validators/pinboard";

export const getUserPinboard = authenticatedActionClient
  .name("getUserPinboard")
  .action(async ({ userId }) => {
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
  });

export const getUserPinboardFull = authenticatedActionClient
  .name("getUserPinboardFull")
  .action(async ({ userId }) => {
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
  });

export const updateUserPinboard = authenticatedActionClient
  .name("updateUserPinboard")
  .input(updateUserPinboardArgs)
  .action(async ({ ctx: { userId }, input: { viewMode } }) => {
    await db
      .update(pinboards)
      .set({ viewMode, createdAt: new Date() })
      .where(eq(pinboards.userId, userId));
  });

export const addToPinboard = authenticatedActionClient
  .name("addToPinboard")
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
          eq(pinLists.pinboardId, pinboard.id)
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
  .name("removeFromPinboard")
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
  .name("getUserProducerPin")
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
        eq(pins.pinboardId, pinboard.id)
      ),
    });

    return pin;
  });

export const newPinList = authenticatedActionClient
  .name("newPinList")
  .input(newPinListArgs)
  .action(async ({ ctx: { userId }, input: { name } }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      columns: {
        id: true,
      },
    });

    if (!pinboard) {
      throw new Error("Pinboard not found");
    }

    const id = crypto.randomUUID();

    await db.insert(pinLists).values({
      id: id,
      pinboardId: pinboard.id,
      name: name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return id;
  });

export const deletePinList = authenticatedActionClient
  .name("deletePinList")
  .input(deletePinListArgs)
  .action(async ({ ctx: { userId }, input: { pinListId } }) => {
    const pinboard = await db.query.pinboards.findFirst({
      where: eq(pinboards.userId, userId),
      columns: {
        id: true,
      },
    });

    if (!pinboard) {
      throw new Error("Pinboard not found");
    }

    const pinlist = await db.query.pinLists.findFirst({
      where: and(
        eq(pinLists.pinboardId, pinboard.id),
        eq(pinLists.id, pinListId)
      ),
      columns: {
        id: true,
      },
    });

    if (!pinlist) {
      throw new Error("Pinlist not found");
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(pinListItems)
        .where(eq(pinListItems.pinListId, pinlist.id));

      await tx.delete(pinLists).where(eq(pinLists.id, pinlist.id));
    });
  });

export const syncPinsPinlistMemberships = authenticatedActionClient
  .name("syncPinsPinlistMemberships")
  .input(syncPinsPinlistMembershipsArgs)
  .action(async ({ ctx: { userId }, input: { pinId, pinListIds } }) => {
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
      where: and(eq(pins.id, pinId), eq(pins.pinboardId, pinboard.id)),
      columns: {
        id: true,
      },
    });

    if (!pin) {
      throw new Error("Pin not found");
    }

    if (pinListIds.length > 0) {
      const validCount = await db
        .select({ count: count() })
        .from(pinLists)
        .where(
          and(
            inArray(pinLists.id, pinListIds),
            eq(pinLists.pinboardId, pinboard.id)
          )
        )
        .then((rows) => rows[0]?.count || 0);

      if (validCount !== pinListIds.length) {
        throw new Error("Some pinListIds do not belong to the pinboard");
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(pinListItems).where(eq(pinListItems.pinId, pin.id));

      if (pinListIds.length > 0) {
        await tx.insert(pinListItems).values(
          pinListIds.map((p) => ({
            pinId: pin.id,
            pinListId: p,
            createdAt: new Date(),
          }))
        );
      }
    });
  });

export type PinboardFull = Awaited<ReturnType<typeof getUserPinboardFull>>;
