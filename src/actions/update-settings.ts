"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { systemSettings } from "@/lib/db/schema";

export interface UpdateSettingsInput {
  map_provider: string;
  mapbox_token?: string | null;
  google_key?: string | null;
}

function isMaskedPlaceholder(value: string): boolean {
  return value.startsWith("***") || value.includes("...");
}

async function upsertSetting(key: string, value: string) {
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value } });
}

export async function updateSettings(input: UpdateSettingsInput) {
  if (!["osm", "mapbox", "google"].includes(input.map_provider)) {
    throw new Error("Invalid map provider value.");
  }

  await upsertSetting("map_provider", input.map_provider);

  // Never overwrite a stored secret with a masked placeholder from the client.
  if (input.mapbox_token != null) {
    if (input.mapbox_token === "") {
      await db
        .delete(systemSettings)
        .where(eq(systemSettings.key, "mapbox_token"));
    } else if (!isMaskedPlaceholder(input.mapbox_token)) {
      await upsertSetting("mapbox_token", input.mapbox_token);
    }
  }
  if (input.google_key != null) {
    if (input.google_key === "") {
      await db
        .delete(systemSettings)
        .where(eq(systemSettings.key, "google_key"));
    } else if (!isMaskedPlaceholder(input.google_key)) {
      await upsertSetting("google_key", input.google_key);
    }
  }

  return { status: "success", message: "Settings saved successfully." };
}
