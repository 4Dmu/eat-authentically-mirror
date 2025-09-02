"use server";
import {
  authenticatedActionClient,
  producerActionClient,
} from "./helpers/middleware";
import { db } from "../db";
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  notInArray,
  or,
} from "drizzle-orm";
import { producerChatMessages, producerChats, producers } from "../db/schema";
import { messageRatelimit } from "../lib/rate-limit";
import { getSubTier } from "./utils/get-sub-tier";
import {
  blockProducerChatArgs,
  blockUserChatArgs,
  getProducerChatArgs,
  getUserOrProducerChatArgs,
  listProducerChatsArgs,
  replyToUserMessageArgs,
  sendMessageToProducerArgs,
  unblockProducerChatArgs,
  unblockUserChatArgs,
} from "../validators/messages";
import { USER_DATA_KV } from "../kv";

export const sendMessageToProducer = authenticatedActionClient
  .input(sendMessageToProducerArgs)
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
        eq(producers.claimed, true),
        ne(producers.userId, userId),
      ),
      columns: { id: true, userId: true },
    });

    if (!producer || !producer.userId) {
      throw new Error("Invalid producer id");
    }

    let chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.producerId, producerId),
        eq(producerChats.initiatorUserId, userId),
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

    return chat.id;
  });

export const replyToUserMessage = authenticatedActionClient
  .input(replyToUserMessageArgs)
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
          eq(producerChats.id, chatId),
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
    },
  );

export const blockUserChat = authenticatedActionClient
  .input(blockUserChatArgs)
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

    console.log(producer.id, userId, chatId);

    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.producerId, producer.id),
        eq(producerChats.producerUserId, userId),
        eq(producerChats.id, chatId),
        isNull(producerChats.producerPreventedMoreMessagesAt),
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
        eq(producerChats.id, chatId),
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
        isNull(producerChats.initiatorPreventedMoreMessagesAt),
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
        isNotNull(producerChats.initiatorPreventedMoreMessagesAt),
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
  .input(getProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { producerId } }) => {
    const chat = await db.query.producerChats.findFirst({
      where: and(
        eq(producerChats.initiatorUserId, userId),
        eq(producerChats.producerId, producerId),
        notInArray(producerChats.id, producerIds),
      ),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });

    if (!chat) {
      return null;
    }

    return chat;
  });

export const listUserChats = authenticatedActionClient.action(
  async ({ userId }) => {
    return await db.query.producerChats.findMany({
      where: eq(producerChats.initiatorUserId, userId),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });
  },
);

export const listProducerChats = authenticatedActionClient
  .input(listProducerChatsArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { producerId } }) => {
    if (!producerId.includes(producerId)) {
      return;
    }

    const chats = await db.query.producerChats.findMany({
      where: eq(producerChats.producerId, producerId),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });

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

export const listAllProducersChats = authenticatedActionClient.action(
  async ({ userId, producerIds }) => {
    const chats = await db.query.producerChats.findMany({
      where: and(
        inArray(producerChats.producerId, producerIds),
        ne(producerChats.initiatorUserId, userId),
      ),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });

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
  },
);

export const getUserOrProducerChat = authenticatedActionClient
  .input(getUserOrProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { chatId } }) => {
    const chat = await db.query.producerChats.findFirst({
      where: or(
        and(
          eq(producerChats.initiatorUserId, userId),
          eq(producerChats.id, chatId),
        ),
        and(
          eq(producerChats.producerUserId, userId),
          inArray(producerChats.producerId, producerIds),
          eq(producerChats.id, chatId),
        ),
      ),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });

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
  .input(getUserOrProducerChatArgs)
  .action(async ({ ctx: { userId, producerIds }, input: { chatId } }) => {
    const chat = await db.query.producerChats.findFirst({
      where: or(
        and(
          eq(producerChats.initiatorUserId, userId),
          eq(producerChats.id, chatId),
        ),
        and(
          eq(producerChats.producerUserId, userId),
          inArray(producerChats.producerId, producerIds),
          eq(producerChats.id, chatId),
        ),
      ),
      with: {
        producer: {
          columns: {
            name: true,
            images: true,
          },
        },
      },
    });

    if (!chat) {
      return [];
    }

    return await db.query.producerChatMessages.findMany({
      where: eq(producerChatMessages.chatId, chat.id),
    });
  });

export type ProducerChat = NonNullable<
  Awaited<ReturnType<typeof getUserOrProducerChat>>
>;

export type ProducerChatMessage = NonNullable<
  Awaited<ReturnType<typeof getUserOrProducerChatMessages>>
>[number];
