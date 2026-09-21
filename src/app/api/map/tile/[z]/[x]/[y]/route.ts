import { db } from "@/lib/db/client";
import { systemSettings } from "@/lib/db/schema";

async function getSecretKeys(): Promise<Record<string, string>> {
  const rows = await db.select().from(systemSettings);
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

async function fetchBuffer(
  url: string,
  timeoutMs: number,
): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "global-agri-mind-ai/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Upstream responded with ${res.status}`);
  return res.arrayBuffer();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await params;
  const zi = Number(z);
  const xi = Number(x);
  const yi = Number(y);
  if (![zi, xi, yi].every((n) => Number.isInteger(n) && n >= 0)) {
    return Response.json(
      { error: "Tile coordinates must be non-negative integers." },
      { status: 400 },
    );
  }

  const settings = await getSecretKeys();
  const provider = settings.map_provider ?? "osm";

  if (provider === "mapbox" && settings.mapbox_token) {
    try {
      const buf = await fetchBuffer(
        `https://api.mapbox.com/v4/mapbox.satellite/${zi}/${xi}/${yi}.png?access_token=${settings.mapbox_token}`,
        5_000,
      );
      return new Response(buf, { headers: { "Content-Type": "image/png" } });
    } catch {
      // Fall through to Esri
    }
  }

  // Google provider falls back to Esri for stability (mirrors backend).
  try {
    const buf = await fetchBuffer(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zi}/${yi}/${xi}`,
      5_000,
    );
    return new Response(buf, { headers: { "Content-Type": "image/jpeg" } });
  } catch (err) {
    return Response.json(
      { error: `Tile service unavailable: ${String(err)}` },
      { status: 502 },
    );
  }
}
