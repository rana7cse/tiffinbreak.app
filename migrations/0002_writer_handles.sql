ALTER TABLE `user` ADD `handle` text;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'writer' NOT NULL;--> statement-breakpoint
-- Backfill existing Writers before the unique index exists. `writer<rowid>` is
-- unique by construction (rowid is unique), so this cannot violate the index.
-- New Writers get a name-based handle at first sign-in instead.
UPDATE `user` SET `handle` = 'writer' || `rowid` WHERE `handle` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_handle_unique` ON `user` (`handle`);
