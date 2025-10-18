CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cert_slug` ON `certifications` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_cert_verified` ON `certifications` (`is_verified`);--> statement-breakpoint
CREATE TABLE `commodities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commodities_slug_unique` ON `commodities` (`slug`);--> statement-breakpoint
CREATE TABLE `commodity_aliases` (
	`alias` text PRIMARY KEY NOT NULL,
	`target_commodity_id` integer NOT NULL,
	`target_variant_id` integer NOT NULL,
	FOREIGN KEY (`target_commodity_id`) REFERENCES `commodities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_variant_id`) REFERENCES `commodity_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_alias_target` ON `commodity_aliases` (`target_commodity_id`,`target_variant_id`);--> statement-breakpoint
CREATE TABLE `commodity_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`commodity_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commodity_variants_commodity_id_slug_unique` ON `commodity_variants` (`commodity_id`,`slug`);--> statement-breakpoint
CREATE TABLE `labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `labels_slug_unique` ON `labels` (`slug`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`uploaded_by_type` text NOT NULL,
	`uploaded_by_id` text,
	`origin` text DEFAULT 'user_upload' NOT NULL,
	`storage` text NOT NULL,
	`bucket` text,
	`key` text,
	`url` text,
	`content_type` text,
	`byte_size` integer,
	`sha256` text,
	`width` integer,
	`height` integer,
	`duration_sec` real,
	`alt` text,
	`focal_x` real,
	`focal_y` real,
	`variants` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_media_by_actor` ON `media_assets` (`uploaded_by_type`,`uploaded_by_id`);--> statement-breakpoint
CREATE INDEX `idx_media_by_origin` ON `media_assets` (`origin`);--> statement-breakpoint
CREATE INDEX `idx_media_type` ON `media_assets` (`content_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_media_sha256` ON `media_assets` (`sha256`);--> statement-breakpoint
CREATE TABLE `pending_media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`mode` text NOT NULL,
	`pending_asset_key` text NOT NULL,
	`pending_asset_meta` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pin_list_items` (
	`pin_list_id` text NOT NULL,
	`pin_id` text NOT NULL,
	`position` integer DEFAULT 65536 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`pin_list_id`, `pin_id`),
	FOREIGN KEY (`pin_list_id`) REFERENCES `pin_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pin_id`) REFERENCES `pins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pinlistitems_list` ON `pin_list_items` (`pin_list_id`);--> statement-breakpoint
CREATE INDEX `idx_pinlistitems_list_pos` ON `pin_list_items` (`pin_list_id`,`position`);--> statement-breakpoint
CREATE TABLE `pin_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`pinboard_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_mode` text DEFAULT 'manual' NOT NULL,
	`position` integer DEFAULT 65536 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pinboard_id`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pinlists_board` ON `pin_lists` (`pinboard_id`);--> statement-breakpoint
CREATE INDEX `idx_pinlists_board_pos` ON `pin_lists` (`pinboard_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pinlists_board_name` ON `pin_lists` (`pinboard_id`,`name`);--> statement-breakpoint
CREATE TABLE `pinboard_collaborators` (
	`pinboard_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`pinboard_id`, `user_id`),
	FOREIGN KEY (`pinboard_id`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_collab_user` ON `pinboard_collaborators` (`user_id`);--> statement-breakpoint
CREATE TABLE `pinboard_media` (
	`pinboard_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`role` text DEFAULT 'gallery' NOT NULL,
	`position` integer DEFAULT 65536 NOT NULL,
	`caption` text,
	`added_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`pinboard_id`, `asset_id`),
	FOREIGN KEY (`pinboard_id`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pbmedia_board` ON `pinboard_media` (`pinboard_id`,`role`,`position`);--> statement-breakpoint
CREATE INDEX `idx_pbmedia_asset` ON `pinboard_media` (`asset_id`);--> statement-breakpoint
CREATE TABLE `pinboards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`view_mode` text DEFAULT 'grid' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pinboards_user` ON `pinboards` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pinboards_visibility` ON `pinboards` (`visibility`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pinboards_user_name` ON `pinboards` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `pins` (
	`id` text PRIMARY KEY NOT NULL,
	`pinboard_id` text NOT NULL,
	`producer_id` text NOT NULL,
	`title_override` text,
	`note` text,
	`added_via` text DEFAULT 'manual' NOT NULL,
	`source_query_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pinboard_id`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pins_board` ON `pins` (`pinboard_id`);--> statement-breakpoint
CREATE INDEX `idx_pins_producer` ON `pins` (`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pins_board_producer` ON `pins` (`pinboard_id`,`producer_id`);--> statement-breakpoint
CREATE TABLE `producer_certifications` (
	`producer_id` text NOT NULL,
	`certification_id` text NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `certification_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `producer_commodities` (
	`producer_id` text NOT NULL,
	`commodity_id` integer NOT NULL,
	`variant_id` integer,
	`organic` integer DEFAULT false NOT NULL,
	`certifications` text,
	`season_months` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `commodity_id`, `variant_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `commodity_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_pc_by_commodity` ON `producer_commodities` (`commodity_id`);--> statement-breakpoint
CREATE INDEX `idx_pc_by_variant` ON `producer_commodities` (`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_pc_by_organic` ON `producer_commodities` (`organic`);--> statement-breakpoint
CREATE TABLE `producer_contact` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`email` text,
	`phone` text,
	`website_url` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producer_hours` (
	`producer_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`open_min` integer NOT NULL,
	`close_min` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `weekday`, `open_min`, `close_min`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_hours_prod` ON `producer_hours` (`producer_id`);--> statement-breakpoint
CREATE TABLE `producer_imported_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`rating` integer NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "imported_reviews_rating_check" CHECK("producer_imported_reviews"."rating" BETWEEN 0.5 AND 5)
);
--> statement-breakpoint
CREATE INDEX `idx_imported_reviews_prod` ON `producer_imported_reviews` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_imported_reviews_prod_created` ON `producer_imported_reviews` (`producer_id`,"created_at" DESC);--> statement-breakpoint
CREATE TABLE `producer_label_map` (
	`producer_id` text NOT NULL,
	`label_id` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `label_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_plm_label` ON `producer_label_map` (`label_id`);--> statement-breakpoint
CREATE INDEX `idx_plm_prod` ON `producer_label_map` (`producer_id`);--> statement-breakpoint
CREATE TABLE `producer_location` (
	`geo_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producer_id` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`locality` text,
	`city` text,
	`postcode` text,
	`admin_area` text,
	`country` text,
	`geohash` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `producer_location_producer_id_unique` ON `producer_location` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_loc_locality` ON `producer_location` (`locality`);--> statement-breakpoint
CREATE INDEX `idx_loc_city` ON `producer_location` (`city`);--> statement-breakpoint
CREATE INDEX `idx_loc_country` ON `producer_location` (`country`);--> statement-breakpoint
CREATE INDEX `idx_loc_admin_area` ON `producer_location` (`admin_area`);--> statement-breakpoint
CREATE INDEX `idx_loc_postcode` ON `producer_location` (`postcode`);--> statement-breakpoint
CREATE TABLE `producer_media` (
	`producer_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`role` text DEFAULT 'gallery' NOT NULL,
	`position` integer DEFAULT 65536 NOT NULL,
	`caption` text,
	`added_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `asset_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_prodmedia_producer` ON `producer_media` (`producer_id`,`role`,`position`);--> statement-breakpoint
CREATE INDEX `idx_prodmedia_asset` ON `producer_media` (`asset_id`);--> statement-breakpoint
CREATE TABLE `producer_quality` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`freshness` real,
	`verify_score` real,
	`completeness` real,
	`clicks_30d` integer DEFAULT 0,
	`pins_30d` integer DEFAULT 0,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producer_rating_agg` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`rating_sum` integer DEFAULT 0 NOT NULL,
	`last_review_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`body` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reviews_rating_check" CHECK("producer_reviews"."rating" BETWEEN 0.5 AND 5)
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_prod` ON `producer_reviews` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_prod_created` ON `producer_reviews` (`producer_id`,"created_at" DESC);--> statement-breakpoint
CREATE TABLE `producer_social` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`instagram` text,
	`facebook` text,
	`tiktok` text,
	`youtube` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`verified` integer NOT NULL,
	`summary` text,
	`about` text,
	`subscription_rank` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_prod_type` ON `producers` (`type`);--> statement-breakpoint
CREATE INDEX `idx_prod_verified` ON `producers` (`verified`);--> statement-breakpoint
CREATE INDEX `idx_prod_subrank` ON `producers` (`subscription_rank`);--> statement-breakpoint

CREATE TABLE `producers_google_maps_place_details` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`place_name` text NOT NULL,
	`place_id` text NOT NULL,
	`maps_uri` text,
	`business_status` text,
	`types` text,
	`rating` real,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producers_scrape_meta` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`meta` text NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producers_search` (
	`rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producer_id` text NOT NULL,
	`search_name` text,
	`search_summary` text,
	`search_labels` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `producers_search_producer_id_unique` ON `producers_search` (`producer_id`);--> statement-breakpoint

CREATE TABLE `reviews_content` (
	`docid` integer PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`review_id` text,
	`imported_review_id` text,
	`body` text NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`review_id`) REFERENCES `producer_reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`imported_review_id`) REFERENCES `producer_imported_reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_content_review_id_unique` ON `reviews_content` (`review_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_content_imported_review_id_unique` ON `reviews_content` (`imported_review_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_content_producer` ON `reviews_content` (`producer_id`);--> statement-breakpoint
CREATE TABLE `sponsored_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`tier` integer DEFAULT 0 NOT NULL,
	`bid` real DEFAULT 0 NOT NULL,
	`budget_cents` integer DEFAULT 0 NOT NULL,
	`active_from` integer,
	`active_to` integer,
	`targeting` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_spon_prod` ON `sponsored_campaigns` (`producer_id`);--> statement-breakpoint
CREATE VIEW `v_producer_cards` AS select "producers"."id", "producers"."name", "producers"."type", "producers"."verified", "producers"."subscription_rank", "producer_location"."latitude", "producer_location"."longitude", "producer_location"."locality", "producer_location"."admin_area", "producer_location"."country", (
        SELECT COALESCE(
          json_extract("media_assets"."variants", '$.cover'),
          "media_assets"."url"
        )
        FROM "media_assets"
        WHERE "media_assets"."id" = (
          SELECT "producer_media"."asset_id"
          FROM "producer_media"
          WHERE "producer_media"."producer_id" = "producers"."id"
          ORDER BY ("producer_media"."role" = 'cover') DESC, "producer_media"."position" ASC
          LIMIT 1
        )
      ) as "thumbnailUrl", "producers_search"."search_labels" from "producers" left join "producer_location" on "producer_location"."producer_id" = "producers"."id" left join "producers_search" on "producers_search"."producer_id" = "producers"."id";--> statement-breakpoint
CREATE VIEW `v_producer_rating_scores` AS select "producer_id", "review_count" as "n", ("rating_sum" * 1.0) / NULLIF("review_count", 0) as "avgRating", (20 * 3.8 + "rating_sum")
                    / NULLIF(20 + "review_count", 0) as "bayesAvg", "last_review_at", "updated_at" from "producer_rating_agg";

					--> statement-breakpoint


/* =========================================================
   1) FTS5 over producers_search (Drizzle creates producers_search)
   ========================================================= */

CREATE VIRTUAL TABLE producers_fts USING fts5(
  search_name, 
  search_summary, 
  search_labels,
  content='producers_search', 
  content_rowid='rowid'
);
--> statement-breakpoint

CREATE TRIGGER ps_ai AFTER INSERT ON producers_search BEGIN
  INSERT INTO producers_fts(rowid, search_name, search_summary, search_labels)
  VALUES (new.rowid, new.search_name, new.search_summary, new.search_labels);
END;
--> statement-breakpoint

CREATE TRIGGER ps_ad AFTER DELETE ON producers_search BEGIN
  INSERT INTO producers_fts(producers_fts, rowid, search_name, search_summary, search_labels)
  VALUES ('delete', old.rowid, old.search_name, old.search_summary, old.search_labels);
END;
--> statement-breakpoint

CREATE TRIGGER ps_au AFTER UPDATE ON producers_search BEGIN
  INSERT INTO producers_fts(producers_fts, rowid, search_name, search_summary, search_labels)
  VALUES ('delete', old.rowid, old.search_name, old.search_summary, old.search_labels);
  INSERT INTO producers_fts(rowid, search_name, search_summary, search_labels)
  VALUES (new.rowid, new.search_name, new.search_summary, new.search_labels);
END;

--> statement-breakpoint

/* =========================================================
   2) R*Tree index for spatial prefilter (Drizzle creates producer_location)
   Assumes producer_location has:
     geo_id INTEGER PRIMARY KEY
     producer_id TEXT UNIQUE NOT NULL
     latitude REAL, longitude REAL
   ========================================================= */

CREATE VIRTUAL TABLE rtree_producers USING rtree(
  geo_id,            -- INTEGER, matches producer_location.geo_id
  minLon, maxLon,    -- X
  minLat, maxLat     -- Y
);
--> statement-breakpoint

CREATE TRIGGER rtree_loc_ins
AFTER INSERT ON producer_location
WHEN NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL
BEGIN
  INSERT INTO rtree_producers(geo_id, minLon, maxLon, minLat, maxLat)
  VALUES (NEW.geo_id, NEW.longitude, NEW.longitude, NEW.latitude, NEW.latitude);
END;
--> statement-breakpoint

CREATE TRIGGER rtree_loc_upd
AFTER UPDATE OF longitude, latitude ON producer_location
BEGIN
  -- Always remove the old point
  DELETE FROM rtree_producers WHERE geo_id = NEW.geo_id;

  -- Reinsert only if both coords are non-null
  INSERT INTO rtree_producers(geo_id, minLon, maxLon, minLat, maxLat)
  SELECT NEW.geo_id, NEW.longitude, NEW.longitude, NEW.latitude, NEW.latitude
  WHERE NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL;
END;
--> statement-breakpoint

CREATE TRIGGER rtree_loc_del
AFTER DELETE ON producer_location
BEGIN
  DELETE FROM rtree_producers WHERE geo_id = OLD.geo_id;
END;
--> statement-breakpoint

CREATE TRIGGER trg_loc_lat_check_ins
BEFORE INSERT ON producer_location
WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90.0 OR NEW.latitude > 90.0)
BEGIN SELECT RAISE(ABORT,'latitude out of range [-90,90]'); END;
--> statement-breakpoint

CREATE TRIGGER trg_loc_lat_check_upd
BEFORE UPDATE OF latitude ON producer_location
WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90.0 OR NEW.latitude > 90.0)
BEGIN SELECT RAISE(ABORT,'latitude out of range [-90,90]'); END;
--> statement-breakpoint

CREATE TRIGGER trg_loc_lon_check_ins
BEFORE INSERT ON producer_location
WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180.0 OR NEW.longitude > 180.0)
BEGIN SELECT RAISE(ABORT,'longitude out of range [-180,180]'); END;
--> statement-breakpoint

CREATE TRIGGER trg_loc_lon_check_upd
BEFORE UPDATE OF longitude ON producer_location
WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180.0 OR NEW.longitude > 180.0)
BEGIN SELECT RAISE(ABORT,'longitude out of range [-180,180]'); END;
--> statement-breakpoint

CREATE TRIGGER trg_rev_ins
AFTER INSERT ON producer_reviews
BEGIN
  INSERT INTO producer_rating_agg (
    producer_id, review_count, rating_sum, last_review_at, updated_at
  )
  VALUES (
    NEW.producer_id, 1, NEW.rating, NEW.created_at, strftime('%s','now')*1000
  )
  ON CONFLICT(producer_id) DO UPDATE SET
    review_count = review_count + 1,
    rating_sum   = rating_sum   + NEW.rating,
    last_review_at = CASE
        WHEN last_review_at IS NULL OR NEW.created_at > last_review_at
        THEN NEW.created_at ELSE last_review_at END,
    updated_at = strftime('%s','now')*1000;
END;
--> statement-breakpoint

CREATE TRIGGER trg_rev_upd
AFTER UPDATE OF rating ON producer_reviews
BEGIN
  UPDATE producer_rating_agg
  SET
    rating_sum = rating_sum + (NEW.rating - OLD.rating),
    updated_at = strftime('%s','now')*1000
  WHERE producer_id = NEW.producer_id;
   
   
  UPDATE producer_rating_agg
  SET last_review_at = (
        SELECT MAX(created_at) FROM producer_reviews
        WHERE producer_id = NEW.producer_id
      ),
      updated_at = strftime('%s','now')*1000
  WHERE producer_id = NEW.producer_id
    AND NEW.created_at <> OLD.created_at;
END;
--> statement-breakpoint

CREATE TRIGGER trg_rev_del
AFTER DELETE ON producer_reviews
BEGIN
  UPDATE producer_rating_agg
  SET
    review_count = MAX(review_count - 1, 0),
    rating_sum   = rating_sum   - OLD.rating,
	last_review_at = (
        SELECT MAX(created_at) FROM producer_imported_reviews
        WHERE producer_id = OLD.producer_id
      ),
    updated_at = strftime('%s','now')*1000
  WHERE producer_id = OLD.producer_id;
END;--> statement-breakpoint

-- Producers Auto-demote existing cover (for a smoother UX):
CREATE TRIGGER trg_prodmedia_cover_replace
AFTER INSERT ON producer_media
WHEN NEW.role = 'cover'
BEGIN
  UPDATE producer_media
  SET role = 'gallery'
  WHERE producer_id = NEW.producer_id
    AND asset_id <> NEW.asset_id
    AND role = 'cover';
END;--> statement-breakpoint

-- Pinboards Auto-demote existing cover (for a smoother UX):
CREATE TRIGGER trg_pbmedia_cover_replace
AFTER INSERT ON pinboard_media
WHEN NEW.role = 'cover'
BEGIN
  UPDATE pinboard_media
  SET role = 'gallery'
  WHERE pinboard_id = NEW.pinboard_id
    AND asset_id <> NEW.asset_id
    AND role = 'cover';
END;
--> statement-breakpoint

CREATE VIRTUAL TABLE reviews_fts USING fts5(
  body,                                    -- columns FTS should tokenize
  content='reviews_content',
  content_rowid='docid',
  tokenize='unicode61'
);

--> statement-breakpoint

CREATE TRIGGER trg_imp_rev_ins
AFTER INSERT ON producer_imported_reviews
BEGIN
  INSERT INTO producer_rating_agg (producer_id, review_count, rating_sum, last_review_at, updated_at)
  VALUES (NEW.producer_id, 1, NEW.rating, NEW.created_at, strftime('%s','now')*1000)
  ON CONFLICT(producer_id) DO UPDATE SET
    review_count   = review_count + 1,
    rating_sum     = rating_sum + NEW.rating,
    last_review_at = CASE
      WHEN last_review_at IS NULL OR NEW.created_at > last_review_at THEN NEW.created_at
      ELSE last_review_at END,
    updated_at     = strftime('%s','now')*1000;
END;
--> statement-breakpoint

CREATE TRIGGER trg_imp_rev_upd
AFTER UPDATE OF rating, created_at ON producer_imported_reviews
BEGIN
  -- rating delta
  UPDATE producer_rating_agg
  SET rating_sum = rating_sum + (NEW.rating - OLD.rating),
      updated_at = strftime('%s','now')*1000
  WHERE producer_id = NEW.producer_id;

  -- if created_at changed and might be the latest, refresh last_review_at conservatively
  UPDATE producer_rating_agg
  SET last_review_at = (
        SELECT MAX(created_at) FROM producer_imported_reviews
        WHERE producer_id = NEW.producer_id
      ),
      updated_at = strftime('%s','now')*1000
  WHERE producer_id = NEW.producer_id
    AND NEW.created_at <> OLD.created_at;
END;
--> statement-breakpoint

CREATE TRIGGER trg_imp_rev_del
AFTER DELETE ON producer_imported_reviews
BEGIN
  UPDATE producer_rating_agg
  SET review_count = MAX(review_count - 1, 0),
      rating_sum   = rating_sum - OLD.rating,
      last_review_at = (
        SELECT MAX(created_at) FROM producer_imported_reviews
        WHERE producer_id = OLD.producer_id
      ),
      updated_at = strftime('%s','now')*1000
  WHERE producer_id = OLD.producer_id;
END;

--> statement-breakpoint
CREATE TRIGGER reviews_content_ai AFTER INSERT ON reviews_content BEGIN
  INSERT INTO reviews_fts(rowid, body) VALUES (new.docid, new.body);
END;
--> statement-breakpoint
CREATE TRIGGER reviews_content_ad AFTER DELETE ON reviews_content BEGIN
  INSERT INTO reviews_fts(reviews_fts, rowid, body) VALUES ('delete', old.docid, old.body);
END;
--> statement-breakpoint
CREATE TRIGGER reviews_content_au AFTER UPDATE OF body ON reviews_content BEGIN
  INSERT INTO reviews_fts(reviews_fts, rowid, body) VALUES ('delete', old.docid, old.body);
  INSERT INTO reviews_fts(rowid, body) VALUES (new.docid, new.body);
END;
