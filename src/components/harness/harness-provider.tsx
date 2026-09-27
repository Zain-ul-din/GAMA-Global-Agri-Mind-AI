"use client";
import type { GardenPolygon } from "@/lib/design/types";
import { createContext, useState, type ReactNode } from "react";

type HarnessContext = {
  polygons: GardenPolygon[];
  setPolygons: (polygons: GardenPolygon[]) => void;
};

export const HarnessContext = createContext<HarnessContext>({
  polygons: [],
  setPolygons: () => {},
});

export function HarnessProvider({ children }: { children: ReactNode }) {
  const [polygons, setPolygons] = useState<GardenPolygon[]>([]);

  return (
    <HarnessContext.Provider
      value={{
        polygons,
        setPolygons,
      }}
    >
      {children}
    </HarnessContext.Provider>
  );
}
