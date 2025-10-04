CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`isVerified` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certifications_name_unique` ON `certifications` (`name`);--> statement-breakpoint
CREATE TABLE `certifications_to_producers` (
	`certificationId` text NOT NULL,
	`listingId` text NOT NULL,
	PRIMARY KEY(`certificationId`, `listingId`),
	FOREIGN KEY (`certificationId`) REFERENCES `certifications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listingId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `claim_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`producerId` text NOT NULL,
	`requestedVerification` text NOT NULL,
	`status` text NOT NULL,
	`claimToken` text NOT NULL,
	`claimedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `importedReviews` (
	`id` text PRIMARY KEY NOT NULL,
	`producerId` text NOT NULL,
	`rating` real NOT NULL,
	`data` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rating_check" CHECK("importedReviews"."rating" >= 0 AND rating <= 5.0)
);
--> statement-breakpoint
CREATE TABLE `pinListItems` (
	`pinListId` text NOT NULL,
	`pinId` text NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`pinListId`, `pinId`),
	FOREIGN KEY (`pinListId`) REFERENCES `pinLists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pinId`) REFERENCES `pins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pinLists` (
	`id` text PRIMARY KEY NOT NULL,
	`pinboardId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`pinboardId`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idxPinlistPinboard` ON `pinLists` (`pinboardId`);--> statement-breakpoint
CREATE UNIQUE INDEX `pinLists_pinboardId_name_unique` ON `pinLists` (`pinboardId`,`name`);--> statement-breakpoint
CREATE TABLE `pinboards` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`viewMode` text DEFAULT 'grid' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pinboards_userId_unique` ON `pinboards` (`userId`);--> statement-breakpoint
CREATE TABLE `pins` (
	`id` text PRIMARY KEY NOT NULL,
	`pinboardId` text NOT NULL,
	`producerId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`pinboardId`) REFERENCES `pinboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idxPinPinboard` ON `pins` (`pinboardId`);--> statement-breakpoint
CREATE INDEX `idxPinProducer` ON `pins` (`producerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `pins_pinboardId_producerId_unique` ON `pins` (`pinboardId`,`producerId`);--> statement-breakpoint
CREATE TABLE `preLaunchProducerWaitlist` (
	`producerId` text NOT NULL,
	`userId` text,
	`email` text NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`producerId`, `userId`),
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `preLaunchProducerWaitlist_producerId_unique` ON `preLaunchProducerWaitlist` (`producerId`);--> statement-breakpoint
CREATE TABLE `producer_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`senderUserId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `producer_chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `producer_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`producerId` text NOT NULL,
	`producerUserId` text NOT NULL,
	`initiatorUserId` text NOT NULL,
	`initiatorPreventedMoreMessagesAt` integer,
	`producerPreventedMoreMessagesAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `producer_chats_initiatorUserId_producerId_producerUserId_unique` ON `producer_chats` (`initiatorUserId`,`producerId`,`producerUserId`);--> statement-breakpoint
CREATE TABLE `producers` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`claimed` integer NOT NULL,
	`verified` integer NOT NULL,
	`about` text,
	`images` text NOT NULL,
	`pendingImages` text,
	`commodities` text NOT NULL,
	`pendingVideos` text,
	`socialMedia` text NOT NULL,
	`contact` text,
	`address` text,
	`video` text,
	`scrapeMeta` text,
	`hours` text,
	`googleMapsPlaceDetails` text,
	`serviceDetails` text,
	`subscriptionRank` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`producerId` text NOT NULL,
	`reviewerUserId` text NOT NULL,
	`content` text NOT NULL,
	`rating` real NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`producerId`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rating_check" CHECK("reviews"."rating" >= 0 AND rating <= 5.0)
);
