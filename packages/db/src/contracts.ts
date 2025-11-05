import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import {
  certifications,
  commodities,
  mediaAssets,
  producerCertifications,
  producerCommodities,
  producerContact,
  producerLocation,
  producerMedia,
  producers,
  producerSocial,
} from "./schema";

export const producerSelectValidator = createSelectSchema(producers);

export const producerInsertValidator = createInsertSchema(producers);

export const producerLocationSelectValidator =
  createSelectSchema(producerLocation);

export const producerLocationInsertValidator =
  createInsertSchema(producerLocation);

export const producerContactSelectValidator =
  createSelectSchema(producerContact);

export const producerSocialSelectValidator = createSelectSchema(producerSocial);

export const producerMediaSelectValidator = createSelectSchema(producerMedia);

export const mediaAssetSelectValidator = createSelectSchema(mediaAssets);

export const commoditySelectValidator = createSelectSchema(commodities);

export const producerCommoditiesSelectValidator =
  createSelectSchema(producerCommodities);

export const producerCertificationsSelectValidator = createSelectSchema(
  producerCertifications
);

export const certificationSelectValidator = createSelectSchema(certifications);
