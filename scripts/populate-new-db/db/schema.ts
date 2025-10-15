import { eq, relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  sqliteView,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const PRODUCER_TYPES = ["farm", "ranch", "eatery"] as const;

export const PINBOARD_VIEW_MODES = ["grid", "list", "map"] as const;

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
    cloudflareId: text("url"),

    // identity & validation
    contentType: text("content_type"), // image/jpeg, image/webp, video/mp4, ...
    byteSize: integer("byte_size"),
    sha256: text("sha256"), // for dedupe + integrity

    // images/video hints
    width: integer("width"),
    height: integer("height"),
    durationSec: real("duration_sec"),

    // UX metadata
    alt: text("alt"), // default alt/caption
    focalX: real("focal_x"), // 0..1 optional crop focus
    focalY: real("focal_y"),

    // derived variants (JSON: {thumb: "...", webp: "...", avif: "...", ...})
    variants: text("variants", { mode: "json" }), // JSON string
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

export type MediaAssetInsert = typeof mediaAssets.$inferInsert;

export const pendingMediaAssets = sqliteTable("pending_media_assets", {
  id: text("id").primaryKey(), // ulid/uuid
  ownerUserId: text("owner_user_id").notNull(), // who uploaded
  mode: text({ enum: ["cloudflare-image", "cloudflare-stream"] }).notNull(),
  pendingAssetKey: text("pending_asset_key").notNull(),
  pendingAssetMeta: text("pending_asset_meta"),
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
      enum: ["cover", "gallery", "logo", "menu", "document"],
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

export type ProducerMediaInsert = typeof producerMedia.$inferInsert;

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

export const commodities = sqliteTable("commodities", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().unique().notNull(),
  name: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

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

export type ProducerCommodityInsert = typeof producerCommodities.$inferInsert;

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

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

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

export type ProducerHoursInsert = typeof producerHours.$inferInsert;

export const producerContact = sqliteTable("producer_contact", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  email: text("email"),
  phone: text("phone"),
  websiteUrl: text("website_url"),
});

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

export const producerRatingAgg = sqliteTable("producer_rating_agg", {
  producerId: text("producer_id")
    .notNull()
    .references(() => producers.id, { onDelete: "cascade" }),
  reviewCount: integer("review_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  lastReviewAt: integer("last_review_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const producerCards = sqliteView("v_producer_cards").as((qb) =>
  qb
    .select({
      id: producers.id,
      name: producers.name,
      type: producers.type,
      verified: producers.verified,
      subscriptionRank: producers.subscriptionRank,
      latitude: producerLocation.latitude,
      longitude: producerLocation.longitude,
      locality: producerLocation.locality,
      adminArea: producerLocation.adminArea,
      country: producerLocation.country,
      thumbnailUrl: sql`(
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

// Optional: collaborators (future-proof sharing)
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

export const producersScrapeMeta = sqliteTable("producers_scrape_meta", {
  producerId: text("producer_id")
    .primaryKey()
    .references(() => producers.id, { onDelete: "cascade" }),
  type: text({ enum: ["grownby", "eatwellguide", "michelin"] }).notNull(),
  meta: text({ mode: "json" }).$type<ScrapeMeta>().notNull(),
});

export const producersGoogleMapsPlaceDetails = sqliteTable(
  "producers_google_maps_place_details",
  {
    producerId: text("producer_id")
      .primaryKey()
      .references(() => producers.id, { onDelete: "cascade" }),
    placeName: text("place_name").notNull(),
    placeId: text("place_id").notNull(),
    mapsUri: text("maps_uri").notNull(),
    businessStatus: text("business_status").notNull(),
    types: text({ mode: "json" }).$type<string[]>(),
    rating: real(),
  }
);
