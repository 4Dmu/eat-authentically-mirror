"use server";
import { authenticatedActionClient } from "./helpers/middleware";
import { db } from "@ea/db";
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  mediaAssets,
  producerChatMessages,
  producerChats,
  producerMedia,
  producers,
} from "@ea/db/schema";
import { messageRatelimit } from "../lib/rate-limit";
import { getSubTier } from "./utils/get-sub-tier";
import {
  blockProducerChatArgs,
  blockUserChatArgs,
  getProducerChatArgs,
  getUserChatMessageNotificationsCountArgs,
  getUserOrProducerChatArgs,
  listProducerChatsArgs,
  replyToUserMessageArgs,
  resetChatNotificationsArgs,
  sendMessageToProducerArgs,
  unblockProducerChatArgs,
  unblockUserChatArgs,
} from "../validators/messages";
import { USER_DATA_KV, USER_MESSAGE_NOTIFICATIONS_KV } from "../kv";

export const sendMessageToProducer = authenticatedActionClient
  .input(sendMessageToProducerArgs)
  .name("sendMessageToProducer")
  .action(async ({ ctx: { userId }, input: { producerId, message } }) => {
    const { success } = await messageRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceeded");
    }

    const subTier = await getSubTier(userId);

    if (subTier === "Free") {
      throw new Error("Upgrade to send messages to producers");
    }

    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, producerId),
        isNotNull(producers.userId),
        ne(producers.userId, userId)
      ),
      columns: { id: true, userId: true },
    });

    if (!producer || !producer.userId) {
      throw new Error("Invalid producer id");
    }

    let chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.producerId, producerId),
        eq(producerChats.initiatorUserId, userId)
      ),
    });

    if (chat === undefined) {
      chat = await db
        .insert(producerChats)
        .values({
          id: crypto.randomUUID(),
          producerId: producer.id,
          producerUserId: producer.userId,
          initiatorUserId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then((r) => r[0]!);
    }

    if (chat?.producerPreventedMoreMessagesAt !== null) {
      throw new Error("Producer has disabled this chat.");
    }

    if (chat?.initiatorPreventedMoreMessagesAt !== null) {
      throw new Error("User has disabled this chat.");
    }

    await db
      .update(producerChats)
      .set({ updatedAt: new Date() })
      .where(eq(producerChats.id, chat.id));

    await db.insert(producerChatMessages).values({
      id: crypto.randomUUID(),
      chatId: chat!.id,
      senderUserId: userId,
      content: message,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await USER_MESSAGE_NOTIFICATIONS_KV.incr(producer.userId, chat.id);

    return chat.id;
  });

export const replyToUserMessage = authenticatedActionClient
  .input(replyToUserMessageArgs)
  .name("replyToUserMessage")
  .action(
    async ({ ctx: { userId }, input: { producerId, message, chatId } }) => {
      const { success } = await messageRatelimit.limit(userId);

      if (!success) {
        throw new Error("Rate limit exceeded");
      }

      const producer = await db.query.producers.findFirst({
        where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
        columns: { id: true, userId: true },
      });

      if (!producer) {
        throw new Error("Invalid producer");
      }

      const chat = await db.query.producerChats.findFirst({
        where: and(
          eq(producerChats.producerId, producer.id),
          eq(producerChats.producerUserId, userId),
          eq(producerChats.id, chatId)
        ),
      });

      if (!chat) {
        throw new Error("Invalid chat");
      }

      if (chat?.producerPreventedMoreMessagesAt !== null) {
        throw new Error("Producer has disabled this chat.");
      }

      if (chat?.initiatorPreventedMoreMessagesAt !== null) {
        throw new Error("User has disabled this chat.");
      }

      await db.insert(producerChatMessages).values({
        id: crypto.randomUUID(),
        chatId: chat.id,
        senderUserId: userId,
        content: message,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db
        .update(producerChats)
        .set({ updatedAt: new Date() })
        .where(eq(producerChats.id, chat.id));

      await USER_MESSAGE_NOTIFICATIONS_KV.incr(chat.initiatorUserId, chat.id);
    }
  );

export const blockUserChat = authenticatedActionClient
  .input(blockUserChatArgs)
  .name("blockUserChat")
  .action(async ({ ctx: { userId }, input: { producerId, chatId } }) => {
    const { success } = await messageRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceeded");
    }

    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
      columns: { id: true, userId: true },
    });

    if (!producer) {
      throw new Error("Invalid producer");
    }

    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.producerId, producer.id),
        eq(producerChats.producerUserId, userId),
        eq(producerChats.id, chatId),
        isNull(producerChats.producerPreventedMoreMessagesAt)
      ),
    });

    if (!chat) {
      throw new Error("Invalid chat");
    }

    await db
      .update(producerChats)
      .set({
        updatedAt: new Date(),
        producerPreventedMoreMessagesAt: new Date(),
      })
      .where(eq(producerChats.id, chat.id));
  });

export const unblockUserChat = authenticatedActionClient
  .name("unblockUserChat")
  .input(unblockUserChatArgs)
  .action(async ({ ctx: { userId }, input: { producerId, chatId } }) => {
    const { success } = await messageRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceeded");
    }

    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
      columns: { id: true, userId: true },
    });

    if (!producer) {
      throw new Error("Invalid producer");
    }

    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.producerId, producer.id),
        eq(producerChats.producerUserId, userId),
        isNotNull(producerChats.producerPreventedMoreMessagesAt),
        eq(producerChats.id, chatId)
      ),
    });

    if (!chat) {
      throw new Error("Invalid chat");
    }

    await db
      .update(producerChats)
      .set({ updatedAt: new Date(), producerPreventedMoreMessagesAt: null })
      .where(eq(producerChats.id, chat.id));
  });

export const blockProducerChat = authenticatedActionClient
  .name("blockProducerChat")
  .input(blockProducerChatArgs)
  .action(async ({ ctx: { userId }, input: { chatId } }) => {
    const { success } = await messageRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceeded");
    }

    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.initiatorUserId, userId),
        eq(producerChats.id, chatId),
        isNull(producerChats.initiatorPreventedMoreMessagesAt)
      ),
    });

    if (!chat) {
      throw new Error("Invalid chat");
    }

    await db
      .update(producerChats)
      .set({
        updatedAt: new Date(),
        initiatorPreventedMoreMessagesAt: new Date(),
      })
      .where(eq(producerChats.id, chat.id));
  });

export const unblockProducerChat = authenticatedActionClient
  .name("unblockProducerChat")
  .input(unblockProducerChatArgs)
  .action(async ({ ctx: { userId }, input: { chatId } }) => {
    const { success } = await messageRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceeded");
    }

    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.initiatorUserId, userId),
        eq(producerChats.id, chatId),
        isNotNull(producerChats.initiatorPreventedMoreMessagesAt)
      ),
    });

    if (!chat) {
      throw new Error("Invalid chat");
    }

    await db
      .update(producerChats)
      .set({
        updatedAt: new Date(),
        initiatorPreventedMoreMessagesAt: null,
      })
      .where(eq(producerChats.id, chat.id));
  });

export const getProducerChat = authenticatedActionClient
  .name("getProducerChat")
  .input(getProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { producerId } }) => {
    const chat = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(
        and(
          eq(producerChats.initiatorUserId, userId),
          eq(producerChats.producerId, producerId),
          notInArray(producerChats.id, producerIds)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!chat) {
      return null;
    }

    return chat;
  });

export const listUserChats = authenticatedActionClient
  .name("listUserChats")
  .action(async ({ userId }) => {
    const chats = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(eq(producerChats.initiatorUserId, userId));

    return chats;
  });

export const listProducerChats = authenticatedActionClient
  .name("listProducerChats")
  .input(listProducerChatsArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { producerId } }) => {
    if (!producerIds.includes(producerId)) {
      return [];
    }

    const chats = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(
        and(
          eq(producerChats.producerId, producerId),
          eq(producerChats.producerUserId, userId)
        )
      );

    const results = [];

    for (const chat of chats) {
      const userData = await USER_DATA_KV.get(chat.initiatorUserId);
      results.push({
        ...chat,
        initiatorUserName: userData?.first_name ?? "Unkown User",
        initiatorUserImgUrl: userData?.image_url ?? "",
      });
    }

    return results;
  });

export const listAllProducersChats = authenticatedActionClient
  .name("listAllProducersChats")
  .action(async ({ userId, producerIds }) => {
    const chats = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(
        and(
          inArray(producerChats.producerId, producerIds),
          ne(producerChats.initiatorUserId, userId),
          eq(producerChats.producerUserId, userId)
        )
      );

    const results = [];

    for (const chat of chats) {
      const userData = await USER_DATA_KV.get(chat.initiatorUserId);
      results.push({
        ...chat,
        initiatorUserName: userData?.first_name ?? "Unkown User",
        initiatorUserImgUrl: userData?.image_url ?? "",
      });
    }

    return results;
  });

export const getUserOrProducerChat = authenticatedActionClient
  .name("getUserOrProducerChat")
  .input(getUserOrProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { chatId } }) => {
    const chat = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(
        or(
          and(
            eq(producerChats.initiatorUserId, userId),
            eq(producerChats.id, chatId)
          ),
          and(
            eq(producerChats.producerUserId, userId),
            inArray(producerChats.producerId, producerIds),
            eq(producerChats.id, chatId)
          )
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!chat) {
      return chat;
    }

    if (chat.initiatorUserId === userId) {
      return chat;
    } else {
      const userData = await USER_DATA_KV.get(chat.initiatorUserId);
      return {
        ...chat,
        initiatorUserName: userData?.first_name ?? "Unkown User",
        initiatorUserImgUrl: userData?.image_url ?? "",
      };
    }
  });

export const getUserOrProducerChatMessages = authenticatedActionClient
  .name("getUserOrProducerChatMessages")
  .input(getUserOrProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { chatId } }) => {
    const chat = await db
      .select({
        ...getTableColumns(producerChats),
        producerName: producers.name,
        producerType: producers.type,
        producerThumbnailUrl: sql<string | null>`(
                SELECT COALESCE(
                  json_extract(${mediaAssets.variants}, '$.cover'),
                  ${mediaAssets.url}
                )
                FROM ${mediaAssets}
                WHERE ${mediaAssets.id} = (
                  SELECT ${producerMedia.assetId}
                  FROM ${producerMedia}
                  WHERE ${eq(producerMedia.producerId, producers.id)}
                  ORDER BY (${producerMedia.role} = 'cover') DESC, ${
                    producerMedia.position
                  } ASC
                  LIMIT 1
                )
              )`.as("producerThumbnailUrl"),
      })
      .from(producerChats)
      .leftJoin(producers, eq(producerChats.producerId, producers.id))
      .where(
        or(
          and(
            eq(producerChats.initiatorUserId, userId),
            eq(producerChats.id, chatId)
          ),
          and(
            eq(producerChats.producerUserId, userId),
            inArray(producerChats.producerId, producerIds),
            eq(producerChats.id, chatId)
          )
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!chat) {
      return [];
    }

    const result = await db.query.producerChatMessages.findMany({
      where: eq(producerChatMessages.chatId, chat.id),
    });

    await USER_MESSAGE_NOTIFICATIONS_KV.resetChat(userId, chatId);
    return result;
  });

export const getUserChatsMessageNotificationsCount = authenticatedActionClient
  .name("getUserChatMessageNotificationsCount")
  .action(async ({ userId }) => {
    return await USER_MESSAGE_NOTIFICATIONS_KV.getTotal(userId);
  });

export const getUserChatMessageNotificationsCount = authenticatedActionClient
  .name("getUserChatMessageNotificationsCount")
  .input(getUserChatMessageNotificationsCountArgs)
  .action(async ({ ctx: { userId }, input: { chatIds } }) => {
    const counts: { chatId: string; count: number }[] = [];

    for (const chatId of chatIds) {
      const count = Number(
        (await USER_MESSAGE_NOTIFICATIONS_KV.getForChat(userId, chatId)) ?? 0
      );
      counts.push({ chatId, count });
    }

    return counts;
  });

export const resetChatNotifications = authenticatedActionClient
  .input(resetChatNotificationsArgs)
  .action(async ({ ctx: { userId }, input: { chatId } }) => {
    await USER_MESSAGE_NOTIFICATIONS_KV.resetChat(userId, chatId);
  });

export type ProducerChat = NonNullable<
  Awaited<ReturnType<typeof getUserOrProducerChat>>
>;

export type ProducerChatMessage = NonNullable<
  Awaited<ReturnType<typeof getUserOrProducerChatMessages>>
>[number];

export type ChatNotificationsCount = NonNullable<
  Awaited<ReturnType<typeof getUserChatMessageNotificationsCount>>
>[number];
