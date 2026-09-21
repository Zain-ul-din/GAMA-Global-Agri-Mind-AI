import type { DesignDraft } from "@/lib/design/types";

export const DESIGN_DRAFT_KEY = "gama.design-draft.v1";

export function createEmptyDraft(): DesignDraft {
  return {
    version: 1,
    zip: "",
    address: "",
    location: null,
    width: 20,
    height: 30,
    dimensionUnit: "ft",
    weightUnit: "lbs",
    soil: "Loam",
    sun: "Full",
    distributeEvenly: false,
    capacityMode: "expand",
    selectedPlants: [],
    presetAllocations: {},
    methodologies: [],
    polygons: [],
    annotations: [],
    layout: null,
    alerts: [],
    metrics: null,
    calendar: [],
    result: null,
    viewMode: "plan",
  };
}

export function restoreDraft(raw: string | null): DesignDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<DesignDraft>;
    if (value.version !== 1 || !Array.isArray(value.selectedPlants))
      return null;
    return { ...createEmptyDraft(), ...value } as DesignDraft;
  } catch {
    return null;
  }
}
