import { relations, sql, eq } from "drizzle-orm";
import {
  integer,
  real,
  primaryKey,
  sqliteTable,
  text,
  unique,
  check,
  index,
  sqliteView,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { PRODUCER_TYPES } from "../constants";

type ClaimProducerVerificationInternal =
  | {
      method: "contact-email-link";
      producerContactEmail: string;
    }
  | {
      method: "contact-phone-link";
      producerContactPhone: string;
      tokenExpiresAt: Date;
    }
  | {
      method: "domain-dns";
      domain: string;
    }
  | {
      method: "manual";
      claimerEmail: string;
    }
  | {
      method: "domain-email-link";
      domainDomainEmailPart: string;
      domain: string;
    }
  | {
      method: "social-post";
      socialHandle: string;
    };

type Address = {
  street?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  zip?: string | undefined;
  coordinate?:
    | {
        latitude: number;
        longitude: number;
      }
    | undefined;
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

export type ClaimInvitationStatus = ClaimRequestStatus;

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

export const PINBOARD_VIEW_MODES = ["grid", "list", "map"] as const;

export const suggestedProducers = sqliteTable("suggested_producers", {
  id: text().primaryKey(),
  suggesterUserId: text("suggester_user_id").notNull(),
  name: text().notNull(),
  type: text({ enum: PRODUCER_TYPES }).notNull(),
  address: text({ mode: "json" }).$type<Address>(),
  email: text(),
  phone: text(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const claimRequests = sqliteTable("claim_requests", {
  id: text().primaryKey(),
  userId: text("user_id").notNull(),
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" }),
  requestedVerification: text("requested_verification", { mode: "json" })
    .$type<ClaimProducerVerificationInternal>()
    .notNull(),
  status: text({ mode: "json" }).$type<ClaimRequestStatus>().notNull(),
  claimToken: text("claim_token").notNull(),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const claimInvitations = sqliteTable("claim_invitations", {
  id: text().primaryKey(),
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" }),
  status: text({ mode: "json" }).$type<ClaimInvitationStatus>().notNull(),
  claimToken: text("claim_token").notNull(),
  claimerEmail: text("claimer_email").notNull(),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  producer: one(producers, {
    fields: [claimRequests.producerId],
    references: [producers.id],
  }),
}));

export const preLaunchProducerWaitlist = sqliteTable(
  "pre_launch_producer_waitlist",
  {
    producerId: text("producer_id")
      .notNull()
      .unique()
      .references(() => producers.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    email: text().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.producerId, t.userId] })]
);

export const externalApiKeys = sqliteTable("external_api_keys", {
  id: integer().primaryKey({ autoIncrement: true }),
  apiKey: text("api_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  rolledAt: integer("rolled_at", { mode: "timestamp" }).notNull(),
});

export const outreachData = sqliteTable("outreach_data", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  status: text({ enum: ["queued", "sent", "failed"] }).notNull(),
  providerMessageId: text("provider_message_id").notNull(),
  note: text(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const outreachEvent = sqliteTable("outreach_event", {
  id: integer().primaryKey({ autoIncrement: true }),
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" }),
  type: text({
    enum: [
      "delivered",
      "opened",
      "clicked",
      "bounced",
      "complained",
      "unsubscribed",
    ],
  }).notNull(),
  recipient: text().notNull(),
  providerMessageId: text("provider_message_id"),
  timestamp: integer({ mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  meta: text({ mode: "json" }).$type<object>(),
});

/*
 *
 *
 *
 * New DB Schema
 *
 *
 */

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(), // ulid/uuid
    uploadedByType: text("uploaded_by_type", {
      enum: ["user", "system", "admin"],
    }).notNull(),
    uploadedById: text("uploaded_by_id"),
    origin: text("origin", {
      enum: ["user_upload", "system_seed", "admin_upload", "web_scrape"],
    })
      .notNull()
      .default("user_upload"),

    // storage
    storage: text("storage", {
      enum: ["s3", "r2", "gcs", "local", "url", "cloudflare"],
    }).notNull(),
    bucket: text("bucket"),
    key: text("key"), // object key/path
    url: text("url").notNull(), // Required absolute url, valid for all storage modes
    cloudflareId: text("cloudflareId"),

    // identity & validation
    contentType: text("content_type"), // image/jpeg, image/webp, video/mp4, ...
    byteSize: integer("byte_size"),
    sha256: text("sha256"), // for dedupe + integrity

    // images/video hints
    width: integer("width"),
    height: integer("height"),
    durationSec: real("duration_sec"),
    videoStatus: text({ enum: ["ready", "pending"] }),

    // UX metadata
    alt: text("alt"), // default alt/caption
    focalX: real("focal_x"), // 0..1 optional crop focus
    focalY: real("focal_y"),

    // derived variants (JSON: {thumb: "...", webp: "...", avif: "...", ...})
    variants: text("variants", { mode: "json" }).$type<object>(), // JSON string
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("idx_media_by_actor").on(t.uploadedByType, t.uploadedById),
    index("idx_media_by_origin").on(t.origin),
    index("idx_media_type").on(t.contentType),
    uniqueIndex("uq_media_sha256").on(t.sha256),
  ]
);

export const mediaAssetsRelations = relations(mediaAssets, ({ many }) => ({
  producerMedia: many(producerMedia),
  pinboardMedia: many(pinboardMedia),
}));

export const pendingMediaAssets = sqliteTable("pending_media_assets", {
  id: text("id").primaryKey(), // ulid/uuid
  ownerUserId: text("owner_user_id").notNull(), // who uploaded
  mode: text({ enum: ["cloudflare-image", "cloudflare-stream"] }).notNull(),
  pendingAssetKey: text("pending_asset_key").notNull(),
  pendingAssetMeta: text("pending_asset_meta"),
  position: integer("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const producerMedia = sqliteTable(
  "producer_media",
  {
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["cover", "gallery", "logo", "menu", "document", "video"],
    })
      .notNull()
      .default("gallery"),
    position: integer("position").notNull().default(65536), // manual ordering
    caption: text("caption"),
    addedByUserId: text("added_by_user_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.producerId, t.assetId] }),
    index("idx_prodmedia_producer").on(t.producerId, t.role, t.position),
    index("idx_prodmedia_asset").on(t.assetId),
  ]
);

export const producerMediaRelations = relations(producerMedia, ({ one }) => ({
  producer: one(producers, {
    fields: [producerMedia.producerId],
    references: [producers.id],
  }),
  asset: one(mediaAssets, {
    fields: [producerMedia.assetId],
    references: [mediaAssets.id],
  }),
}));

export const pinboardMedia = sqliteTable(
  "pinboard_media",
  {
    pinboardId: text("pinboard_id")
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["cover", "gallery"] })
      .notNull()
      .default("gallery"),
    position: integer("position").notNull().default(65536),
    caption: text("caption"),
    addedByUserId: text("added_by_user_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pinboardId, t.assetId] }),
    index("idx_pbmedia_board").on(t.pinboardId, t.role, t.position),
    index("idx_pbmedia_asset").on(t.assetId),
  ]
);

export const pinboardMediaRelations = relations(pinboardMedia, ({ one }) => ({
  pinboard: one(pinboards, {
    fields: [pinboardMedia.pinboardId],
    references: [pinboards.id],
  }),
  asset: one(mediaAssets, {
    fields: [pinboardMedia.assetId],
    references: [mediaAssets.id],
  }),
}));

export const producers = sqliteTable(
  "producers",
  {
    id: text().primaryKey(),
    userId: text("user_id"),
    name: text().notNull(),
    type: text({ enum: PRODUCER_TYPES }).notNull(),
    verified: integer({ mode: "boolean" }).notNull(),
    summary: text(),
    about: text(),
    subscriptionRank: integer("subscription_rank").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("idx_prod_type").on(t.type),
    index("idx_prod_verified").on(t.verified),
    index("idx_prod_subrank").on(t.subscriptionRank),
  ]
);

export const producersRelations = relations(producers, ({ many, one }) => ({
  media: many(producerMedia),
  location: one(producerLocation),
  commodities: many(producerCommodities),
  certifications: many(producerCertifications),
  chats: many(producerChats),
  labels: many(producerLabelMap),
  hours: many(producerHours),
  contact: one(producerContact),
  social: one(producerSocial),
  quality: one(producerQuality),
  campaigns: many(sponsoredCampaigns),
  search: one(producersSearch),
  reviews: many(producerReviews),
  importedReviews: many(producerImportedReviews),
  ratingAgg: one(producerRatingAgg),
  pins: many(pins),
  scrapeMeta: one(producersScrapeMeta),
  googleMapsPlaceDetails: one(producersGoogleMapsPlaceDetails),
}));

export const producerLocation = sqliteTable(
  "producer_location",
  {
    geoId: integer("geo_id").primaryKey({ autoIncrement: true }),
    producerId: text("producer_id")
      .unique()
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    latitude: real("latitude"),
    longitude: real("longitude"),
    locality: text("locality"),
    city: text("city"),
    postcode: text("postcode"),
    adminArea: text("admin_area"),
    country: text("country"),
    geohash: text("geohash"),
  },
  (t) => [
    index("idx_loc_locality").on(t.locality),
    index("idx_loc_city").on(t.city),
    index("idx_loc_country").on(t.country),
    index("idx_loc_admin_area").on(t.adminArea),
    index("idx_loc_postcode").on(t.postcode),
  ]
);

export const producerLocationRelations = relations(
  producerLocation,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerLocation.producerId],
      references: [producers.id],
    }),
  })
);

export const commodities = sqliteTable("commodities", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().unique().notNull(),
  name: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const commoditiesRelations = relations(commodities, ({ many }) => ({
  variants: many(commodityVariants),
  aliases: many(commodityAliases),
  producers: many(producerCommodities),
}));

export const commodityVariants = sqliteTable(
  "commodity_variants",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    commodityId: integer("commodity_id")
      .notNull()
      .references(() => commodities.id, { onDelete: "cascade" }),
    slug: text().notNull(),
    name: text().notNull(),
  },
  (t) => [unique().on(t.commodityId, t.slug)]
);

export const commodityVariantsRelations = relations(
  commodityVariants,
  ({ one, many }) => ({
    commodity: one(commodities, {
      fields: [commodityVariants.commodityId],
      references: [commodities.id],
    }),
    aliases: many(commodityAliases),
  })
);

export const commodityAliases = sqliteTable(
  "commodity_aliases",
  {
    alias: text().primaryKey(),
    targetCommodityId: integer("target_commodity_id")
      .notNull()
      .references(() => commodities.id, { onDelete: "cascade" }),
    targetVariantId: integer("target_variant_id")
      .notNull()
      .references(() => commodityVariants.id, { onDelete: "cascade" }),
  },
  (t) => [index("idx_alias_target").on(t.targetCommodityId, t.targetVariantId)]
);

export const commodityAliasesRelations = relations(
  commodityAliases,
  ({ one }) => ({
    commodity: one(commodities, {
      fields: [commodityAliases.targetCommodityId],
      references: [commodities.id],
    }),
    variant: one(commodityVariants, {
      fields: [commodityAliases.targetVariantId],
      references: [commodityVariants.id],
    }),
  })
);

export const producerCommodities = sqliteTable(
  "producer_commodities",
  {
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    commodityId: integer("commodity_id")
      .notNull()
      .references(() => commodities.id, { onDelete: "cascade" }),
    variantId: integer("variant_id").references(() => commodityVariants.id, {
      onDelete: "set null",
    }),
    organic: integer({ mode: "boolean" }).notNull().default(false),
    certifications: text({ mode: "json" }).$type<string[]>(),
    seasonMonths: text("season_months"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.producerId, t.commodityId, t.variantId] }),
    index("idx_pc_by_commodity").on(t.commodityId),
    index("idx_pc_by_variant").on(t.variantId),
    index("idx_pc_by_organic").on(t.organic),
  ]
);

export const producerCommoditiesRelations = relations(
  producerCommodities,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerCommodities.producerId],
      references: [producers.id],
    }),
    commodity: one(commodities, {
      fields: [producerCommodities.commodityId],
      references: [commodities.id],
    }),
  })
);

export const certifications = sqliteTable(
  "certifications",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(), // normalized from name
    name: text("name").notNull(),
    isVerified: integer("is_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    uniqueIndex("uq_cert_slug").on(t.slug),
    index("idx_cert_verified").on(t.isVerified),
  ]
);

export const certificationsRelations = relations(
  certifications,
  ({ many }) => ({
    producers: many(producerCertifications),
  })
);

export const producerCertifications = sqliteTable(
  "producer_certifications",
  {
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id), // FK -> producers.id
    certificationId: text("certification_id")
      .notNull()
      .references(() => certifications.id), // FK -> certifications.id
    addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.producerId, t.certificationId] })]
);

export const producerCertificationsRelations = relations(
  producerCertifications,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerCertifications.producerId],
      references: [producers.id],
    }),
    certification: one(certifications, {
      fields: [producerCertifications.certificationId],
      references: [certifications.id],
    }),
  })
);

export const producerChats = sqliteTable(
  "producer_chats",
  {
    id: text().primaryKey(),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    producerUserId: text("producer_user_id").notNull(),
    initiatorUserId: text("initiator_user_id").notNull(),
    initiatorPreventedMoreMessagesAt: integer(
      "initiator_prevented_more_messages_at",
      { mode: "timestamp" }
    ),
    producerPreventedMoreMessagesAt: integer(
      "producer_prevented_more_messages_at",
      { mode: "timestamp" }
    ),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
  chatId: text("chat_id")
    .notNull()
    .references(() => producerChats.id, { onDelete: "cascade" }),
  senderUserId: text("sender_user_id").notNull(),
  content: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const labelsRelations = relations(labels, ({ many }) => ({
  producers: many(producerLabelMap),
}));

export const producerLabelMap = sqliteTable(
  "producer_label_map",
  {
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    labelId: integer("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.producerId, t.labelId] }),
    index("idx_plm_label").on(t.labelId),
    index("idx_plm_prod").on(t.producerId),
  ]
);

export const producerLabelMapRelations = relations(
  producerLabelMap,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerLabelMap.producerId],
      references: [producers.id],
    }),
    label: one(labels, {
      fields: [producerLabelMap.labelId],
      references: [labels.id],
    }),
  })
);

export const producerHours = sqliteTable(
  "producer_hours",
  {
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    openMin: integer("open_min").notNull(),
    closeMin: integer("close_min").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.producerId, t.weekday, t.openMin, t.closeMin],
    }),
    index("idx_hours_prod").on(t.producerId),
  ]
);

export const producerHoursRelations = relations(producerHours, ({ one }) => ({
  producer: one(producers, {
    fields: [producerHours.producerId],
    references: [producers.id],
  }),
}));

export const producerContact = sqliteTable("producer_contact", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  email: text("email"),
  phone: text("phone"),
  websiteUrl: text("website_url"),
});

export const producerContactRelations = relations(
  producerContact,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerContact.producerId],
      references: [producers.id],
    }),
  })
);

export const producerSocial = sqliteTable("producer_social", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  instagram: text("instagram"),
  facebook: text("facebook"),
  twitter: text("facebook"),
  tiktok: text("tiktok"),
  youtube: text("youtube"),
});

export const producerSocialRelations = relations(producerSocial, ({ one }) => ({
  producer: one(producers, {
    fields: [producerSocial.producerId],
    references: [producers.id],
  }),
}));

export const producerQuality = sqliteTable("producer_quality", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  freshness: real("freshness"),
  verifyScore: real("verify_score"),
  completeness: real("completeness"),
  clicks30d: integer("clicks_30d").default(0),
  pins30d: integer("pins_30d").default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const producerQualityRelations = relations(
  producerQuality,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerQuality.producerId],
      references: [producers.id],
    }),
  })
);

export const sponsoredCampaigns = sqliteTable(
  "sponsored_campaigns",
  {
    id: text("id").primaryKey(),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    tier: integer("tier").notNull().default(0),
    bid: real("bid").notNull().default(0),
    budgetCents: integer("budget_cents").notNull().default(0),
    activeFrom: integer("active_from", { mode: "timestamp_ms" }),
    activeTo: integer("active_to", { mode: "timestamp_ms" }),
    targeting: text("targeting"), // JSON
  },
  (t) => [index("idx_spon_prod").on(t.producerId)]
);

export const sponsoredCampaignsRelations = relations(
  sponsoredCampaigns,
  ({ one }) => ({
    producer: one(producers, {
      fields: [sponsoredCampaigns.producerId],
      references: [producers.id],
    }),
  })
);

export const producersSearch = sqliteTable("producers_search", {
  rowid: integer("rowid").primaryKey({ autoIncrement: true }),
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" })
    .unique(),
  searchName: text("search_name"),
  searchSummary: text("search_summary"),
  searchLabels: text("search_labels"),
});

export const producersSearchRelations = relations(
  producersSearch,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producersSearch.producerId],
      references: [producers.id],
    }),
  })
);

export const producersFts = sqliteTable("producers_fts", {
  rowid: integer("rowid").primaryKey(),
  searchName: text("search_name"),
  searchSummary: text("search_summary"),
  searchLabels: text("search_labels"),
});

export const reviewFts = sqliteTable("reviews_fts", {
  body: text(),
  content: text(),
  contentRowid: text("content_rowid"),
  tokenize: text(),
});

export const reviewsContent = sqliteTable(
  "reviews_content",
  {
    docid: integer().primaryKey(),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    reviewId: text("review_id")
      .references(() => producerReviews.id, {
        onDelete: "cascade",
      })
      .unique(),
    importedReviewId: text("imported_review_id")
      .references(() => producerImportedReviews.id, {
        onDelete: "cascade",
      })
      .unique(),
    body: text().notNull(),
  },
  (t) => [index("idx_reviews_content_producer").on(t.producerId)]
);

export const reviewsContentRelations = relations(reviewsContent, ({ one }) => ({
  producer: one(producers, {
    fields: [reviewsContent.producerId],
    references: [producers.id],
  }),
  review: one(producerReviews, {
    fields: [reviewsContent.reviewId],
    references: [producerReviews.id],
  }),
  importedReview: one(producerImportedReviews, {
    fields: [reviewsContent.importedReviewId],
    references: [producerImportedReviews.id],
  }),
}));

export const producerReviews = sqliteTable(
  "producer_reviews",
  {
    id: text().primaryKey(),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    rating: integer().notNull(),
    title: text(),
    body: text(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    check("reviews_rating_check", sql`${t.rating} BETWEEN 0.5 AND 5`),
    index("idx_reviews_prod").on(t.producerId),
    index("idx_reviews_prod_created").on(
      t.producerId,
      sql`${t.createdAt} DESC`
    ),
  ]
);

export const producerReviewsRelations = relations(
  producerReviews,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerReviews.producerId],
      references: [producers.id],
    }),
    reviewContent: one(reviewsContent),
  })
);

export const producerImportedReviews = sqliteTable(
  "producer_imported_reviews",
  {
    id: text().primaryKey(),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    rating: integer().notNull(),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    check("imported_reviews_rating_check", sql`${t.rating} BETWEEN 0.5 AND 5`),
    index("idx_imported_reviews_prod").on(t.producerId),
    index("idx_imported_reviews_prod_created").on(
      t.producerId,
      sql`${t.createdAt} DESC`
    ),
  ]
);

export const producerImportedReviewsRelations = relations(
  producerImportedReviews,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerImportedReviews.producerId],
      references: [producers.id],
    }),
    reviewContent: one(reviewsContent),
  })
);

export const producerRatingAgg = sqliteTable("producer_rating_agg", {
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" })
    .primaryKey(),
  reviewCount: integer("review_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  lastReviewAt: integer("last_review_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const producerRatingAggRelations = relations(
  producerRatingAgg,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producerRatingAgg.producerId],
      references: [producers.id],
    }),
  })
);

export const producerCards = sqliteView("v_producer_cards").as((qb) =>
  qb
    .select({
      id: producers.id,
      name: producers.name,
      type: producers.type,
      userId: producers.userId,
      verified: producers.verified,
      isClaimed:
        sql<boolean>`CASE WHEN ${producers.userId} IS NOT NULL THEN 1 ELSE 0 END`.as(
          "isClaimed"
        ),
      subscriptionRank: producers.subscriptionRank,
      latitude: producerLocation.latitude,
      longitude: producerLocation.longitude,
      locality: producerLocation.locality,
      city: producerLocation.city,
      adminArea: producerLocation.adminArea,
      reviewCount: producerRatingAgg.reviewCount,
      ratingSum: producerRatingAgg.ratingSum,
      country: producerLocation.country,
      avgRating: sql<number | null>`
        CASE
          WHEN ${producerRatingAgg.reviewCount} > 0
          THEN ${producerRatingAgg.ratingSum} * 1.0 / ${producerRatingAgg.reviewCount}
          ELSE NULL
        END
      `.as("avgRating"),
      bayesAvg: sql<number | null>`
        (${producerRatingAgg.ratingSum} + 10 * 4.2) * 1.0 /
        (${producerRatingAgg.reviewCount} + 10)
      `.as("bayesAvg"),
      summary: producers.summary,
      thumbnailUrl: sql<string | null>`(
        SELECT COALESCE(
          json_extract(${mediaAssets.variants}, '$.cover'),
          ${mediaAssets.url}
        )
        FROM ${mediaAssets}
        WHERE ${mediaAssets.id} = (
          SELECT ${producerMedia.assetId}
          FROM ${producerMedia}
          WHERE ${eq(producerMedia.producerId, producers.id)}
          ORDER BY (${producerMedia.role} = 'cover') DESC, ${
            producerMedia.position
          } ASC
          LIMIT 1
        )
      )`.as("thumbnailUrl"),
      searchLabels: producersSearch.searchLabels,
    })
    .from(producers)
    .leftJoin(producerLocation, eq(producerLocation.producerId, producers.id))
    .leftJoin(producersSearch, eq(producersSearch.producerId, producers.id))
    .leftJoin(producerRatingAgg, eq(producerRatingAgg.producerId, producers.id))
);

const PRIOR_MEAN = 3.8; // global mean
const PRIOR_WEIGHT = 20; // prior count

export const producerRatingScores = sqliteView("v_producer_rating_scores").as(
  (qb) =>
    qb
      .select({
        producerId: producerRatingAgg.producerId,
        n: sql`${producerRatingAgg.reviewCount}`.as("n"),
        avgRating:
          sql`(${producerRatingAgg.ratingSum} * 1.0) / NULLIF(${producerRatingAgg.reviewCount}, 0)`.as(
            "avgRating"
          ),
        bayesAvg: sql`(${sql.raw(String(PRIOR_WEIGHT))} * ${sql.raw(
          String(PRIOR_MEAN)
        )} + ${producerRatingAgg.ratingSum})
                    / NULLIF(${sql.raw(String(PRIOR_WEIGHT))} + ${
                      producerRatingAgg.reviewCount
                    }, 0)`.as("bayesAvg"),
        lastReviewAt: producerRatingAgg.lastReviewAt,
        updatedAt: producerRatingAgg.updatedAt,
      })
      .from(producerRatingAgg)
);

export const pinboards = sqliteTable(
  "pinboards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(), // remove UNIQUE
    name: text("name").notNull(), // user-facing board name (e.g., "Florence")
    description: text("description"),
    visibility: text("visibility", { enum: ["private", "unlisted", "shared"] })
      .notNull()
      .default("private"),
    viewMode: text("view_mode", { enum: PINBOARD_VIEW_MODES })
      .notNull()
      .default("grid"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("idx_pinboards_user").on(t.userId),
    index("idx_pinboards_visibility").on(t.visibility),
    unique("uq_pinboards_user_name").on(t.userId, t.name),
  ]
);

export const pinboardsRelations = relations(pinboards, ({ many }) => ({
  pins: many(pins),
  pinLists: many(pinLists),
  collaborators: many(pinboardCollaborators),
}));

export const pins = sqliteTable(
  "pins",
  {
    id: text("id").primaryKey(),
    pinboardId: text("pinboard_id")
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    producerId: text("producer_id")
      .notNull()
      .references(() => producers.id, { onDelete: "cascade" }),
    // user-facing metadata on the pin itself (applies across lists within this board)
    titleOverride: text("title_override"), // user can rename the place
    note: text("note"), // free text
    addedVia: text("added_via", { enum: ["manual", "llm", "import", "share"] })
      .notNull()
      .default("manual"),
    sourceQueryId: text("source_query_id"), // tie back to concierge query (optional)
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    unique("uq_pins_board_producer").on(t.pinboardId, t.producerId),
    index("idx_pins_board").on(t.pinboardId),
    index("idx_pins_producer").on(t.producerId),
  ]
);

export const pinsRelations = relations(pins, ({ one, many }) => ({
  pinboard: one(pinboards, {
    fields: [pins.pinboardId],
    references: [pinboards.id],
  }),
  producer: one(producers, {
    fields: [pins.producerId],
    references: [producers.id],
  }),
  listItems: many(pinListItems),
}));

export const pinLists = sqliteTable(
  "pin_lists",
  {
    id: text("id").primaryKey(),
    pinboardId: text("pinboard_id")
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortMode: text("sort_mode", {
      enum: ["manual", "distance", "rating", "recent"],
    })
      .notNull()
      .default("manual"),
    // manual ordering across lists within a board (sparse ints for cheap reordering)
    position: integer("position").notNull().default(65536),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    unique("uq_pinlists_board_name").on(t.pinboardId, t.name),
    index("idx_pinlists_board").on(t.pinboardId),
    index("idx_pinlists_board_pos").on(t.pinboardId, t.position),
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
  "pin_list_items",
  {
    pinListId: text("pin_list_id")
      .notNull()
      .references(() => pinLists.id, { onDelete: "cascade" }),
    pinId: text("pin_id")
      .notNull()
      .references(() => pins.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(65536), // manual order within the list
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pinListId, t.pinId] }),
    index("idx_pinlistitems_list").on(t.pinListId),
    index("idx_pinlistitems_list_pos").on(t.pinListId, t.position),
  ]
);

export const pinListItemsRelations = relations(pinListItems, ({ one }) => ({
  pinList: one(pinLists, {
    fields: [pinListItems.pinListId],
    references: [pinLists.id],
  }),
  pin: one(pins, { fields: [pinListItems.pinId], references: [pins.id] }),
}));

export const pinboardCollaborators = sqliteTable(
  "pinboard_collaborators",
  {
    pinboardId: text("pinboard_id")
      .notNull()
      .references(() => pinboards.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "editor", "viewer"] })
      .notNull()
      .default("viewer"),
    addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pinboardId, t.userId] }),
    index("idx_collab_user").on(t.userId),
  ]
);

export const producersScrapeMeta = sqliteTable("producers_scrape_meta", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  type: text({ enum: ["grownby", "eatwellguide", "michelin"] }).notNull(),
  meta: text({ mode: "json" }).$type<ScrapeMeta>().notNull(),
});

export const producersScrapeMetaRelations = relations(
  producersScrapeMeta,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producersScrapeMeta.producerId],
      references: [producers.id],
    }),
  })
);

export const producersGoogleMapsPlaceDetails = sqliteTable(
  "producers_google_maps_place_details",
  {
    producerId: text("producer_id")
      .primaryKey()
      .references(() => producers.id, { onDelete: "cascade" }),
    placeName: text("place_name").notNull(),
    placeId: text("place_id").notNull(),
    mapsUri: text("maps_uri"),
    businessStatus: text("business_status"),
    types: text({ mode: "json" }).$type<string[]>(),
    rating: real(),
  }
);

export const producersGoogleMapsPlaceDetailsRelations = relations(
  producersGoogleMapsPlaceDetails,
  ({ one }) => ({
    producer: one(producers, {
      fields: [producersGoogleMapsPlaceDetails.producerId],
      references: [producers.id],
    }),
  })
);

// literals → unions
export type PinboardViewMode = (typeof PINBOARD_VIEW_MODES)[number];

// tables
export type SuggestedProducerInsert = typeof suggestedProducers.$inferInsert;
export type SuggestedProducerSelect = typeof suggestedProducers.$inferSelect;

export type ClaimRequestInsert = typeof claimRequests.$inferInsert;
export type ClaimRequestSelect = typeof claimRequests.$inferSelect;

export type ClaimInvitationInsert = typeof claimInvitations.$inferInsert;
export type ClaimInvitationSelect = typeof claimInvitations.$inferSelect;

export type PreLaunchProducerWaitlistInsert =
  typeof preLaunchProducerWaitlist.$inferInsert;
export type PreLaunchProducerWaitlistSelect =
  typeof preLaunchProducerWaitlist.$inferSelect;

export type ExternalApiKeyInsert = typeof externalApiKeys.$inferInsert;
export type ExternalApiKeySelect = typeof externalApiKeys.$inferSelect;

export type OutreachDataInsert = typeof outreachData.$inferInsert;
export type OutreachDataSelect = typeof outreachData.$inferSelect;

export type OutreachEventInsert = typeof outreachEvent.$inferInsert;
export type OutreachEventSelect = typeof outreachEvent.$inferSelect;

export type MediaAssetInsert = typeof mediaAssets.$inferInsert;
export type MediaAssetSelect = typeof mediaAssets.$inferSelect;

export type PendingMediaAssetInsert = typeof pendingMediaAssets.$inferInsert;
export type PendingMediaAssetSelect = typeof pendingMediaAssets.$inferSelect;

export type ProducerMediaInsert = typeof producerMedia.$inferInsert;
export type ProducerMediaSelect = typeof producerMedia.$inferSelect;

export type PinboardMediaInsert = typeof pinboardMedia.$inferInsert;
export type PinboardMediaSelect = typeof pinboardMedia.$inferSelect;

export type ProducerInsert = typeof producers.$inferInsert;
export type ProducerSelect = typeof producers.$inferSelect;

export type ProducerLocationInsert = typeof producerLocation.$inferInsert;
export type ProducerLocationSelect = typeof producerLocation.$inferSelect;

export type CommodityInsert = typeof commodities.$inferInsert;
export type CommoditySelect = typeof commodities.$inferSelect;

export type CommodityVariantInsert = typeof commodityVariants.$inferInsert;
export type CommodityVariantSelect = typeof commodityVariants.$inferSelect;

export type CommodityAliasInsert = typeof commodityAliases.$inferInsert;
export type CommodityAliasSelect = typeof commodityAliases.$inferSelect;

export type ProducerCommodityInsert = typeof producerCommodities.$inferInsert;
export type ProducerCommoditySelect = typeof producerCommodities.$inferSelect;

export type CertificationInsert = typeof certifications.$inferInsert;
export type CertificationSelect = typeof certifications.$inferSelect;

export type ProducerCertificationInsert =
  typeof producerCertifications.$inferInsert;
export type ProducerCertificationSelect =
  typeof producerCertifications.$inferSelect;

export type ProducerChatInsert = typeof producerChats.$inferInsert;
export type ProducerChatSelect = typeof producerChats.$inferSelect;

export type ProducerChatMessageInsert =
  typeof producerChatMessages.$inferInsert;
export type ProducerChatMessageSelect =
  typeof producerChatMessages.$inferSelect;

export type LabelInsert = typeof labels.$inferInsert;
export type LabelSelect = typeof labels.$inferSelect;

export type ProducerLabelMapInsert = typeof producerLabelMap.$inferInsert;
export type ProducerLabelMapSelect = typeof producerLabelMap.$inferSelect;

export type ProducerHoursInsert = typeof producerHours.$inferInsert;
export type ProducerHoursSelect = typeof producerHours.$inferSelect;

export type ProducerContactInsert = typeof producerContact.$inferInsert;
export type ProducerContactSelect = typeof producerContact.$inferSelect;

export type ProducerSocialInsert = typeof producerSocial.$inferInsert;
export type ProducerSocialSelect = typeof producerSocial.$inferSelect;

export type ProducerQualityInsert = typeof producerQuality.$inferInsert;
export type ProducerQualitySelect = typeof producerQuality.$inferSelect;

export type SponsoredCampaignInsert = typeof sponsoredCampaigns.$inferInsert;
export type SponsoredCampaignSelect = typeof sponsoredCampaigns.$inferSelect;

export type ProducersSearchInsert = typeof producersSearch.$inferInsert;
export type ProducersSearchSelect = typeof producersSearch.$inferSelect;

export type ProducersFtsInsert = typeof producersFts.$inferInsert;
export type ProducersFtsSelect = typeof producersFts.$inferSelect;

export type ReviewFtsInsert = typeof reviewFts.$inferInsert;
export type ReviewFtsSelect = typeof reviewFts.$inferSelect;

export type ReviewsContentInsert = typeof reviewsContent.$inferInsert;
export type ReviewsContentSelect = typeof reviewsContent.$inferSelect;

export type ProducerReviewInsert = typeof producerReviews.$inferInsert;
export type ProducerReviewSelect = typeof producerReviews.$inferSelect;

export type ProducerImportedReviewInsert =
  typeof producerImportedReviews.$inferInsert;
export type ProducerImportedReviewSelect =
  typeof producerImportedReviews.$inferSelect;

export type ProducerRatingAggInsert = typeof producerRatingAgg.$inferInsert;
export type ProducerRatingAggSelect = typeof producerRatingAgg.$inferSelect;

export type PinboardInsert = typeof pinboards.$inferInsert;
export type PinboardSelect = typeof pinboards.$inferSelect;

export type PinInsert = typeof pins.$inferInsert;
export type PinSelect = typeof pins.$inferSelect;

export type PinListInsert = typeof pinLists.$inferInsert;
export type PinListSelect = typeof pinLists.$inferSelect;

export type PinListItemInsert = typeof pinListItems.$inferInsert;
export type PinListItemSelect = typeof pinListItems.$inferSelect;

export type PinboardCollaboratorInsert =
  typeof pinboardCollaborators.$inferInsert;
export type PinboardCollaboratorSelect =
  typeof pinboardCollaborators.$inferSelect;

export type ProducersScrapeMetaInsert = typeof producersScrapeMeta.$inferInsert;
export type ProducersScrapeMetaSelect = typeof producersScrapeMeta.$inferSelect;

export type ProducersGoogleMapsPlaceDetailsInsert =
  typeof producersGoogleMapsPlaceDetails.$inferInsert;
export type ProducersGoogleMapsPlaceDetailsSelect =
  typeof producersGoogleMapsPlaceDetails.$inferSelect;

// views (select-only)
export type ProducerCardsRow = typeof producerCards.$inferSelect;
export type ProducerRatingScoresRow = typeof producerRatingScores.$inferSelect;

export type ProducerWithMap = {
  media: (ProducerMediaSelect & { asset: MediaAssetSelect })[];
  location: ProducerLocationSelect | null;
  commodities: ProducerCommoditySelect[];
  certifications: ProducerCertificationSelect[];
  chats: ProducerChatSelect[];
  labels: ProducerLabelMapSelect[];
  hours: ProducerHoursSelect[];
  contact: ProducerContactSelect | null;
  social: ProducerSocialSelect | null;
  quality: ProducerQualitySelect | null;
  campaigns: SponsoredCampaignSelect[];
  search: ProducersSearchSelect | null;
  reviews: ProducerReviewSelect[];
  importedReviews: ProducerImportedReviewSelect[];
  ratingAgg: ProducerRatingAggSelect | null;
  pins: PinSelect[];
  scrapeMeta: ProducersScrapeMetaSelect | null;
  googleMapsPlaceDetails: ProducersGoogleMapsPlaceDetailsSelect | null;
};

export type ProducerWith<T extends keyof ProducerWithMap = never> =
  ProducerSelect & Pick<ProducerWithMap, T>;

export type ProducerWithAll = ProducerSelect & ProducerWithMap;
