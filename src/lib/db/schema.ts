import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  scientificName: text("scientific_name"),
  type: text("type").notNull(),
  sunRequirements: text("sun_requirements").notNull(),
  waterRequirements: text("water_requirements").notNull(),
  soilPreference: text("soil_preference").notNull(),
  usdaZones: text("usda_zones").notNull(),
  isNative: integer("is_native", { mode: "boolean" }).notNull().default(false),
  description: text("description"),
  matureHeight: real("mature_height"),
  matureWidth: real("mature_width"),
  minRadius: real("min_radius"),
  maxRadius: real("max_radius"),
  foliageColor: text("foliage_color"),
  canopyShape: text("canopy_shape"),
  fruitColor: text("fruit_color"),
});

export const relationships = sqliteTable(
  "relationships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    targetId: integer("target_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    description: text("description"),
  },
  (t) => [unique().on(t.plantId, t.targetId, t.type)],
);

export const visitorCountries = sqliteTable("visitor_countries", {
  countryCode: text("country_code").primaryKey(),
  countryName: text("country_name").notNull(),
  visitCount: integer("visit_count").default(1),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});
