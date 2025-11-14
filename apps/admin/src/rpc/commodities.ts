"use server";
import { db } from "@ea/db";
import { authenticatedActionClient } from "./helpers/middleware";

const rpc = {
  list: authenticatedActionClient.name("commodities.list").action(async () => {
    return await db.query.commodities.findMany();
  }),
};

export { rpc as commodities };
