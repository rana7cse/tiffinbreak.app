CREATE TABLE `story_read` (
	`story_id` text NOT NULL,
	`reader_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`story_id`, `reader_id`),
	FOREIGN KEY (`story_id`) REFERENCES `story`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reader_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `story` ADD `read_total` integer DEFAULT 0 NOT NULL;