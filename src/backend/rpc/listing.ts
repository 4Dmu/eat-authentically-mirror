"use server";
import * as listing from "@/backend/data/listing";
import {
  GetListingArgsValidator,
  ListListingsArgsValidator,
} from "../validators/listings";
import { actionClient } from "./helpers/safe-action";

export const listListingsPublic = actionClient
  .inputSchema(ListListingsArgsValidator)
  .action(
    async ({ parsedInput }) => await listing.listListingsPublic(parsedInput)
  );

export const listListingsPublicLight = actionClient
  .inputSchema(ListListingsArgsValidator)
  .action(
    async ({ parsedInput }) =>
      await listing.listListingsPublicLight(parsedInput)
  );

export const listCertificationTypesPublic = actionClient.action(
  async () => await listing.listCertificationTypesPublic()
);

export const getListingPublic = actionClient
  .inputSchema(GetListingArgsValidator)
  .action(
    async ({ parsedInput }) => await listing.getListingPublic(parsedInput)
  );
