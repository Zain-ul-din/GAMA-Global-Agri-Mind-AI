"use server";

import { and, eq, inArray, like, notInArray, or } from "drizzle-orm";
import type { LayoutAnalysis } from "@/lib/ai";
import { generateGardenAdvice } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { plants, relationships } from "@/lib/db/schema";

export interface CreateDesignInput {
  zip: string;
  gardenWidth: number;
  gardenHeight: number;
  soil: string;
  sun: string;
  plants: string[];
  layoutAnalysis?: LayoutAnalysis | null;
}

export async function createDesign(input: CreateDesignInput) {
  if (!/^\d{5}$/.test(input.zip))
    throw new Error("ZIP must be a 5-digit code.");
  if (!(input.gardenWidth > 0) || !(input.gardenHeight > 0))
    throw new Error("Garden dimensions must be positive.");

  const resolved: { id: number; name: string }[] = [];
  for (const name of input.plants) {
    const rows = await db
      .select({ id: plants.id, name: plants.name })
      .from(plants)
      .where(or(like(plants.name, `%${name}%`), eq(plants.name, name)));
    resolved.push(...rows);
  }

  const companions: {
    plant: string;
    companion: string;
    description: string;
  }[] = [];
  const antagonists: {
    plant: string;
    antagonist: string;
    description: string;
  }[] = [];
  const suggestedCompanions: string[] = [];

  if (resolved.length > 0) {
    const ids = resolved.map((r) => r.id);
    const idToName = new Map(resolved.map((r) => [r.id, r.name] as const));

    const rels = await db
      .select()
      .from(relationships)
      .where(
        and(
          inArray(relationships.plantId, ids),
          inArray(relationships.targetId, ids),
        ),
      );
    for (const rel of rels) {
      const p1 = idToName.get(rel.plantId) ?? String(rel.plantId);
      const p2 = idToName.get(rel.targetId) ?? String(rel.targetId);
      if (rel.type === "companion") {
        companions.push({
          plant: p1,
          companion: p2,
          description: rel.description ?? "",
        });
      } else if (rel.type === "antagonist") {
        antagonists.push({
          plant: p1,
          antagonist: p2,
          description: rel.description ?? "",
        });
      }
    }

    const suggested = await db
      .selectDistinct({ name: plants.name })
      .from(relationships)
      .innerJoin(plants, eq(relationships.targetId, plants.id))
      .where(
        and(
          inArray(relationships.plantId, ids),
          eq(relationships.type, "companion"),
          notInArray(relationships.targetId, ids),
        ),
      )
      .limit(8);
    suggestedCompanions.push(...suggested.map((s) => s.name));
  }

  const aiAdvice = await generateGardenAdvice(
    input.zip,
    input.soil,
    input.sun,
    input.plants,
    companions,
    antagonists,
    input.layoutAnalysis ?? null,
  );

  return {
    success: true,
    companions,
    antagonists,
    suggested_companions: suggestedCompanions,
    ai_advice: aiAdvice,
  };
}
