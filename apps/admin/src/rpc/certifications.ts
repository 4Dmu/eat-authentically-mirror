"use server";
import { db } from "@ea/db";
import { authenticatedActionClient } from "./helpers/middleware";

export const list = authenticatedActionClient
  .name("certifications.list")
  .action(async () => {
    return await db.query.certifications.findMany();
  });
