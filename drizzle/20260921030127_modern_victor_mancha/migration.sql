PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`scientific_name` text,
	`type` text NOT NULL,
	`sun_requirements` text NOT NULL,
	`water_requirements` text NOT NULL,
	`soil_preference` text NOT NULL,
	`usda_zones` text NOT NULL,
	`is_native` integer DEFAULT false NOT NULL,
	`description` text,
	`mature_height` real,
	`mature_width` real,
	`min_radius` real,
	`max_radius` real,
	`foliage_color` text,
	`canopy_shape` text,
	`fruit_color` text
);
--> statement-breakpoint
INSERT INTO `__new_plants`(`id`, `name`, `scientific_name`, `type`, `sun_requirements`, `water_requirements`, `soil_preference`, `usda_zones`, `is_native`, `description`, `mature_height`, `mature_width`, `min_radius`, `max_radius`, `foliage_color`, `canopy_shape`, `fruit_color`) SELECT `id`, `name`, `scientific_name`, `type`, `sun_requirements`, `water_requirements`, `soil_preference`, `usda_zones`, `is_native`, `description`, `mature_height`, `mature_width`, `min_radius`, `max_radius`, `foliage_color`, `canopy_shape`, `fruit_color` FROM `plants`;--> statement-breakpoint
DROP TABLE `plants`;--> statement-breakpoint
ALTER TABLE `__new_plants` RENAME TO `plants`;--> statement-breakpoint
PRAGMA foreign_keys=ON;