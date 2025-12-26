import { db } from "@ea/db";
import { producerOutreachEmailState } from "@ea/db/schema";
import { asc } from "drizzle-orm";
import { ClientPage } from "./page-client";
import { list } from "@/rpc/outreach-email-state";
import { LIMIT } from "./_shared";

export default async function Page() {
  const emailStates = await list({ limit: LIMIT, offset: 0 });
  console.log("ok");
  return <ClientPage emailStates={emailStates} />;
}
