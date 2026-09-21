"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { visitorCountries } from "@/lib/db/schema";

export interface VisitorHitInput {
  countryCode?: string;
  countryName?: string;
}

function isLocalIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
}

export async function recordVisitorHit(hit: VisitorHitInput = {}) {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  let code = "US";
  let name = "United States";

  if (!isLocalIp(clientIp)) {
    try {
      const res = await fetch(`https://freeipapi.com/api/json/${clientIp}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3_000),
      });
      if (res.ok) {
        const geo = (await res.json()) as {
          countryCode?: string;
          countryName?: string;
        };
        if (geo.countryCode && geo.countryName) {
          const c = geo.countryCode.trim().toUpperCase();
          const n = geo.countryName.trim();
          if (c && c !== "-") {
            code = c;
            name = n;
          }
        }
      }
    } catch (err) {
      console.error(
        `Server-side IP geolocation failed for ${clientIp}: ${err}`,
      );
      if (hit.countryCode && hit.countryName) {
        code = hit.countryCode.trim().toUpperCase();
        name = hit.countryName.trim();
      }
    }
  } else if (hit.countryCode && hit.countryName) {
    code = hit.countryCode.trim().toUpperCase();
    name = hit.countryName.trim();
  }

  code = code.trim().toUpperCase();
  name = name.trim();
  if (!code || !name) throw new Error("Country code and name are required");

  const existing = await db
    .select({ visitCount: visitorCountries.visitCount })
    .from(visitorCountries)
    .where(eq(visitorCountries.countryCode, code))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(visitorCountries)
      .set({ countryName: name })
      .where(eq(visitorCountries.countryCode, code));
    await db
      .update(visitorCountries)
      .set({ visitCount: (existing[0].visitCount ?? 0) + 1 })
      .where(eq(visitorCountries.countryCode, code));
  } else {
    await db
      .insert(visitorCountries)
      .values({ countryCode: code, countryName: name, visitCount: 1 });
  }

  return { status: "success", country_code: code };
}
