import { db } from "@/lib/db/client";
import { systemSettings } from "@/lib/db/schema";

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "global-agri-mind-ai/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Geocoder responded with ${res.status}`);
  return res.json() as Promise<unknown>;
}

export async function getGeocode(query: string): Promise<GeocodeResult[]> {
  if (!query) throw new Error("Query string 'q' is required.");

  const rows = await db.select().from(systemSettings);
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  const provider = settings.map_provider ?? "osm";

  if (provider === "mapbox" && settings.mapbox_token) {
    try {
      const data = (await fetchJson(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${settings.mapbox_token}&limit=5`,
        5_000,
      )) as {
        features?: {
          geometry?: { coordinates?: [number, number] };
          properties?: { full_address?: string; name?: string };
        }[];
      };
      return (data.features ?? []).map((feat) => {
        const coords = feat.geometry?.coordinates ?? [0, 0];
        return {
          name: feat.properties?.full_address ?? feat.properties?.name ?? query,
          lat: coords[1],
          lng: coords[0],
        };
      });
    } catch {
      // Fall through to Nominatim
    }
  }

  if (provider === "google" && settings.google_key) {
    try {
      const data = (await fetchJson(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${settings.google_key}`,
        5_000,
      )) as {
        results?: {
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        }[];
      };
      return (data.results ?? []).map((item) => ({
        name: item.formatted_address ?? query,
        lat: item.geometry?.location?.lat ?? 0,
        lng: item.geometry?.location?.lng ?? 0,
      }));
    } catch {
      // Fall through to Nominatim
    }
  }

  try {
    const data = (await fetchJson(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      5_000,
    )) as { display_name?: string; lat?: string; lon?: string }[];
    return data.map((item) => ({
      name: item.display_name ?? query,
      lat: Number(item.lat ?? 0),
      lng: Number(item.lon ?? 0),
    }));
  } catch (err) {
    throw new Error(`Geocoding service unavailable: ${String(err)}`);
  }
}
