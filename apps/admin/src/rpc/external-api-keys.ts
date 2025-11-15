"use server";

import { db } from "@ea/db";
import { externalApiKeys } from "@ea/db/schema";
import { generateToken } from "@ea/shared/generate-tokens";
import { asc } from "drizzle-orm";
import { authenticatedActionClient } from "./helpers/middleware";

export const list = authenticatedActionClient
  .name("externalApiKeys.list")
  .action(
    async () =>
      await db.query.externalApiKeys.findMany({
        orderBy: asc(externalApiKeys.createdAt),
      }),
  );

export const create = authenticatedActionClient
  .name("externalApiKeys.create")
  .action(async () => {
    const token = generateToken();

    await db.insert(externalApiKeys).values({
      apiKey: token,
      createdAt: new Date(),
      rolledAt: new Date(),
    });
  });
