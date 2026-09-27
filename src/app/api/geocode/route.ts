import { getGeocode } from "@/data/get-geocode";

interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

async function geoapifySearch(
  key: string,
  query: string,
): Promise<LocationResult[]> {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&format=json&limit=5&lang=en&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "global-agri-mind-ai/1.0" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok)
    throw new Error(
      res.status === 401
        ? "Geoapify rejected the API key."
        : `Geoapify responded with ${res.status}`,
    );
  const data = (await res.json()) as {
    results?: { formatted?: string; lat?: number; lon?: number }[];
  };
  return (data.results ?? []).map((item) => ({
    name: item.formatted ?? query,
    lat: item.lat ?? 0,
    lng: item.lon ?? 0,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (query.length < 3)
    return Response.json(
      { error: "Query string 'q' must be at least three characters." },
      { status: 400 },
    );

  try {
    const key = process.env.GEOAPIFY_API_KEY;
    const results = key
      ? await geoapifySearch(key, query)
      : await getGeocode(query);
    return Response.json({ results, source: key ? "geoapify" : "osm" });
  } catch (err) {
    return Response.json(
      { error: `Location search failed: ${String(err)}` },
      { status: 502 },
    );
  }
}
