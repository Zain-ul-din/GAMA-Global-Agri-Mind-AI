import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { visitorCountries } from "@/lib/db/schema";

export async function getVisitorStats() {
  return db
    .select()
    .from(visitorCountries)
    .orderBy(desc(visitorCountries.visitCount));
}
