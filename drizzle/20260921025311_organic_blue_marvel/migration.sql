CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`scientific_name` text,
	`type` text NOT NULL,
	`sun_requirements` text NOT NULL,
	`water_requirements` text NOT NULL,
	`soil_preference` text NOT NULL,
	`usda_zones` text NOT NULL,
	`is_native` integer DEFAULT 0 NOT NULL,
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
CREATE TABLE `relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`plant_id` integer NOT NULL,
	`target_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	CONSTRAINT `fk_relationships_plant_id_plants_id_fk` FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_relationships_target_id_plants_id_fk` FOREIGN KEY (`target_id`) REFERENCES `plants`(`id`) ON DELETE CASCADE,
	CONSTRAINT `relationships_plant_id_target_id_type_unique` UNIQUE(`plant_id`,`target_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `visitor_countries` (
	`country_code` text PRIMARY KEY,
	`country_name` text NOT NULL,
	`visit_count` integer DEFAULT 1
);
