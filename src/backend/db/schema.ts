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
  PRODUCER_TYPES,
} from "@/backend/validators/listings";

export type Video = {
  url: string;
  _type: "cloudflare";
  uid: string;
  status: "ready" | "pending";
};

export type BusinessHours = {
  open: string;
  close: string;
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

export const producers = sqliteTable("producers", {
  id: text().primaryKey(),
  userId: text(),
  name: text().notNull(),
  type: text({ enum: PRODUCER_TYPES }).notNull(),
  claimed: integer({ mode: "boolean" }).notNull(),
  verified: integer({ mode: "boolean" }).notNull(),
  about: text(),
  images: text({ mode: "json" })
    .$type<{ primaryImgId: string | null; items: ImageData[] }>()
    .notNull(),
  pendingImages: text({ mode: "json" }).$type<
    { id: string; isPrimary: boolean }[]
  >(),
  commodities: text({ mode: "json" }).$type<Commodity[]>().notNull(),
  pendingVideos: text({ mode: "json" }).$type<string[]>(),
  socialMedia: text({ mode: "json" }).$type<SocialMedia>().notNull(),
  contact: text({ mode: "json" }).$type<Contact>(),
  address: text({ mode: "json" }).$type<Address>(),
  video: text({ mode: "json" }).$type<Video>(),
  scrapeMeta: text({ mode: "json" }).$type<ScrapeMeta>(),

  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const listingsRelations = relations(producers, ({ many }) => ({
  certificationsToListings: many(certificationsToListings),
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

export const certificationsToListings = sqliteTable(
  "certifications_to_listings",
  {
    certificationId: text()
      .notNull()
      .references(() => certifications.id),
    listingId: text()
      .notNull()
      .references(() => producers.id),
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
    listing: one(producers, {
      fields: [certificationsToListings.listingId],
      references: [producers.id],
    }),
  })
);

export type Certification = typeof certifications.$inferSelect;
