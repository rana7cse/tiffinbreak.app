DROP INDEX `school_normalized_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `school_name_unique` ON `school` (`name`);--> statement-breakpoint
ALTER TABLE `school` DROP COLUMN `normalized_name`;--> statement-breakpoint
ALTER TABLE `school` DROP COLUMN `merged_into_id`;