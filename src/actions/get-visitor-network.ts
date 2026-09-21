"use server";

import { recordVisitorHit } from "@/actions/record-visitor-hit";
import { getVisitorStats } from "@/data/get-visitor-stats";
import type { AsyncResult, VisitorCountry } from "@/lib/design/types";

export async function recordAndGetVisitorNetwork(): Promise<
  AsyncResult<VisitorCountry[]>
> {
  try {
    await recordVisitorHit();
    return { ok: true, data: await getVisitorStats() };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Visitor network unavailable.",
    };
  }
}
