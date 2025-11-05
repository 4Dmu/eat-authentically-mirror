import { db } from "@ea/db";
import { externalApiKeys } from "@ea/db/schema";
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
