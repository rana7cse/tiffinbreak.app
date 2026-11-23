CREATE TABLE `story` (
	`id` text PRIMARY KEY NOT NULL,
	`writer_id` text NOT NULL,
	`school_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`cover_key` text,
	`love_total` integer DEFAULT 0 NOT NULL,
	`report_count` integer DEFAULT 0 NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`writer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `story_created_at_idx` ON `story` (`created_at`);--> statement-breakpoint
CREATE INDEX `story_school_created_at_idx` ON `story` (`school_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `story_writer_created_at_idx` ON `story` (`writer_id`,`created_at`);