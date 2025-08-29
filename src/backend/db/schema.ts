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
  PRODUCER_CLAIM_METHODS,
  ClaimProducerVerification,
} from "@/backend/validators/producers";
import { te } from "date-fns/locale";

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

export type ClaimRequestStatus =
  | {
      type: "waiting";
    }
  | {
      type: "claimed";
    }
  | {
      type: "expired";
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

export const claimRequests = sqliteTable("claim_requests", {
  id: text().primaryKey(),
  userId: text().notNull(),
  producerId: text()
    .notNull()
    .references(() => producers.id),
  requestedVerification: text({ mode: "json" })
    .$type<ClaimProducerVerification>()
    .notNull(),
  status: text({ mode: "json" }).$type<ClaimRequestStatus>().notNull(),
  claimToken: text().notNull(),
  claimedAt: integer({ mode: "timestamp" }),
  expiredAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const producersRelations = relations(producers, ({ many }) => ({
  certificationsToProducers: many(certificationsToProducers),
  claimRequests: many(claimRequests),
}));

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  producer: one(producers, {
    fields: [claimRequests.producerId],
    references: [producers.id],
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
    certificationsToProducers: many(certificationsToProducers),
  })
);

export const certificationsToProducers = sqliteTable(
  "certifications_to_producers",
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

export const certificationsToProducersRelations = relations(
  certificationsToProducers,
  ({ one }) => ({
    certification: one(certifications, {
      fields: [certificationsToProducers.certificationId],
      references: [certifications.id],
    }),
    listing: one(producers, {
      fields: [certificationsToProducers.listingId],
      references: [producers.id],
    }),
  })
);

export type Certification = typeof certifications.$inferSelect;
