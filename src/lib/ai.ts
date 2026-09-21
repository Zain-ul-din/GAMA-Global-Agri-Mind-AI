// Port of backend/app/services/ai.py — Gemini advice + offline rules-engine fallback.
// Plain shared module (no "use server"): imported by actions/* only.

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

export interface LayoutAnalysis {
  total_placed_instances?: number;
  utilized_companions?: string[];
  realized_antagonists?: string[];
  soil_mismatches?: string[];
  sun_mismatches?: string[];
  shading_warnings?: string[];
  tropical_potted_count?: number;
  zone_mismatches?: string[];
}

export interface CustomPlantInfo {
  scientific_name: string;
  type: string;
  sun_requirements: string;
  water_requirements: string;
  soil_preference: string;
  usda_zones: string;
  is_native: boolean;
  description: string;
  mature_height: number;
  mature_width: number;
  min_radius: number;
  max_radius: number;
  foliage_color: string;
  canopy_shape: string;
  fruit_color: string | null;
}

async function queryGemini(
  prompt: string,
  timeoutMs: number,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return body.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error(
      `Gemini API query failed (falling back to rules-engine): ${err}`,
    );
    return null;
  }
}

function fallbackAdvice(
  _zipCode: string,
  soil: string,
  _sun: string,
  plants: string[],
  _companions: CompanionRef[],
  _antagonists: AntagonistRef[],
  layout?: LayoutAnalysis | null,
): string {
  const realizedComp = layout?.utilized_companions ?? [];
  const realizedAntag = layout?.realized_antagonists ?? [];
  const soilMismatch = layout?.soil_mismatches ?? [];
  const shading = layout?.shading_warnings ?? [];
  const pottedCount = layout?.tropical_potted_count ?? 0;

  let layoutAdvice = "";
  if (realizedComp.length > 0) {
    layoutAdvice += `Your layout successfully utilized companion relationships like ${realizedComp.join(", ")} to boost ecological synergies. `;
  } else {
    layoutAdvice +=
      "We recommend adding companion pairings (such as Basil next to Tomatoes) to naturally enhance pest resistance. ";
  }
  if (realizedAntag.length > 0) {
    layoutAdvice += `WARNING: Active antagonist warnings detected: ${realizedAntag.join(", ")} are placed too close to each other. Consider adjusting their layout to reduce growth suppression. `;
  } else {
    layoutAdvice +=
      "Your layout successfully avoided any close antagonist proximity issues! ";
  }
  if (shading.length > 0) {
    layoutAdvice += `WARNING: Tall crops like ${shading.join(", ")} are placed on the Southern half of your garden, which will cast shade on smaller crops. Consider relocating them to the far North. `;
  } else {
    layoutAdvice +=
      "All tall crop varieties are positioned on the northern boundaries, maximizing sunlight exposure for lower-tier crops.";
  }

  const soilLow = soil.toLowerCase();
  let nutritionAdvice = `Your ${soilLow} soil needs structural attention. `;
  if (soilLow.includes("clay")) {
    nutritionAdvice +=
      "Clay retains water and nutrients well but compacts easily. Incorporate gypsum, coarse compost, and organic mulch to open up drainage. ";
  } else if (soilLow.includes("sand")) {
    nutritionAdvice +=
      "Sandy soil drains rapidly, leaching nutrients. Apply heavy compost, leaf mold, and kelp meal to increase organic binding capacity. ";
  } else {
    nutritionAdvice +=
      "Loamy soil is ideal but requires regular maintenance. Apply a 2-inch layer of rich vermicompost before planting. ";
  }
  if (soilMismatch.length > 0) {
    nutritionAdvice += `Crops like ${soilMismatch.join(", ")} prefer different soil textures. Supplement their specific planting zones with custom compost blends.`;
  }

  let pruningAdvice = "Pruning timelines vary by crop cycle. ";
  const annuals = plants.filter(
    (p) =>
      !p.toLowerCase().includes("tree") && !p.toLowerCase().includes("berry"),
  );
  const trees = plants.filter(
    (p) =>
      p.toLowerCase().includes("tree") ||
      p.toLowerCase().includes("chestnut") ||
      p.toLowerCase().includes("walnut"),
  );
  if (trees.length > 0) {
    pruningAdvice += `For perennial trees (${trees.join(", ")}), prune during late dormancy (winter) to stimulate spring growth. `;
  }
  if (annuals.length > 0) {
    pruningAdvice += `For annual crops like ${annuals.slice(0, 3).join(", ")}, pinch early blossoms to encourage root establishment, and prune lower suckers on nightshades.`;
  }

  let pestAdvice = "Ecological pest prevention is highly recommended. ";
  if (plants.length > 0) {
    pestAdvice += `For ${plants.slice(0, 3).join(", ")}, spray neem oil or horticultural soap at the first sign of aphids. Use companion barrier plantings to mask scents. `;
  }
  if (pottedCount > 0) {
    pestAdvice +=
      "Keep potted tropicals clear of indoor pests (spider mites) by washing leaves prior to overwintering.";
  }

  const rotationAdvice =
    `To maintain your ${soilLow} soil, plan a crop rotation. ` +
    "Follow heavy nitrogen consumers (like corn, brassicas, or nightshades) with nitrogen-fixing cover crops such as Crimson Clover or Hairy Vetch next spring to naturally revitalize the soil.";

  return `### Garden Layout Strategy
${layoutAdvice}

### Soil & Nutrition Plan
${nutritionAdvice}

### Crop Care & Pruning Calendar
${pruningAdvice}

### Pest & Disease Control
${pestAdvice}

### Rotational & Future Planning
${rotationAdvice}
`;
}

export async function generateGardenAdvice(
  zipCode: string,
  soil: string,
  sun: string,
  plants: string[],
  companions: CompanionRef[],
  antagonists: AntagonistRef[],
  layoutAnalysis?: LayoutAnalysis | null,
): Promise<string> {
  const statsDesc = layoutAnalysis
    ? `
Actual Layout Metrics & Statistics from Spaced Grid:
- Placed Instances Count: ${layoutAnalysis.total_placed_instances ?? 0}
- Realized Companion Pairings: ${layoutAnalysis.utilized_companions?.join(", ") || "None"}
- Realized Antagonist warnings (placed too close): ${layoutAnalysis.realized_antagonists?.join(", ") || "None"}
- Soil requirement mismatches: ${layoutAnalysis.soil_mismatches?.join(", ") || "None"}
- Sun requirement mismatches: ${layoutAnalysis.sun_mismatches?.join(", ") || "None"}
- Tall crops casting shade on South side: ${layoutAnalysis.shading_warnings?.join(", ") || "None"}
- Tropical potted plants needing overwintering: ${layoutAnalysis.tropical_potted_count ?? 0}
- USDA zone mismatches: ${layoutAnalysis.zone_mismatches?.join(", ") || "None"}
`
    : "";

  const prompt = `
You are an expert horticulturist and ecological designer. Analyze the following garden design request:
- ZIP Code: ${zipCode}
- Soil: ${soil}
- Sun: ${sun}
- Selected crops: ${plants.join(", ")}
- Identified companions in selection: ${companions.length > 0 ? companions.map((c) => `${c.plant} + ${c.companion}`).join(", ") : "None"}
- Identified antagonists/warnings in selection: ${antagonists.length > 0 ? antagonists.map((a) => `${a.plant} + ${a.antagonist}`).join(", ") : "None"}
${statsDesc}
Provide a structured, highly comprehensive growing system guide tailored exactly to the actual layout metrics. Address the specific crops placed. Use exactly these markdown headers:

### Garden Layout Strategy
Detail how the layout successfully resolved or failed companion spacing (e.g. mention realized companion pairs vs antagonist warnings). Specify if any tall crops are casting shade from the south side and how to optimize it.

### Soil & Nutrition Plan
Analyze the soil type (${soil}) and specify nutrition upgrades. Detail fertilizing advice for the placed annuals and soil amendments/compost for perennials.

### Crop Care & Pruning Calendar
Provide specific timelines and pruning guidelines for the placed trees/perennials vs annual crops.

### Pest & Disease Control
Recommend organic pest control methods and companion-repellent strategies tailored to these specific crops.

### Rotational & Future Planning
Provide cover crop and rotation recommendations for next season based on the placed heavy feeders.
`;

  const text = await queryGemini(prompt, 12_000);
  if (text) return text;
  return fallbackAdvice(
    zipCode,
    soil,
    sun,
    plants,
    companions,
    antagonists,
    layoutAnalysis,
  );
}

function heuristicPlantInfo(plantName: string): CustomPlantInfo {
  const nameLower = plantName.toLowerCase();
  let type = "Vegetable";
  let sun = "Full Sun";
  const water = "Moderate";
  const soil = "Loam";
  let zones = "3,4,5,6,7,8,9,10";

  const treeKeys = [
    "tree",
    "orchard",
    "chestnut",
    "walnut",
    "pecan",
    "hazelnut",
    "oak",
    "maple",
    "pine",
    "cedar",
    "elm",
    "birch",
    "willow",
    "fir",
    "spruce",
    "cypress",
    "redwood",
    "beech",
    "ash",
    "poplar",
    "hickory",
    "alder",
    "linden",
    "paulownia",
    "cherry blossom",
    "magnolia",
    "dogwood",
    "cherry",
    "peach",
    "apple",
    "pear",
    "plum",
    "apricot",
    "fig",
    "persimmon",
    "mulberry",
    "quince",
    "elderberry",
    "citrus",
    "lemon",
    "lime",
    "orange",
    "grapefruit",
    "tangerine",
    "mandarin",
    "almond",
    "filbert",
    "ginkgo",
    "juneberry",
    "serviceberry",
    "pawpaw",
    "paw paw",
  ];
  const tropicalKeys = [
    "betel",
    "areca",
    "citrus",
    "lemon",
    "lime",
    "orange",
    "palm",
    "banana",
    "mango",
    "avocado",
    "pomegranate",
    "hibiscus",
    "ginger",
    "jasmine",
    "olive",
    "fig",
    "tropical",
  ];
  const has = (keys: string[]) => keys.some((k) => nameLower.includes(k));

  if (has(tropicalKeys)) {
    zones = "10,11";
    if (
      nameLower.includes("tree") ||
      nameLower.includes("palm") ||
      nameLower.includes("citrus") ||
      nameLower.includes("nut")
    ) {
      type = "Fruit Tree";
    }
  } else if (has(treeKeys)) {
    type = "Fruit Tree";
    zones = "4,5,6,7,8,9";
  } else if (
    has([
      "berry",
      "strawberry",
      "raspberry",
      "blackberry",
      "blueberry",
      "cranberry",
      "gooseberry",
      "currant",
      "boysenberry",
      "huckleberry",
      "marionberry",
      "lingonberry",
    ])
  ) {
    type = "Berry";
    zones = "3,4,5,6,7,8";
  } else if (
    has([
      "flower",
      "rose",
      "marigold",
      "sunflower",
      "daisy",
      "nasturtium",
      "tulip",
      "daffodil",
      "dahlia",
      "peony",
      "lavender",
      "echinacea",
      "zinnia",
      "cosmos",
      "petunia",
      "pansy",
      "lilac",
    ])
  ) {
    type = "Flower";
  } else if (
    has([
      "herb",
      "basil",
      "mint",
      "thyme",
      "oregano",
      "parsley",
      "sage",
      "rosemary",
      "cilantro",
      "coriander",
      "dill",
      "chives",
      "tarragon",
      "marjoram",
      "lavender",
      "chamomile",
      "fennel",
      "lemon verbena",
    ])
  ) {
    type = "Herb";
    sun = "Full Sun, Partial Shade";
  } else if (
    has([
      "grass",
      "clover",
      "goldenrod",
      "milkweed",
      "native",
      "fern",
      "moss",
      "sedge",
      "rush",
      "wildflower",
    ])
  ) {
    type = "Native";
    zones = "3,4,5,6,7,8,9";
  }

  let height = 1.0;
  let width = 1.0;
  let minRad = 0.4;
  let maxRad = 0.8;
  let foliageColor = "#2e7d32";
  let canopyShape = "rounded";
  let fruitColor: string | null = null;

  if (nameLower.includes("paulownia")) {
    type = "Fruit Tree";
    height = 40.0;
    width = 30.0;
    minRad = 12.0;
    maxRad = 15.0;
    foliageColor = "#4a7c59";
  } else if (
    ["chestnut", "walnut", "oak", "maple", "pecan"].some((k) =>
      nameLower.includes(k),
    )
  ) {
    type = "Fruit Tree";
    height = 35.0;
    width = 25.0;
    minRad = 10.0;
    maxRad = 12.5;
    foliageColor = "#3b7a57";
  } else if (
    nameLower.includes("tree") ||
    type.toLowerCase() === "fruit tree" ||
    has(treeKeys)
  ) {
    height = 15.0;
    width = 8.0;
    minRad = 3.0;
    maxRad = 5.0;
    foliageColor = "#3b7a57";
    if (nameLower.includes("apple")) fruitColor = "#ef4444";
    else if (nameLower.includes("orange") || nameLower.includes("citrus"))
      fruitColor = "#f97316";
    else if (nameLower.includes("lemon")) fruitColor = "#eab308";
    else if (nameLower.includes("peach")) fruitColor = "#fca5a5";
    else if (nameLower.includes("pear")) fruitColor = "#84cc16";
    else if (nameLower.includes("cherry")) fruitColor = "#be123c";
  } else if (
    [
      "tomato",
      "cucumber",
      "pepper",
      "eggplant",
      "bean",
      "pea",
      "melon",
      "watermelon",
    ].some((k) => nameLower.includes(k))
  ) {
    height = 6.0;
    width = 3.0;
    minRad = 1.0;
    maxRad = 2.0;
    foliageColor = "#4f825d";
    if (nameLower.includes("tomato")) fruitColor = "#ef4444";
    else if (nameLower.includes("pepper")) fruitColor = "#f59e0b";
    else if (nameLower.includes("eggplant")) fruitColor = "#581c87";
    else if (nameLower.includes("cucumber")) fruitColor = "#15803d";
  } else if (
    ["squash", "zucchini", "pumpkin"].some((k) => nameLower.includes(k))
  ) {
    height = 1.2;
    width = 4.0;
    minRad = 1.5;
    maxRad = 2.5;
    foliageColor = "#1b4332";
  } else if (
    [
      "potato",
      "okra",
      "broccoli",
      "cauliflower",
      "lavender",
      "rosemary",
      "sunflower",
      "marigold",
      "nasturtium",
      "flower",
    ].some((k) => nameLower.includes(k))
  ) {
    if (nameLower.includes("sunflower")) {
      height = 8.0;
      width = 4.0;
      minRad = 1.5;
      maxRad = 2.5;
      fruitColor = "#eab308";
      canopyShape = "columnar";
    } else if (nameLower.includes("lavender")) {
      height = 3.0;
      width = 2.0;
      minRad = 0.8;
      maxRad = 1.5;
      fruitColor = "#a855f7";
      canopyShape = "vase";
    } else {
      height = 3.0;
      width = 2.0;
      minRad = 0.8;
      maxRad = 1.5;
      if (nameLower.includes("marigold")) fruitColor = "#f59e0b";
      else if (nameLower.includes("nasturtium")) fruitColor = "#ea580c";
    }
  }

  return {
    scientific_name: `${plantName.charAt(0).toUpperCase() + plantName.slice(1).toLowerCase()} vulgaris`,
    type,
    sun_requirements: sun,
    water_requirements: water,
    soil_preference: soil,
    usda_zones: zones,
    is_native: type === "Native",
    description: `A newly added custom variety of ${type.toLowerCase()} (${plantName}) tailored for your local zone.`,
    mature_height: height,
    mature_width: width,
    min_radius: minRad,
    max_radius: maxRad,
    foliage_color: foliageColor,
    canopy_shape: canopyShape,
    fruit_color: fruitColor,
  };
}

export async function generateCustomPlantInfo(
  plantName: string,
): Promise<CustomPlantInfo> {
  const prompt = `
You are a botanical database expert. Provide structured JSON metadata for a plant/crop named "${plantName}".
The JSON MUST follow this exact schema:
{
    "scientific_name": "binomial scientific nomenclature",
    "type": "Must be exactly one of: Vegetable, Herb, Fruit Tree, Flower, Berry, Native, or Grain",
    "sun_requirements": "e.g. Full Sun, Partial Shade, Shade",
    "water_requirements": "e.g. Low, Moderate, High",
    "soil_preference": "e.g. Loam, Clay, Sand, Silt, Chalky",
    "usda_zones": "comma-separated list of compatible USDA zone numbers, e.g. '3,4,5,6,7,8,9'",
    "is_native": 0 or 1,
    "description": "A 1-2 sentence overview of its growth characteristics",
    "mature_height": estimated mature growth height in feet as a float/number (e.g. 15.0 for tree, 6.0 for tomato, 1.0 for greens),
    "mature_width": estimated mature growth spread/diameter in feet as a float/number (e.g. 8.0 for tree, 3.0 for tomato, 1.0 for greens),
    "min_radius": estimated minimum spacing requirement/radius in feet as a float/number (e.g. 3.0 for tree, 1.0 for tomato, 0.4 for greens),
    "max_radius": estimated maximum spacing requirement/radius in feet as a float/number (e.g. 5.0 for tree, 2.0 for tomato, 0.8 for greens),
    "foliage_color": "hex color code representing its leaves (e.g. #2e7d32)",
    "canopy_shape": "canopy growth habit, must be exactly one of: rounded, conical, weeping, columnar, vase, or spreading",
    "fruit_color": "hex color code representing its fruit/bloom, or null if not applicable"
}
Return ONLY the raw JSON string. Do not wrap in markdown backticks or enclose in conversational text.
`;

  const text = await queryGemini(prompt, 10_000);
  if (text) {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        const lines = cleaned.split("\n");
        if (lines[0].startsWith("```")) lines.shift();
        if (lines.length > 0 && lines[lines.length - 1].startsWith("```"))
          lines.pop();
        cleaned = lines.join("\n").trim();
      }
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const nameLower = plantName.toLowerCase();
      const isTropical = [
        "betel",
        "areca",
        "citrus",
        "lemon",
        "lime",
        "orange",
        "palm",
        "banana",
        "mango",
        "avocado",
        "pomegranate",
        "hibiscus",
        "ginger",
        "jasmine",
        "olive",
        "fig",
        "tropical",
      ].some((k) => nameLower.includes(k));
      if (isTropical) {
        parsed.usda_zones = "10,11";
        if (
          ["tree", "palm", "citrus", "nut"].some((k) => nameLower.includes(k))
        )
          parsed.type = "Fruit Tree";
      }
      return {
        scientific_name: String(
          parsed.scientific_name ?? `${plantName} vulgaris`,
        ),
        type: String(parsed.type ?? "Vegetable"),
        sun_requirements: String(parsed.sun_requirements ?? "Full Sun"),
        water_requirements: String(parsed.water_requirements ?? "Moderate"),
        soil_preference: String(parsed.soil_preference ?? "Loam"),
        usda_zones: String(parsed.usda_zones ?? "3,4,5,6,7,8,9,10"),
        is_native: parsed.is_native === 1 || parsed.is_native === true,
        description: String(parsed.description ?? ""),
        mature_height: Number(parsed.mature_height ?? 1.0),
        mature_width: Number(parsed.mature_width ?? 1.0),
        min_radius: Number(parsed.min_radius ?? 0.4),
        max_radius: Number(parsed.max_radius ?? 0.8),
        foliage_color: String(parsed.foliage_color ?? "#2e7d32"),
        canopy_shape: String(parsed.canopy_shape ?? "rounded"),
        fruit_color:
          parsed.fruit_color == null ? null : String(parsed.fruit_color),
      };
    } catch (err) {
      console.error(`Gemini custom plant lookup failed: ${err}`);
    }
  }

  return heuristicPlantInfo(plantName);
}
