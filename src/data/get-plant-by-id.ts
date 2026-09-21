import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import { plants, relationships } from "@/lib/db/schema";

const targetPlant = alias(plants, "target_plant");

export async function getPlantById(plantId: number) {
  const rows = await db
    .select()
    .from(plants)
    .where(eq(plants.id, plantId))
    .limit(1);
  const plant = rows[0];
  if (!plant) throw new Error("Plant not found");

  const links = await db
    .select({
      type: relationships.type,
      description: relationships.description,
      targetName: targetPlant.name,
      targetId: targetPlant.id,
    })
    .from(relationships)
    .innerJoin(targetPlant, eq(relationships.targetId, targetPlant.id))
    .where(eq(relationships.plantId, plantId));

  return { ...plant, relationships: links };
}
