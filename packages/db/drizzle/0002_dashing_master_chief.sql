CREATE TABLE `claim_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`status` text NOT NULL,
	`claim_token` text NOT NULL,
	`claimer_email` text NOT NULL,
	`claimed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `claim_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`producer_id` text NOT NULL,
	`requested_verification` text NOT NULL,
	`status` text NOT NULL,
	`claim_token` text NOT NULL,
	`claimed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `external_api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`api_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`rolled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outreach_data` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`provider_message_id` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outreach_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producer_id` text NOT NULL,
	`type` text NOT NULL,
	`recipient` text NOT NULL,
	`provider_message_id` text,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	`meta` text,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pre_launch_producer_waitlist` (
	`producer_id` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `user_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pre_launch_producer_waitlist_producer_id_unique` ON `pre_launch_producer_waitlist` (`producer_id`);--> statement-breakpoint
CREATE TABLE `producer_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `producer_chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producer_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`producer_id` text NOT NULL,
	`producer_user_id` text NOT NULL,
	`initiator_user_id` text NOT NULL,
	`initiator_prevented_more_messages_at` integer,
	`producer_prevented_more_messages_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `producer_chats_initiator_user_id_producer_id_producer_user_id_unique` ON `producer_chats` (`initiator_user_id`,`producer_id`,`producer_user_id`);--> statement-breakpoint
CREATE TABLE `suggested_producers` (
	`id` text PRIMARY KEY NOT NULL,
	`suggester_user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text,
	`email` text,
	`phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `media_assets` ADD `videoStatus` text;--> statement-breakpoint
DROP VIEW `v_producer_cards`;--> statement-breakpoint
CREATE VIEW `v_producer_cards` AS select "producers"."id", "producers"."name", "producers"."type", "producers"."verified", CASE WHEN "producers"."user_id" IS NOT NULL THEN 1 ELSE 0 END as "isClaimed", "producers"."subscription_rank", "producer_location"."latitude", "producer_location"."longitude", "producer_location"."locality", "producer_location"."admin_area", "producer_location"."country", "producers"."about", (
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
      ) as "thumbnailUrl", "producers_search"."search_labels" from "producers" left join "producer_location" on "producer_location"."producer_id" = "producers"."id" left join "producers_search" on "producers_search"."producer_id" = "producers"."id";