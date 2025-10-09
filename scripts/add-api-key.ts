import { db } from "@/backend/db";
import { externalApiKeys } from "@/backend/db/schema";
import { generateToken } from "@/backend/utils/generate-tokens";

async function main() {
  const token = generateToken();

  await db.insert(externalApiKeys).values({
    apiKey: token,
    createdAt: new Date(),
    rolledAt: new Date(),
  });

  console.log(token);
}

main();
