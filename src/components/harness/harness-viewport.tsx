"use client";
import { use } from "react";
import { SatelliteMap } from "./blocks/satellite-map";
import { HarnessContext } from "./harness-provider";

export function HarnessViewport() {
  const { polygons, setPolygons } = use(HarnessContext);

  return (
    <div className="w-full h-full">
      <SatelliteMap
        location={null}
        onPolygonsChange={setPolygons}
        polygons={polygons}
        onBoundsChange={() => {}}
        className="h-full w-full min-h-full"
      />
    </div>
  );
}
