DROP TABLE `producer_outreach_email_state`;--> statement-breakpoint

CREATE TABLE `producer_outreach_email_state` (
	`producer_id` text PRIMARY KEY NOT NULL,
	`email_step` integer NOT NULL,
	`last_email_sent` integer NOT NULL,
	`next_email_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade
);
