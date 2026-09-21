import type { LayoutAnalysis } from "@/lib/ai";
import { GARDEN_PRESETS } from "@/lib/design/presets";
import type {
  AntagonistRef,
  CalendarEntry,
  CapacityMode,
  CompanionRef,
  DesignMetrics,
  DimensionUnit,
  GardenLayout,
  GardenPolygon,
  LayoutAlert,
  PlacedPlant,
  Plant,
  SelectedPlant,
  WeightUnit,
} from "@/lib/design/types";

const METERS_PER_FOOT = 0.3048;
const KG_PER_POUND = 0.453592;

export function toFeet(value: number, unit: DimensionUnit) {
  return unit === "m" ? value / METERS_PER_FOOT : value;
}

export function fromFeet(value: number, unit: DimensionUnit) {
  return unit === "m" ? value * METERS_PER_FOOT : value;
}

export function fromPounds(value: number, unit: WeightUnit) {
  return unit === "kg" ? value * KG_PER_POUND : value;
}

export function yieldPerPlant(plant: Pick<Plant, "name" | "type">) {
  const name = `${plant.name} ${plant.type}`.toLowerCase();
  if (name.includes("tree")) return 50;
  if (/zucchini|squash|pumpkin/.test(name)) return 10;
  if (/tomato|cucumber/.test(name)) return 15;
  if (/pepper|eggplant/.test(name)) return 8;
  if (name.includes("potato")) return 5;
  if (/basil|mint|herb/.test(name)) return 1;
  return 2;
}

export function plantDiameter(
  plant: Pick<
    Plant,
    "name" | "type" | "matureWidth" | "maxRadius" | "minRadius"
  >,
) {
  if (plant.matureWidth && plant.matureWidth > 0)
    return Math.max(0.5, plant.matureWidth);
  if (plant.maxRadius && plant.maxRadius > 0)
    return Math.max(0.5, plant.maxRadius * 2);
  if (plant.minRadius && plant.minRadius > 0)
    return Math.max(0.5, plant.minRadius * 2);
  const name = `${plant.name} ${plant.type}`.toLowerCase();
  if (name.includes("tree")) return 10;
  if (/berry|shrub/.test(name)) return 4;
  if (/squash|pumpkin|melon/.test(name)) return 3;
  if (/tomato|pepper|eggplant|broccoli|cabbage/.test(name)) return 2;
  return 1;
}

export function plantHeight(
  plant: Pick<Plant, "name" | "type" | "matureHeight">,
) {
  if (plant.matureHeight && plant.matureHeight > 0) return plant.matureHeight;
  const name = `${plant.name} ${plant.type}`.toLowerCase();
  if (name.includes("tree")) return 12;
  if (/sunflower|corn/.test(name)) return 7;
  if (/tomato|bean|pea/.test(name)) return 5;
  return 2;
}

export function plantColor(
  plant: Pick<Plant, "type" | "foliageColor" | "fruitColor">,
) {
  if (plant.foliageColor?.startsWith("#")) return plant.foliageColor;
  if (plant.fruitColor?.startsWith("#")) return plant.fruitColor;
  const type = plant.type.toLowerCase();
  if (type.includes("tree")) return "#166534";
  if (type.includes("flower")) return "#d97706";
  if (type.includes("fruit")) return "#dc2626";
  if (type.includes("root")) return "#a16207";
  if (type.includes("herb")) return "#059669";
  return "#16a34a";
}

export function defaultQuantity(plant: Plant) {
  const name = `${plant.name} ${plant.type}`.toLowerCase();
  if (name.includes("tree")) return 1;
  if (/zucchini|squash|pumpkin/.test(name)) return 4;
  return 6;
}

export function selectPlant(plant: Plant, manuallyAdded = true): SelectedPlant {
  return {
    ...plant,
    quantity: defaultQuantity(plant),
    yieldPerPlant: yieldPerPlant(plant),
    manuallyAdded,
  };
}

export function applyPresetAllocations(
  plants: Plant[],
  current: SelectedPlant[],
  allocations: Record<string, number>,
  widthFeet: number,
  heightFeet: number,
) {
  const manual = current.filter((item) => item.manuallyAdded);
  const selected = Object.entries(allocations).filter(
    ([, percent]) => percent > 0,
  );
  if (selected.length === 0) return manual;
  const denominator = Math.max(
    100,
    selected.reduce((sum, [, value]) => sum + value, 0),
  );
  const footprints = new Map<number, { plant: Plant; area: number }>();
  for (const [key, percent] of selected) {
    const preset = GARDEN_PRESETS.find((item) => item.key === key);
    if (!preset) continue;
    const presetArea = widthFeet * heightFeet * 0.8 * (percent / denominator);
    for (const crop of preset.crops) {
      const query = crop.query.toLowerCase();
      const match =
        plants.find((plant) => plant.name.toLowerCase() === query) ??
        plants.find((plant) => plant.name.toLowerCase().includes(query));
      if (!match) continue;
      const existing = footprints.get(match.id) ?? { plant: match, area: 0 };
      existing.area += presetArea * crop.weight;
      footprints.set(match.id, existing);
    }
  }
  const manualIds = new Set(manual.map((plant) => plant.id));
  const presetPlants = [...footprints.values()]
    .filter(({ plant }) => !manualIds.has(plant.id))
    .map(({ plant, area }) => ({
      ...selectPlant(plant, false),
      quantity: Math.max(1, Math.floor(area / plantDiameter(plant) ** 2)),
    }));
  return [...manual, ...presetPlants];
}

export function normalizeAllocations(allocations: Record<string, number>) {
  const active = Object.entries(allocations).filter(([, value]) => value > 0);
  if (active.length === 0) return allocations;
  const total = active.reduce((sum, [, value]) => sum + value, 0);
  let assigned = 0;
  const output: Record<string, number> = {};
  active.forEach(([key, value], index) => {
    const next =
      index === active.length - 1
        ? 100 - assigned
        : Math.round((value / total) * 100);
    output[key] = next;
    assigned += next;
  });
  return output;
}

export function resolveCapacity(
  selected: SelectedPlant[],
  width: number,
  height: number,
  mode: CapacityMode,
) {
  const required = selected.reduce(
    (sum, plant) => sum + plant.quantity * plantDiameter(plant) ** 2,
    0,
  );
  const target = width * height * 0.8;
  if (required <= target || mode === "warn")
    return { selected, width, height, overCapacity: required > target };
  if (mode === "scale-down") {
    const scale = target / required;
    return {
      selected: selected
        .map((plant) => ({
          ...plant,
          quantity: Math.max(
            plant.manuallyAdded ? 1 : 0,
            Math.floor(plant.quantity * scale),
          ),
        }))
        .filter((plant) => plant.quantity > 0),
      width,
      height,
      overCapacity: false,
    };
  }
  let nextWidth = width;
  let nextHeight = height;
  const maxDiameter = Math.max(...selected.map(plantDiameter), 1);
  nextWidth = Math.max(nextWidth, maxDiameter);
  nextHeight = Math.max(nextHeight, maxDiameter);
  while (nextWidth * nextHeight * 0.8 < required) {
    nextWidth += 2;
    nextHeight += 2;
  }
  return {
    selected,
    width: Math.ceil(nextWidth),
    height: Math.ceil(nextHeight),
    overCapacity: false,
  };
}

function normalizePolygons(polygons: GardenPolygon[]) {
  const points = polygons.flatMap((polygon) => polygon.points);
  if (points.length < 3) return [];
  const minLat = Math.min(...points.map((point) => point.lat));
  const maxLat = Math.max(...points.map((point) => point.lat));
  const minLng = Math.min(...points.map((point) => point.lng));
  const maxLng = Math.max(...points.map((point) => point.lng));
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  return polygons.map((polygon) =>
    polygon.points.map((point) => ({
      x: (point.lng - minLng) / lngRange,
      y: 1 - (point.lat - minLat) / latRange,
    })),
  );
}

function insidePolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[],
) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

function relationNames(
  refs: (CompanionRef | AntagonistRef)[],
  kind: "companion" | "antagonist",
) {
  const pairs = new Set<string>();
  for (const ref of refs) {
    const other =
      kind === "companion"
        ? (ref as CompanionRef).companion
        : (ref as AntagonistRef).antagonist;
    pairs.add(
      [ref.plant, other]
        .map((name) => name.toLowerCase())
        .sort()
        .join("|"),
    );
  }
  return pairs;
}

export function generateLayout(
  selected: SelectedPlant[],
  width: number,
  height: number,
  polygons: GardenPolygon[],
  companions: CompanionRef[],
  antagonists: AntagonistRef[],
  distributeEvenly: boolean,
): GardenLayout {
  const companionPairs = relationNames(companions, "companion");
  const antagonistPairs = relationNames(antagonists, "antagonist");
  const masks = normalizePolygons(polygons);
  const instances = selected
    .flatMap((plant) =>
      Array.from({ length: Math.min(plant.quantity, 5000) }, (_, index) => ({
        plant,
        index,
      })),
    )
    .sort((a, b) => plantDiameter(b.plant) - plantDiameter(a.plant));
  const placed: PlacedPlant[] = [];
  const unplaced: Record<string, number> = {};

  for (const { plant, index } of instances) {
    const diameter = Math.min(plantDiameter(plant), width, height);
    const radius = diameter / 2;
    const step = Math.max(
      0.5,
      Math.min(diameter, distributeEvenly ? diameter * 1.4 : diameter * 0.85),
    );
    let best: { x: number; y: number; score: number } | null = null;
    for (let y = radius; y <= height - radius; y += step) {
      for (let x = radius; x <= width - radius; x += step) {
        if (
          masks.length > 0 &&
          !masks.some((mask) =>
            insidePolygon({ x: x / width, y: y / height }, mask),
          )
        )
          continue;
        let valid = true;
        let score = y / Math.max(1, height);
        for (const other of placed) {
          const distance = Math.hypot(x - other.x, y - other.y);
          const minimum = (diameter + other.diameter) / 2;
          if (distance < minimum) {
            valid = false;
            break;
          }
          const pair = [plant.name, other.name]
            .map((name) => name.toLowerCase())
            .sort()
            .join("|");
          if (companionPairs.has(pair)) score -= 2 / Math.max(distance, 1);
          if (antagonistPairs.has(pair) && distance < minimum + 3) score += 20;
        }
        if (valid && (!best || score < best.score)) best = { x, y, score };
      }
    }
    if (!best) {
      unplaced[plant.name] = (unplaced[plant.name] ?? 0) + 1;
      continue;
    }
    placed.push({
      instanceId: `${plant.id}-${index}-${placed.length}`,
      plantId: plant.id,
      name: plant.name,
      type: plant.type,
      x: best.x,
      y: best.y,
      diameter,
      height: plantHeight(plant),
      color: plantColor(plant),
    });
  }
  return {
    width,
    height,
    placed,
    unplaced,
    generatedAt: new Date().toISOString(),
  };
}

export function movePlacedPlant(
  layout: GardenLayout,
  instanceId: string,
  x: number,
  y: number,
) {
  const target = layout.placed.find((plant) => plant.instanceId === instanceId);
  if (!target) return layout;
  const radius = target.diameter / 2;
  const boundedX = Math.max(radius, Math.min(layout.width - radius, x));
  const boundedY = Math.max(radius, Math.min(layout.height - radius, y));
  const collides = layout.placed.some(
    (plant) =>
      plant.instanceId !== instanceId &&
      Math.hypot(boundedX - plant.x, boundedY - plant.y) <
        (target.diameter + plant.diameter) / 2,
  );
  if (collides) return layout;
  return {
    ...layout,
    placed: layout.placed.map((plant) =>
      plant.instanceId === instanceId
        ? { ...plant, x: boundedX, y: boundedY }
        : plant,
    ),
  };
}

export function analyzeLayout(
  layout: GardenLayout,
  selected: SelectedPlant[],
  companions: CompanionRef[],
  antagonists: AntagonistRef[],
  soil: string,
  sun: string,
) {
  const alerts: LayoutAlert[] = [];
  const usedCompanions = new Set<string>();
  const realizedAntagonists = new Set<string>();
  const companionPairs = relationNames(companions, "companion");
  const antagonistPairs = relationNames(antagonists, "antagonist");
  for (let i = 0; i < layout.placed.length; i++) {
    const a = layout.placed[i];
    for (let j = i + 1; j < layout.placed.length; j++) {
      const b = layout.placed[j];
      const pair = [a.name, b.name]
        .map((name) => name.toLowerCase())
        .sort()
        .join("|");
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (
        companionPairs.has(pair) &&
        distance < (a.diameter + b.diameter) / 2 + 5
      )
        usedCompanions.add(`${a.name} + ${b.name}`);
      if (
        antagonistPairs.has(pair) &&
        distance < (a.diameter + b.diameter) / 2 + 3
      ) {
        realizedAntagonists.add(`${a.name} + ${b.name}`);
        alerts.push({
          id: `antagonist-${a.instanceId}-${b.instanceId}`,
          kind: "antagonist",
          message: `${a.name} and ${b.name} are too close.`,
          plantIds: [a.plantId, b.plantId],
        });
      }
    }
  }
  const soilMismatches = selected
    .filter(
      (plant) =>
        plant.soilPreference &&
        !plant.soilPreference.toLowerCase().includes(soil.toLowerCase()),
    )
    .map((plant) => plant.name);
  const sunMismatches = selected
    .filter(
      (plant) =>
        plant.sunRequirements &&
        !plant.sunRequirements.toLowerCase().includes(sun.toLowerCase()),
    )
    .map((plant) => plant.name);
  const shading = layout.placed
    .filter((plant) => plant.height >= 6 && plant.y > layout.height / 2)
    .map((plant) => plant.name);
  soilMismatches.forEach((name, index) => {
    alerts.push({
      id: `soil-${index}-${name}`,
      kind: "soil",
      message: `${name} may need a localized soil amendment.`,
      plantIds: [],
    });
  });
  sunMismatches.forEach((name, index) => {
    alerts.push({
      id: `sun-${index}-${name}`,
      kind: "sun",
      message: `${name} may not match the selected exposure.`,
      plantIds: [],
    });
  });
  if (shading.length > 0)
    alerts.push({
      id: "shade",
      kind: "shade",
      message: `Move tall crops north to reduce shade: ${[...new Set(shading)].join(", ")}.`,
      plantIds: [],
    });
  const analysis: LayoutAnalysis = {
    total_placed_instances: layout.placed.length,
    utilized_companions: [...usedCompanions],
    realized_antagonists: [...realizedAntagonists],
    soil_mismatches: [...new Set(soilMismatches)],
    sun_mismatches: [...new Set(sunMismatches)],
    shading_warnings: [...new Set(shading)],
  };
  return { alerts, analysis };
}

export function calculateMetrics(
  selected: SelectedPlant[],
  layout: GardenLayout,
  soil: string,
  weightUnit: WeightUnit,
): DesignMetrics {
  const totalArea = layout.width * layout.height;
  const occupied = layout.placed.reduce(
    (sum, plant) => sum + plant.diameter ** 2,
    0,
  );
  const estimatedPounds = selected.reduce(
    (sum, plant) => sum + plant.quantity * plant.yieldPerPlant,
    0,
  );
  const waterNeed = /sand|rocky/i.test(soil)
    ? "High"
    : /clay/i.test(soil)
      ? "Low"
      : "Moderate";
  return {
    totalArea,
    plantingArea: totalArea * 0.8,
    pathArea: totalArea * 0.2,
    requestedPlants: selected.reduce((sum, plant) => sum + plant.quantity, 0),
    placedPlants: layout.placed.length,
    estimatedYield: fromPounds(estimatedPounds, weightUnit),
    waterNeed,
    capacityPercent: Math.round(
      (occupied / Math.max(totalArea * 0.8, 1)) * 100,
    ),
  };
}

export function buildCalendar(selected: SelectedPlant[]): CalendarEntry[] {
  return selected.map((plant) => {
    const name = `${plant.name} ${plant.type}`.toLowerCase();
    const perennial = /tree|berry|perennial|shrub/.test(name);
    const root = /carrot|potato|beet|radish|onion/.test(name);
    return {
      plantId: plant.id,
      name: plant.name,
      segments: perennial
        ? [
            { phase: "Soil care" as const, startMonth: 1, endMonth: 2 },
            { phase: "Bloom" as const, startMonth: 3, endMonth: 5 },
            { phase: "Grow" as const, startMonth: 5, endMonth: 8 },
            { phase: "Harvest" as const, startMonth: 8, endMonth: 10 },
          ]
        : [
            {
              phase: "Sow" as const,
              startMonth: root ? 3 : 2,
              endMonth: root ? 4 : 3,
            },
            { phase: "Grow" as const, startMonth: 4, endMonth: 7 },
            { phase: "Bloom" as const, startMonth: 6, endMonth: 8 },
            { phase: "Harvest" as const, startMonth: 7, endMonth: 10 },
          ],
    };
  });
}
