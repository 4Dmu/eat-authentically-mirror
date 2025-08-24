import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  type SocialMedia,
  type Contact,
  type ImageData,
  type Address,
  LISTING_TYPES,
} from "@/backend/validators/listings";

export type Video = { url: string };

export type BusinessHours = {
  open: string;
  close: string;
};

export type Organization = typeof organizations.$inferSelect;

type ImageUploadAttempt = {
  cloudflareImageId: string;
  createdAt: Date;
};

type ImageUpload = {
  cloudflareImageId: string;
  url: string;
  createdAt: Date;
};

export type ScrapeMeta = {
  _metaType: "grownby";
  numFavorites: string;
  onboardingSteps: OnboardingSteps;
  status: string;
};

export type OnboardingSteps = {
  claim: null;
  distributions: null;
  farm_profile: null;
  payments: null;
  products: null;
  share_farm: null;
};

type Commodity = {
  name: string;
  varieties: string[];
};

export const listings = sqliteTable("listings", {
  id: text().primaryKey(),
  organizationId: text().references(() => organizations.id),
  name: text().notNull(),
  type: text({ enum: LISTING_TYPES }).notNull(),
  claimed: integer({ mode: "boolean" }).notNull(),
  verified: integer({ mode: "boolean" }).notNull(),

  about: text(),
  images: text({ mode: "json" }).$type<ImageData[]>().notNull(),
  pendingImages: text({ mode: "json" }).$type<
    { id: string; isPrimary: boolean }[]
  >(),
  commodities: text({ mode: "json" }).$type<Commodity[]>().notNull(),
  socialMedia: text({ mode: "json" }).$type<SocialMedia>().notNull(),
  contact: text({ mode: "json" }).$type<Contact>(),
  address: text({ mode: "json" }).$type<Address>(),
  video: text({ mode: "json" }).$type<Video>(),
  scrapeMeta: text({ mode: "json" }).$type<ScrapeMeta>(),

  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const listingsRelations = relations(listings, ({ many, one }) => ({
  products: many(products),
  certificationsToListings: many(certificationsToListings),
  oranization: one(organizations, {
    fields: [listings.organizationId],
    references: [organizations.id],
  }),
}));

export const certifications = sqliteTable("certifications", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  isVerified: integer({ mode: "boolean" }).notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const certificationsRelations = relations(
  certifications,
  ({ many }) => ({
    certificationsToListings: many(certificationsToListings),
  })
);

export const organizations = sqliteTable("organizations", {
  id: text().primaryKey(),
  ownerUserId: text().notNull(),
  name: text().notNull(),
  imageUrl: text().notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const uploadHistory = sqliteTable("upload_history", {
  organizationId: text()
    .primaryKey()
    .references(() => organizations.id),
  imageUploadAttempts: text({ mode: "json" })
    .$type<ImageUploadAttempt[]>()
    .notNull(),
  imageUploads: text({ mode: "json" }).$type<ImageUpload[]>().notNull(),
});

export const certificationsToListings = sqliteTable(
  "certifications_to_listings",
  {
    certificationId: text()
      .notNull()
      .references(() => certifications.id),
    listingId: text()
      .notNull()
      .references(() => listings.id),
  },
  (t) => [primaryKey({ columns: [t.certificationId, t.listingId] })]
);

export const certificationsToListingsRelations = relations(
  certificationsToListings,
  ({ one }) => ({
    certification: one(certifications, {
      fields: [certificationsToListings.certificationId],
      references: [certifications.id],
    }),
    listing: one(listings, {
      fields: [certificationsToListings.listingId],
      references: [listings.id],
    }),
  })
);

export const products = sqliteTable("products", {
  id: text().primaryKey(),
  companyProfileId: text()
    .notNull()
    .references(() => listings.id),
  name: text().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  bussinessProfile: one(listings, {
    fields: [products.companyProfileId],
    references: [listings.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ one }) => ({
  uploadHistory: one(uploadHistory),
}));

export const uploadHistoryRelations = relations(uploadHistory, ({ one }) => ({
  organization: one(organizations, {
    fields: [uploadHistory.organizationId],
    references: [organizations.id],
  }),
}));

export type Certification = typeof certifications.$inferSelect;
