import { db } from "@/lib/db/client";
import { systemSettings } from "@/lib/db/schema";

function maskKey(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export async function getSettings() {
  const rows = await db.select().from(systemSettings);
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;

  return {
    map_provider: settings.map_provider ?? "osm",
    mapbox_token: maskKey(settings.mapbox_token),
    google_key: maskKey(settings.google_key),
    has_mapbox_token: Boolean(settings.mapbox_token),
    has_google_key: Boolean(settings.google_key),
  };
}
