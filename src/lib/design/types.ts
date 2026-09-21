export type DimensionUnit = "ft" | "m";
export type WeightUnit = "lbs" | "kg";
export type ViewMode = "plan" | "three" | "satellite";
export type CapacityMode = "warn" | "scale-down" | "expand";

export interface Plant {
  id: number;
  name: string;
  scientificName: string | null;
  type: string;
  sunRequirements: string;
  waterRequirements: string;
  soilPreference: string;
  usdaZones: string;
  isNative: boolean;
  description: string | null;
  matureHeight: number | null;
  matureWidth: number | null;
  minRadius: number | null;
  maxRadius: number | null;
  foliageColor: string | null;
  canopyShape: string | null;
  fruitColor: string | null;
}

export interface SelectedPlant extends Plant {
  quantity: number;
  yieldPerPlant: number;
  manuallyAdded: boolean;
  zoneOverride?: string;
}

export interface GardenPoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GardenPolygon {
  id: string;
  points: GeoPoint[];
}

export interface GardenAnnotation {
  id: string;
  text: string;
  point: GeoPoint;
}

export interface PlacedPlant {
  instanceId: string;
  plantId: number;
  name: string;
  type: string;
  x: number;
  y: number;
  diameter: number;
  height: number;
  color: string;
}

export interface GardenLayout {
  width: number;
  height: number;
  placed: PlacedPlant[];
  unplaced: Record<string, number>;
  generatedAt: string;
}

export type AlertKind = "companion" | "antagonist" | "soil" | "sun" | "shade";

export interface LayoutAlert {
  id: string;
  kind: AlertKind;
  message: string;
  plantIds: number[];
}

export interface DesignMetrics {
  totalArea: number;
  plantingArea: number;
  pathArea: number;
  requestedPlants: number;
  placedPlants: number;
  estimatedYield: number;
  waterNeed: "Low" | "Moderate" | "High";
  capacityPercent: number;
}

export interface CalendarSegment {
  phase: "Sow" | "Grow" | "Bloom" | "Harvest" | "Soil care";
  startMonth: number;
  endMonth: number;
}

export interface CalendarEntry {
  plantId: number;
  name: string;
  segments: CalendarSegment[];
}

export interface CompanionRef {
  plant: string;
  companion: string;
  description: string;
}

export interface AntagonistRef {
  plant: string;
  antagonist: string;
  description: string;
}

export interface DesignResult {
  companions: CompanionRef[];
  antagonists: AntagonistRef[];
  suggestedCompanions: string[];
  aiAdvice: string;
}

export interface LocationSelection {
  name: string;
  lat: number;
  lng: number;
}

export interface DesignDraft {
  version: 1;
  zip: string;
  address: string;
  location: LocationSelection | null;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;
  weightUnit: WeightUnit;
  soil: string;
  sun: string;
  distributeEvenly: boolean;
  capacityMode: CapacityMode;
  selectedPlants: SelectedPlant[];
  presetAllocations: Record<string, number>;
  methodologies: string[];
  polygons: GardenPolygon[];
  annotations: GardenAnnotation[];
  layout: GardenLayout | null;
  alerts: LayoutAlert[];
  metrics: DesignMetrics | null;
  calendar: CalendarEntry[];
  result: DesignResult | null;
  viewMode: ViewMode;
}

export type AsyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface VisitorCountry {
  countryCode: string;
  countryName: string;
  visitCount: number | null;
}

export interface MapSettings {
  map_provider: string;
  mapbox_token: string;
  google_key: string;
  has_mapbox_token: boolean;
  has_google_key: boolean;
}
