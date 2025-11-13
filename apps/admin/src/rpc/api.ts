"use server";

import { auth } from "@/lib/auth";
import { db } from "@ea/db";
import { externalApiKeys } from "@ea/db/schema";
import { headers } from "next/headers";
import { generateToken } from "@ea/shared/generate-tokens";
import { asc } from "drizzle-orm";

export async function listExternalApiKeys() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unathorized");
  }

  return await db.query.externalApiKeys.findMany({
    orderBy: asc(externalApiKeys.createdAt),
  });
}

export async function createExternalApiKey() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unathorized");
  }

  const token = generateToken();

  await db.insert(externalApiKeys).values({
    apiKey: token,
    createdAt: new Date(),
    rolledAt: new Date(),
  });
}
