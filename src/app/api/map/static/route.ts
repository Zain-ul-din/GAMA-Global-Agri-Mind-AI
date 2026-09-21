import { db } from "@/lib/db/client";
import { systemSettings } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");
  if (!bbox)
    return Response.json(
      { error: "Query string 'bbox' is required." },
      { status: 400 },
    );

  // Esri export service size limit is 2048. Clamp like the backend.
  const width = Math.min(
    2048,
    Math.max(64, Number(searchParams.get("width")) || 64),
  );
  const height = Math.min(
    2048,
    Math.max(64, Number(searchParams.get("height")) || 64),
  );

  const rows = await db.select().from(systemSettings);
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  const provider = settings.map_provider ?? "osm";

  const url =
    provider === "mapbox" && settings.mapbox_token
      ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${bbox}]/${width}x${height}?access_token=${settings.mapbox_token}`
      : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=${width},${height}&format=png&f=image`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "global-agri-mind-ai/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Upstream responded with ${res.status}`);
    return new Response(await res.arrayBuffer(), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    return Response.json(
      { error: `Static map fetch failed: ${String(err)}` },
      { status: 502 },
    );
  }
}
