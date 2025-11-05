DROP INDEX "uq_cert_slug";--> statement-breakpoint
DROP INDEX "idx_cert_verified";--> statement-breakpoint
DROP INDEX "commodities_slug_unique";--> statement-breakpoint
DROP INDEX "idx_alias_target";--> statement-breakpoint
DROP INDEX "commodity_variants_commodity_id_slug_unique";--> statement-breakpoint
DROP INDEX "labels_slug_unique";--> statement-breakpoint
DROP INDEX "idx_media_by_actor";--> statement-breakpoint
DROP INDEX "idx_media_by_origin";--> statement-breakpoint
DROP INDEX "idx_media_type";--> statement-breakpoint
DROP INDEX "uq_media_sha256";--> statement-breakpoint
DROP INDEX "idx_pinlistitems_list";--> statement-breakpoint
DROP INDEX "idx_pinlistitems_list_pos";--> statement-breakpoint
DROP INDEX "idx_pinlists_board";--> statement-breakpoint
DROP INDEX "idx_pinlists_board_pos";--> statement-breakpoint
DROP INDEX "uq_pinlists_board_name";--> statement-breakpoint
DROP INDEX "idx_collab_user";--> statement-breakpoint
DROP INDEX "idx_pbmedia_board";--> statement-breakpoint
DROP INDEX "idx_pbmedia_asset";--> statement-breakpoint
DROP INDEX "idx_pinboards_user";--> statement-breakpoint
DROP INDEX "idx_pinboards_visibility";--> statement-breakpoint
DROP INDEX "uq_pinboards_user_name";--> statement-breakpoint
DROP INDEX "idx_pins_board";--> statement-breakpoint
DROP INDEX "idx_pins_producer";--> statement-breakpoint
DROP INDEX "uq_pins_board_producer";--> statement-breakpoint
DROP INDEX "pre_launch_producer_waitlist_producer_id_unique";--> statement-breakpoint
DROP INDEX "producer_chats_initiator_user_id_producer_id_producer_user_id_unique";--> statement-breakpoint
DROP INDEX "idx_pc_by_commodity";--> statement-breakpoint
DROP INDEX "idx_pc_by_variant";--> statement-breakpoint
DROP INDEX "idx_pc_by_organic";--> statement-breakpoint
DROP INDEX "idx_hours_prod";--> statement-breakpoint
DROP INDEX "idx_imported_reviews_prod";--> statement-breakpoint
DROP INDEX "idx_imported_reviews_prod_created";--> statement-breakpoint
DROP INDEX "idx_plm_label";--> statement-breakpoint
DROP INDEX "idx_plm_prod";--> statement-breakpoint
DROP INDEX "producer_location_producer_id_unique";--> statement-breakpoint
DROP INDEX "idx_loc_locality";--> statement-breakpoint
DROP INDEX "idx_loc_city";--> statement-breakpoint
DROP INDEX "idx_loc_country";--> statement-breakpoint
DROP INDEX "idx_loc_admin_area";--> statement-breakpoint
DROP INDEX "idx_loc_postcode";--> statement-breakpoint
DROP INDEX "idx_prodmedia_producer";--> statement-breakpoint
DROP INDEX "idx_prodmedia_asset";--> statement-breakpoint
DROP INDEX "idx_reviews_prod";--> statement-breakpoint
DROP INDEX "idx_reviews_prod_created";--> statement-breakpoint
DROP INDEX "idx_prod_type";--> statement-breakpoint
DROP INDEX "idx_prod_verified";--> statement-breakpoint
DROP INDEX "idx_prod_subrank";--> statement-breakpoint
DROP INDEX "producers_search_producer_id_unique";--> statement-breakpoint
DROP INDEX "reviews_content_review_id_unique";--> statement-breakpoint
DROP INDEX "reviews_content_imported_review_id_unique";--> statement-breakpoint
DROP INDEX "idx_reviews_content_producer";--> statement-breakpoint
DROP INDEX "idx_spon_prod";--> statement-breakpoint
ALTER TABLE `media_assets` ALTER COLUMN "url" TO "url" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cert_slug` ON `certifications` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_cert_verified` ON `certifications` (`is_verified`);--> statement-breakpoint
CREATE UNIQUE INDEX `commodities_slug_unique` ON `commodities` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_alias_target` ON `commodity_aliases` (`target_commodity_id`,`target_variant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `commodity_variants_commodity_id_slug_unique` ON `commodity_variants` (`commodity_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `labels_slug_unique` ON `labels` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_media_by_actor` ON `media_assets` (`uploaded_by_type`,`uploaded_by_id`);--> statement-breakpoint
CREATE INDEX `idx_media_by_origin` ON `media_assets` (`origin`);--> statement-breakpoint
CREATE INDEX `idx_media_type` ON `media_assets` (`content_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_media_sha256` ON `media_assets` (`sha256`);--> statement-breakpoint
CREATE INDEX `idx_pinlistitems_list` ON `pin_list_items` (`pin_list_id`);--> statement-breakpoint
CREATE INDEX `idx_pinlistitems_list_pos` ON `pin_list_items` (`pin_list_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_pinlists_board` ON `pin_lists` (`pinboard_id`);--> statement-breakpoint
CREATE INDEX `idx_pinlists_board_pos` ON `pin_lists` (`pinboard_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pinlists_board_name` ON `pin_lists` (`pinboard_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_collab_user` ON `pinboard_collaborators` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pbmedia_board` ON `pinboard_media` (`pinboard_id`,`role`,`position`);--> statement-breakpoint
CREATE INDEX `idx_pbmedia_asset` ON `pinboard_media` (`asset_id`);--> statement-breakpoint
CREATE INDEX `idx_pinboards_user` ON `pinboards` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pinboards_visibility` ON `pinboards` (`visibility`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pinboards_user_name` ON `pinboards` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_pins_board` ON `pins` (`pinboard_id`);--> statement-breakpoint
CREATE INDEX `idx_pins_producer` ON `pins` (`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pins_board_producer` ON `pins` (`pinboard_id`,`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pre_launch_producer_waitlist_producer_id_unique` ON `pre_launch_producer_waitlist` (`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `producer_chats_initiator_user_id_producer_id_producer_user_id_unique` ON `producer_chats` (`initiator_user_id`,`producer_id`,`producer_user_id`);--> statement-breakpoint
CREATE INDEX `idx_pc_by_commodity` ON `producer_commodities` (`commodity_id`);--> statement-breakpoint
CREATE INDEX `idx_pc_by_variant` ON `producer_commodities` (`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_pc_by_organic` ON `producer_commodities` (`organic`);--> statement-breakpoint
CREATE INDEX `idx_hours_prod` ON `producer_hours` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_imported_reviews_prod` ON `producer_imported_reviews` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_imported_reviews_prod_created` ON `producer_imported_reviews` (`producer_id`,`created_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_plm_label` ON `producer_label_map` (`label_id`);--> statement-breakpoint
CREATE INDEX `idx_plm_prod` ON `producer_label_map` (`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `producer_location_producer_id_unique` ON `producer_location` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_loc_locality` ON `producer_location` (`locality`);--> statement-breakpoint
CREATE INDEX `idx_loc_city` ON `producer_location` (`city`);--> statement-breakpoint
CREATE INDEX `idx_loc_country` ON `producer_location` (`country`);--> statement-breakpoint
CREATE INDEX `idx_loc_admin_area` ON `producer_location` (`admin_area`);--> statement-breakpoint
CREATE INDEX `idx_loc_postcode` ON `producer_location` (`postcode`);--> statement-breakpoint
CREATE INDEX `idx_prodmedia_producer` ON `producer_media` (`producer_id`,`role`,`position`);--> statement-breakpoint
CREATE INDEX `idx_prodmedia_asset` ON `producer_media` (`asset_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_prod` ON `producer_reviews` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_prod_created` ON `producer_reviews` (`producer_id`,`created_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_prod_type` ON `producers` (`type`);--> statement-breakpoint
CREATE INDEX `idx_prod_verified` ON `producers` (`verified`);--> statement-breakpoint
CREATE INDEX `idx_prod_subrank` ON `producers` (`subscription_rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `producers_search_producer_id_unique` ON `producers_search` (`producer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_content_review_id_unique` ON `reviews_content` (`review_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_content_imported_review_id_unique` ON `reviews_content` (`imported_review_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_content_producer` ON `reviews_content` (`producer_id`);--> statement-breakpoint
CREATE INDEX `idx_spon_prod` ON `sponsored_campaigns` (`producer_id`);--> statement-breakpoint
ALTER TABLE `media_assets` ADD `cloudflareId` text;