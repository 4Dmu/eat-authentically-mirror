import { db } from "@ea/db";
import { externalApiKeys } from "@ea/db/schema";
import { asc } from "drizzle-orm";
import { ClientPage } from "./page-client";

export default async function Page() {
  const apiKeys = await db.query.externalApiKeys.findMany({
    orderBy: asc(externalApiKeys.createdAt),
  });
  return <ClientPage keys={apiKeys} />;
}
