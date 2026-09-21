import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { plants } from "@/lib/db/schema";

export interface GetPlantsFilters {
  type?: string;
  isNative?: boolean;
}

export async function getPlants(filters: GetPlantsFilters = {}) {
  const conditions = [];
  if (filters.type) conditions.push(eq(plants.type, filters.type));
  if (filters.isNative !== undefined)
    conditions.push(eq(plants.isNative, filters.isNative));

  return db
    .select()
    .from(plants)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(plants.name);
}
