import { DesignStudio } from "@/components/design/design-studio";
import { getPlants } from "@/data/get-plants";
import { getSettings } from "@/data/get-settings";
import { getVisitorStats } from "@/data/get-visitor-stats";

export const dynamic = "force-dynamic";

export default async function DesignPage() {
  const [plants, settings, visitors] = await Promise.all([
    getPlants(),
    getSettings(),
    getVisitorStats(),
  ]);
  return (
    <DesignStudio
      initialPlants={plants}
      initialSettings={settings}
      initialVisitors={visitors}
    />
  );
}
