import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  calculateMetrics,
  fromFeet,
  generateLayout,
  movePlacedPlant,
  normalizeAllocations,
  resolveCapacity,
  selectPlant,
  toFeet,
} from "@/lib/design/engine";
import type { Plant } from "@/lib/design/types";

function plant(id: number, name: string, width = 1): Plant {
  return {
    id,
    name,
    scientificName: null,
    type: name.includes("Tree") ? "Tree" : "Vegetable",
    sunRequirements: "Full",
    waterRequirements: "Moderate",
    soilPreference: "Loam",
    usdaZones: "4,5,6,7",
    isNative: false,
    description: null,
    matureHeight: name.includes("Tree") ? 12 : 3,
    matureWidth: width,
    minRadius: width / 2,
    maxRadius: width / 2,
    foliageColor: null,
    canopyShape: null,
    fruitColor: null,
  };
}

describe("garden units and allocations", () => {
  it("round-trips dimensions", () => {
    expect(fromFeet(toFeet(10, "m"), "m")).toBeCloseTo(10);
  });

  it("normalizes active presets to exactly 100 percent", () => {
    const result = normalizeAllocations({
      pizza: 25,
      salad: 50,
      berry: 25,
      orchard: 0,
    });
    expect(result.pizza + result.salad + result.berry).toBe(100);
    expect(result.orchard).toBeUndefined();
  });
});

describe("capacity and placement", () => {
  it("scales quantities while preserving a manually selected plant", () => {
    const selected = [{ ...selectPlant(plant(1, "Tomato", 3)), quantity: 40 }];
    const result = resolveCapacity(selected, 10, 10, "scale-down");
    expect(result.selected[0].quantity).toBeGreaterThanOrEqual(1);
    expect(result.selected[0].quantity).toBeLessThan(40);
  });

  it("expands the plot when requested", () => {
    const selected = [
      { ...selectPlant(plant(1, "Apple Tree", 10)), quantity: 10 },
    ];
    const result = resolveCapacity(selected, 10, 10, "expand");
    expect(result.width * result.height).toBeGreaterThan(100);
  });

  it("places plants inside a traced polygon", () => {
    const selected = [{ ...selectPlant(plant(1, "Tomato", 1)), quantity: 8 }];
    const layout = generateLayout(
      selected,
      20,
      20,
      [
        {
          id: "zone",
          points: [
            { lat: 0, lng: 0 },
            { lat: 0, lng: 1 },
            { lat: 1, lng: 1 },
            { lat: 1, lng: 0 },
          ],
        },
      ],
      [],
      [],
      false,
    );
    expect(layout.placed).toHaveLength(8);
    expect(
      layout.placed.every(
        (item) => item.x >= 0 && item.x <= 20 && item.y >= 0 && item.y <= 20,
      ),
    ).toBe(true);
  });

  it("rejects a dragged collision", () => {
    const selected = [{ ...selectPlant(plant(1, "Tomato", 2)), quantity: 2 }];
    const layout = generateLayout(selected, 10, 10, [], [], [], false);
    const [first, second] = layout.placed;
    const moved = movePlacedPlant(layout, first.instanceId, second.x, second.y);
    expect(
      moved.placed.find((item) => item.instanceId === first.instanceId)?.x,
    ).toBe(first.x);
  });
});

describe("derived design output", () => {
  it("builds metrics and a calendar", () => {
    const selected = [
      selectPlant(plant(1, "Tomato", 2)),
      selectPlant(plant(2, "Gala Apple Tree", 8)),
    ];
    const layout = generateLayout(selected, 40, 40, [], [], [], true);
    const metrics = calculateMetrics(selected, layout, "Loam", "lbs");
    expect(metrics.placedPlants).toBe(layout.placed.length);
    expect(metrics.estimatedYield).toBeGreaterThan(0);
    expect(buildCalendar(selected)).toHaveLength(2);
  });
});
