PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_producer_certifications` (
	`producer_id` text NOT NULL,
	`certification_id` text NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`producer_id`, `certification_id`),
	FOREIGN KEY (`producer_id`) REFERENCES `producers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_producer_certifications`("producer_id", "certification_id", "added_at") SELECT "producer_id", "certification_id", "added_at" FROM `producer_certifications`;--> statement-breakpoint
DROP TABLE `producer_certifications`;--> statement-breakpoint
ALTER TABLE `__new_producer_certifications` RENAME TO `producer_certifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;