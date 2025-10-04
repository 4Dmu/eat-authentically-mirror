import { relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  primaryKey,
  sqliteTable,
  text,
  unique,
  check,
  index,
} from "drizzle-orm/sqlite-core";
import {
  type SocialMedia,
  type Contact,
  type ImageData,
  type Address,
  PRODUCER_TYPES,
  ClaimProducerVerificationInternal,
} from "@/backend/validators/producers";
import { Stars } from "../validators/reviews";

export type Video = {
  url: string;
  _type: "cloudflare";
  uid: string;
  status: "ready" | "pending";
};

export type BusinessHours = {
  sun?: { open: string; close: string };
  mon?: { open: string; close: string };
  tue?: { open: string; close: string };
  wed?: { open: string; close: string };
  thu?: { open: string; close: string };
  fri?: { open: string; close: string };
  sat?: { open: string; close: string };
};

export type ScrapeMeta =
  | {
      _metaType: "grownby";
      numFavorites: string;
      onboardingSteps: OnboardingSteps;
      status: string;
    }
  | {
      _metaType: "eatwellguide";
      details: object[];
      categories: string[];
    }
  | {
      _metaType: "michelin";
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
      expiredAt: Date;
    };

export type GoogleMapsPlaceDetails = {
  name: string;
  id: string;
  googleMapsUri: string;
  businessStatus: string;
  types: string[];
  rating: number;
};

export type ServiceDetails = {
  takeout: boolean;
  delivery: boolean;
  dineIn: boolean;
  reservable: boolean;
};

export const pinboardViewModes = ["grid", "list", "map"] as const;

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
  hours: text({ mode: "json" }).$type<BusinessHours>(),
  googleMapsPlaceDetails: text({
    mode: "json",
  }).$type<GoogleMapsPlaceDetails>(),
  serviceDetails: text({ mode: "json" }).$type<ServiceDetails>(),
  subscriptionRank: integer().notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const producersRelations = relations(producers, ({ many }) => ({
  certificationsToProducers: many(certificationsToProducers),
  claimRequests: many(claimRequests),
  chats: many(producerChats),
  reviews: many(reviews),
}));

export const claimRequests = sqliteTable("claim_requests", {
  id: text().primaryKey(),
  userId: text().notNull(),
  producerId: text()
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" }),
  requestedVerification: text({ mode: "json" })
    .$type<ClaimProducerVerificationInternal>()
    .notNull(),
  status: text({ mode: "json" }).$type<ClaimRequestStatus>().notNull(),
  claimToken: text().notNull(),
  claimedAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  producer: one(producers, {
    fields: [claimRequests.producerId],
    references: [producers.id],
  }),
}));

export const producerChats = sqliteTable(
  "producer_chats",
  {
    id: text().primaryKey(),
    producerId: text()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    producerUserId: text().notNull(),
    initiatorUserId: text().notNull(),
    initiatorPreventedMoreMessagesAt: integer({ mode: "timestamp" }),
    producerPreventedMoreMessagesAt: integer({ mode: "timestamp" }),
    createdAt: integer({ mode: "timestamp" }).notNull(),
    updatedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (t) => [unique().on(t.initiatorUserId, t.producerId, t.producerUserId)]
);

export const producerChatsRelations = relations(
  producerChats,
  ({ many, one }) => ({
    messages: many(producerChatMessages),
    producer: one(producers, {
      fields: [producerChats.producerId],
      references: [producers.id],
    }),
  })
);

export const producerChatMessages = sqliteTable("producer_chat_messages", {
  id: text().primaryKey(),
  chatId: text()
    .notNull()
    .references(() => producerChats.id, { onDelete: "cascade" }),
  senderUserId: text().notNull(),
  content: text().notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const producerChatMessagesRelations = relations(
  producerChatMessages,
  ({ one }) => ({
    chat: one(producerChats, {
      fields: [producerChatMessages.chatId],
      references: [producerChats.id],
    }),
  })
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text().primaryKey(),
    producerId: text()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    reviewerUserId: text().notNull(),
    content: text().notNull(),
    rating: real().$type<Stars>().notNull(),
    createdAt: integer({ mode: "timestamp" }).notNull(),
    updatedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    check("rating_check", sql`${table.rating} >= 0 AND rating <= 5.0`),
  ]
);

export const importedReviews = sqliteTable(
  "importedReviews",
  {
    id: text().primaryKey(),
    producerId: text()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    rating: real().$type<Stars>().notNull(),
    data: text({ mode: "json" })
      .$type<{
        type: "google-maps";
        googleMapsReviewName: string;
        text: { text: string; languageCode: string };
        originalText: { text: string; languageCode: string };
        authorAttribution: {
          displayName: string;
          uri: string;
          photoUri: string;
        };
        publishTime: string;
        googleMapsUri: string;
      }>()
      .notNull(),
    createdAt: integer({ mode: "timestamp" }).notNull(),
    updatedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    check("rating_check", sql`${table.rating} >= 0 AND rating <= 5.0`),
  ]
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  producer: one(producers, {
    fields: [reviews.producerId],
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
      .references(() => certifications.id, { onDelete: "cascade" }),
    listingId: text()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
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

export const pinboards = sqliteTable("pinboards", {
  id: text().primaryKey(),
  userId: text().notNull().unique(),
  viewMode: text({ enum: pinboardViewModes }).notNull().default("grid"),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const pinboardsRelations = relations(pinboards, ({ many }) => ({
  pins: many(pins),
  pinLists: many(pinLists),
}));

export const pins = sqliteTable(
  "pins",
  {
    id: text().primaryKey(),
    pinboardId: text()
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    producerId: text()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    createdAt: integer({ mode: "timestamp" }).notNull(),
  },
  (t) => [
    unique().on(t.pinboardId, t.producerId),
    index("idxPinPinboard").on(t.pinboardId),
    index("idxPinProducer").on(t.producerId),
  ]
);

export const pinsRelations = relations(pins, ({ one }) => ({
  pinboard: one(pinboards, {
    fields: [pins.pinboardId],
    references: [pinboards.id],
  }),
  producer: one(producers, {
    fields: [pins.producerId],
    references: [producers.id],
  }),
}));

export const pinLists = sqliteTable(
  "pinLists",
  {
    id: text().primaryKey(),
    pinboardId: text()
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    createdAt: integer({ mode: "timestamp" }).notNull(),
    updatedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (t) => [
    unique().on(t.pinboardId, t.name),
    index("idxPinlistPinboard").on(t.pinboardId),
  ]
);

export const pinListsRelations = relations(pinLists, ({ one, many }) => ({
  pinboard: one(pinboards, {
    fields: [pinLists.pinboardId],
    references: [pinboards.id],
  }),
  items: many(pinListItems),
}));

export const pinListItems = sqliteTable(
  "pinListItems",
  {
    pinListId: text()
      .notNull()
      .references(() => pinLists.id, { onDelete: "cascade" }),
    pinId: text()
      .notNull()
      .references(() => pins.id, { onDelete: "cascade" }),
    createdAt: integer({ mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.pinListId, t.pinId] })]
);

export const pinListItemsRelations = relations(pinListItems, ({ one }) => ({
  pinList: one(pinLists, {
    fields: [pinListItems.pinListId],
    references: [pinLists.id],
  }),
  pin: one(pins, {
    fields: [pinListItems.pinId],
    references: [pins.id],
  }),
}));

export const preLaunchProducerWaitlist = sqliteTable(
  "preLaunchProducerWaitlist",
  {
    producerId: text()
      .notNull()
      .unique()
      .references(() => producers.id, { onDelete: "cascade" }),
    userId: text(),
    email: text().notNull(),
    createdAt: integer({ mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.producerId, t.userId] })]
);

export type ProducerInsert = typeof producers.$inferInsert;

export type Certification = typeof certifications.$inferSelect;
export type ProducerSelect = typeof producers.$inferSelect;
export type ClaimRequest = typeof claimRequests.$inferSelect & {
  producer: { name: string; id: string };
};

export type ReviewSelect = typeof reviews.$inferSelect;
export type Pin = typeof pins.$inferSelect;
export type Pinboard = typeof pinboards.$inferSelect;
export type Pinlist = typeof pinLists.$inferSelect;
export type PinlistItem = typeof pinListItems.$inferSelect;
export type ImportedReviewInsert = typeof importedReviews.$inferInsert;
