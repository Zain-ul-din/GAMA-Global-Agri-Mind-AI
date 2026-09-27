"use client";
import type { GardenPolygon } from "@/lib/design/types";
import { createContext, useState, type ReactNode } from "react";

type LocationCoord = { lat: number; lng: number };

type HarnessContext = {
  polygons: GardenPolygon[];
  setPolygons: (polygons: GardenPolygon[]) => void;
  selectedLocation: LocationCoord | null;
  setSelectedLocation: (coord: LocationCoord) => void;
};

export const HarnessContext = createContext<HarnessContext>({
  polygons: [],
  setPolygons: () => {},
  selectedLocation: null,
  setSelectedLocation: () => {},
});

export function HarnessProvider({ children }: { children: ReactNode }) {
  const [polygons, setPolygons] = useState<GardenPolygon[]>([]);

  const [selectedLocation, setSelectedLocation] =
    useState<LocationCoord | null>(null);

  return (
    <HarnessContext.Provider
      value={{
        polygons,
        setPolygons,
        selectedLocation,
        setSelectedLocation,
      }}
    >
      {children}
    </HarnessContext.Provider>
  );
}
