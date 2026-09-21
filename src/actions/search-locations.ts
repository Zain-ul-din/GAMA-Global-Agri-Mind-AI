"use server";

import { getGeocode } from "@/data/get-geocode";
import type { AsyncResult, LocationSelection } from "@/lib/design/types";

export async function searchLocations(
  query: string,
): Promise<AsyncResult<LocationSelection[]>> {
  const clean = query.trim();
  if (clean.length < 3)
    return { ok: false, error: "Enter at least three characters." };
  try {
    return { ok: true, data: await getGeocode(clean) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Location search failed.",
    };
  }
}
