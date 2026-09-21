"use server";

import { like } from "drizzle-orm";
import { generateCustomPlantInfo } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { plants } from "@/lib/db/schema";

export async function createCustomPlant(name: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Plant name cannot be empty");

  const info = await generateCustomPlantInfo(clean);

  const values = {
    name: clean,
    scientificName: info.scientific_name,
    type: info.type,
    sunRequirements: info.sun_requirements,
    waterRequirements: info.water_requirements,
    soilPreference: info.soil_preference,
    usdaZones: info.usda_zones,
    isNative: info.is_native,
    description: info.description,
    matureHeight: info.mature_height,
    matureWidth: info.mature_width,
    minRadius: info.min_radius,
    maxRadius: info.max_radius,
    foliageColor: info.foliage_color,
    canopyShape: info.canopy_shape,
    fruitColor: info.fruit_color,
  };

  await db
    .insert(plants)
    .values(values)
    .onConflictDoUpdate({ target: plants.name, set: values });

  const rows = await db
    .select()
    .from(plants)
    .where(like(plants.name, clean))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Plant variety already exists in catalog.");
  return row;
}
