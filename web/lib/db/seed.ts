import { db } from "./client";
import { plants, relationships } from "./schema";

// Port of database/seed.py — builds the ~227-plant catalog plus the
// companion/antagonist graph. Run via `pnpm db:seed` (fresh clones need
// this after `db:push`/`db:migrate`; it replaces all plants + relationships).

interface BasePlant {
  name: string;
  scientificName: string;
  type: string;
  sunRequirements: string;
  waterRequirements: string;
  soilPreference: string;
  usdaZones: string;
  isNative: boolean;
  description: string;
}

type Template = [string, string, string, string, string, string, string[]];

const VEGETABLES: Template[] = [
  [
    "Tomato",
    "Solanum lycopersicum",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10,11",
    [
      "Beefsteak",
      "Roma",
      "Cherry",
      "Heirloom",
      "Early Girl",
      "San Marzano",
      "Yellow Pear",
      "Brandywine",
      "Celebrity",
      "Cherokee Purple",
    ],
  ],
  [
    "Pepper",
    "Capsicum annuum",
    "Full",
    "Moderate",
    "Loam",
    "4,5,6,7,8,9,10,11",
    [
      "Bell",
      "Jalapeno",
      "Habanero",
      "Cayenne",
      "Serrano",
      "Poblano",
      "Banana",
      "Shishito",
      "Ghost",
      "Thai Chili",
    ],
  ],
  [
    "Squash",
    "Cucurbita pepo",
    "Full",
    "Moderate",
    "Loam, Clay",
    "3,4,5,6,7,8,9,10",
    [
      "Zucchini",
      "Yellow",
      "Butternut",
      "Spaghetti",
      "Acorn",
      "Kabocha",
      "Delicata",
      "Pattypan",
    ],
  ],
  [
    "Potato",
    "Solanum tuberosum",
    "Full",
    "Moderate",
    "Sand, Loam",
    "3,4,5,6,7,8,9,10",
    [
      "Russet",
      "Yukon Gold",
      "Red Pontiac",
      "Sweet",
      "Fingerling",
      "Kennebec",
      "Purple Majesty",
    ],
  ],
  [
    "Onion",
    "Allium cepa",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9",
    ["Red", "Yellow", "White", "Sweet", "Shallot", "Green", "Leek"],
  ],
  [
    "Carrot",
    "Daucus carota",
    "Full",
    "Moderate",
    "Sand, Loam",
    "3,4,5,6,7,8,9,10",
    ["Nantes", "Danvers", "Imperator", "Chantenay", "Rainbow", "Parisian"],
  ],
  [
    "Lettuce",
    "Lactuca sativa",
    "Partial, Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Romaine", "Butterhead", "Iceberg", "Loose Leaf", "Oakleaf", "Arugula"],
  ],
  [
    "Cabbage",
    "Brassica oleracea var. capitata",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Red capitata", "Green capitata", "Savoy capitata", "Napa", "Bok Choy"],
  ],
  [
    "Cucumber",
    "Cucumis sativus",
    "Full",
    "High",
    "Loam",
    "4,5,6,7,8,9,10,11",
    ["Slicing", "Pickling", "English", "Lemon", "Armenian", "Persian"],
  ],
  [
    "Bean",
    "Phaseolus vulgaris",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Green Bush", "Pole", "Lima", "Fava", "Black", "Kidney", "Pinto"],
  ],
  [
    "Pea",
    "Pisum sativum",
    "Full, Partial",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9",
    ["Sugar Snap", "Snow", "Garden", "Sweet Pea", "Chickpea"],
  ],
  [
    "Radish",
    "Raphanus sativus",
    "Full, Partial",
    "Moderate",
    "Sand, Loam",
    "2,3,4,5,6,7,8,9,10",
    [
      "Cherry Belle",
      "French Breakfast",
      "Daikon",
      "Watermelon",
      "Black Spanish",
    ],
  ],
  [
    "Beet",
    "Beta vulgaris",
    "Full, Partial",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Detroit Dark Red", "Golden", "Chioggia", "Sugar", "Bull's Blood"],
  ],
  [
    "Broccoli",
    "Brassica oleracea var. italica",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Calabrese", "Di Cicco", "Waltham 29", "Purple Sprouting"],
  ],
  [
    "Cauliflower",
    "Brassica oleracea var. botrytis",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Snowball Y", "Purple Graffiti", "Cheddar Yellow", "Romanesco"],
  ],
  [
    "Okra",
    "Abelmoschus esculentus",
    "Full",
    "Moderate",
    "Loam, Sand",
    "5,6,7,8,9,10,11",
    ["Clemson Spineless", "Red Burgundy", "Emerald"],
  ],
  [
    "Spinach",
    "Spinacia oleracea",
    "Partial, Full",
    "Moderate",
    "Loam",
    "2,3,4,5,6,7,8,9,10",
    ["Bloomsdale Long Standing", "Baby Leaf", "Giant Nobel"],
  ],
];

const HERBS: Template[] = [
  [
    "Basil",
    "Ocimum basilicum",
    "Full",
    "Moderate",
    "Loam",
    "4,5,6,7,8,9,10,11",
    ["Sweet", "Genovese", "Thai", "Lemon", "Purple Ruffles", "Holy"],
  ],
  [
    "Mint",
    "Mentha",
    "Partial, Shade",
    "High",
    "Clay, Loam",
    "3,4,5,6,7,8,9,10,11",
    ["Spearmint", "Peppermint", "Chocolate", "Apple", "Orange"],
  ],
  [
    "Sage",
    "Salvia officinalis",
    "Full",
    "Low",
    "Sand, Loam",
    "4,5,6,7,8,9,10",
    ["Garden", "Pineapple", "Purple", "Tricolor", "White"],
  ],
  [
    "Thyme",
    "Thymus vulgaris",
    "Full",
    "Low",
    "Sand",
    "3,4,5,6,7,8,9,10",
    ["Common", "Lemon", "Creeping", "Elfin"],
  ],
  [
    "Rosemary",
    "Salvia rosmarinus",
    "Full",
    "Low",
    "Sand",
    "6,7,8,9,10,11",
    ["Tuscan Blue", "Prostrate", "Arp", "Gorizia"],
  ],
  [
    "Lavender",
    "Lavandula",
    "Full",
    "Low",
    "Sand",
    "5,6,7,8,9,10",
    ["English", "French", "Spanish", "Munstead"],
  ],
  [
    "Oregano",
    "Origanum vulgare",
    "Full",
    "Low",
    "Sand, Loam",
    "4,5,6,7,8,9,10",
    ["Greek", "Italian", "Syrian", "Golden"],
  ],
  [
    "Parsley",
    "Petroselinum crispum",
    "Full, Partial",
    "Moderate",
    "Loam",
    "4,5,6,7,8,9,10",
    ["Flat-leaf Italian", "Curly-leaf", "Hamburg Root"],
  ],
  [
    "Cilantro",
    "Coriandrum sativum",
    "Full, Partial",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Coriander Cilantro", "Slo-Bolt"],
  ],
  [
    "Dill",
    "Anethum graveolens",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9,10,11",
    ["Bouquet", "Mammoth Long Island", "Fernleaf"],
  ],
];

const FRUITS: Template[] = [
  [
    "Apple Tree",
    "Malus domestica",
    "Full",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8,9",
    [
      "Honeycrisp",
      "Gala",
      "Fuji",
      "Granny Smith",
      "Pink Lady",
      "McIntosh",
      "Golden Delicious",
    ],
  ],
  [
    "Peach Tree",
    "Prunus persica",
    "Full",
    "Moderate",
    "Sand, Loam",
    "5,6,7,8,9",
    ["Elberta", "Redhaven", "Georgia Belle", "Reliance"],
  ],
  [
    "Strawberry",
    "Fragaria x ananassa",
    "Full",
    "High",
    "Loam",
    "3,4,5,6,7,8,9,10",
    ["Albion", "Chandler", "Eversweet", "Seascape", "Ozark Beauty"],
  ],
  [
    "Blueberry",
    "Vaccinium corymbosum",
    "Full, Partial",
    "High",
    "Sand, Loam",
    "3,4,5,6,7,8",
    ["Duke", "Bluecrop", "Patriot", "Jersey", "Pink Lemonade"],
  ],
  [
    "Raspberry",
    "Rubus idaeus",
    "Full, Partial",
    "Moderate",
    "Loam",
    "3,4,5,6,7,8",
    ["Heritage", "Caroline", "Fall Gold", "Latham"],
  ],
  [
    "Cherry Tree",
    "Prunus avium",
    "Full",
    "Moderate",
    "Loam",
    "4,5,6,7,8,9",
    ["Bing", "Rainier", "Black Tartarian", "Montmorency"],
  ],
  [
    "Pear Tree",
    "Pyrus communis",
    "Full",
    "Moderate",
    "Loam, Clay",
    "4,5,6,7,8,9",
    ["Bartlett", "Bosc", "D'Anjou", "Shinseiki Asian"],
  ],
  [
    "Grapevine",
    "Vitis",
    "Full",
    "Moderate",
    "Sand, Loam",
    "4,5,6,7,8,9,10",
    ["Concord", "Thompson Seedless", "Cabernet Sauvignon", "Flame Seedless"],
  ],
  [
    "Watermelon",
    "Citrullus lanatus",
    "Full",
    "Moderate",
    "Sand, Loam",
    "4,5,6,7,8,9,10,11",
    ["Sugar Baby", "Crimson Sweet", "Charleston Gray", "Jubilee"],
  ],
  [
    "Lemon Tree",
    "Citrus limon",
    "Full",
    "Moderate",
    "Loam, Sand",
    "9,10,11",
    ["Meyer", "Eureka", "Lisbon"],
  ],
  [
    "Orange Tree",
    "Citrus sinensis",
    "Full",
    "Moderate",
    "Loam, Sand",
    "9,10,11",
    ["Navel", "Valencia", "Blood Orange"],
  ],
];

type NativeTemplate = [
  string,
  string,
  string,
  string,
  string,
  string,
  boolean,
  string[],
];

const NATIVES: NativeTemplate[] = [
  [
    "Coneflower",
    "Echinacea purpurea",
    "Full, Partial",
    "Low",
    "Loam, Sand",
    "3,4,5,6,7,8,9",
    true,
    ["Purple", "White Swan", "Magnus", "Cheyenne Spirit"],
  ],
  [
    "Black-Eyed Susan",
    "Rudbeckia hirta",
    "Full, Partial",
    "Low",
    "Loam, Sand, Clay",
    "3,4,5,6,7,8,9,10",
    true,
    ["Goldstrum", "Hirta Common", "Cherokee Sunset"],
  ],
  [
    "Milkweed",
    "Asclepias",
    "Full",
    "Low",
    "Sand, Clay",
    "3,4,5,6,7,8,9",
    true,
    ["Common Milkweed", "Swamp Milkweed", "Butterfly Weed"],
  ],
  [
    "Marigold",
    "Tagetes",
    "Full",
    "Moderate",
    "Loam, Sand",
    "2,3,4,5,6,7,8,9,10,11",
    false,
    ["French", "African", "Signet", "Mexican Marigold"],
  ],
  [
    "Nasturtium",
    "Tropaeolum majus",
    "Full",
    "Low",
    "Sand, Loam",
    "3,4,5,6,7,8,9,10,11",
    false,
    ["Jewel Mix", "Empress of India", "Alaska Variegated"],
  ],
  [
    "Sunflower",
    "Helianthus annuus",
    "Full",
    "Moderate",
    "Loam, Clay",
    "3,4,5,6,7,8,9,10",
    true,
    ["Mammoth Grey", "Autumn Beauty", "Lemon Queen", "Teddy Bear"],
  ],
  [
    "Aster",
    "Symphyotrichum",
    "Full, Partial",
    "Moderate",
    "Loam, Clay",
    "3,4,5,6,7,8",
    true,
    ["New England", "Aromatic Aster", "Blue Wood Aster"],
  ],
  [
    "Yarrow",
    "Achillea millefolium",
    "Full",
    "Low",
    "Sand, Loam, Clay",
    "3,4,5,6,7,8,9",
    true,
    ["Common Yarrow", "Paprika", "Moonshine"],
  ],
  [
    "Bee Balm",
    "Monarda fistulosa",
    "Full, Partial",
    "Moderate",
    "Loam, Clay",
    "3,4,5,6,7,8,9",
    true,
    ["Wild Bergamot", "Jacob Cline", "Lemon Bee Balm"],
  ],
  [
    "Coreopsis",
    "Coreopsis lanceolata",
    "Full",
    "Low",
    "Sand, Loam",
    "3,4,5,6,7,8,9",
    true,
    ["Lanceleaf", "Early Sunrise", "Moonbeam"],
  ],
];

const WILD_EDIBLES: BasePlant[] = [
  {
    name: "Lamb's Quarters",
    scientificName: "Chenopodium album",
    type: "Wild Edible",
    sunRequirements: "Full, Partial",
    waterRequirements: "Low",
    soilPreference: "Sand, Loam, Clay",
    usdaZones: "3,4,5,6,7,8,9,10,11",
    isNative: false,
    description:
      "Known as wild spinach. Highly nutritious leaves are rich in vitamins A, C, and K, plus calcium and iron. Tastes delicious steamed or raw.",
  },
  {
    name: "Purslane",
    scientificName: "Portulaca oleracea",
    type: "Wild Edible",
    sunRequirements: "Full",
    waterRequirements: "Low",
    soilPreference: "Sand, Loam",
    usdaZones: "3,4,5,6,7,8,9,10,11",
    isNative: true,
    description:
      "Edible succulent rich in Omega-3 fatty acids. Has a crisp, lemony, slightly salty taste. Acts as an excellent living groundcover/mulch.",
  },
  {
    name: "Dandelion",
    scientificName: "Taraxacum officinale",
    type: "Wild Edible",
    sunRequirements: "Full, Partial",
    waterRequirements: "Moderate",
    soilPreference: "Loam, Clay, Sand",
    usdaZones: "3,4,5,6,7,8,9,10",
    isNative: false,
    description:
      "Every part is edible. Taproot mines minerals from deep soil. Greens are rich in potassium; roots can be roasted for a coffee alternative.",
  },
  {
    name: "Stinging Nettle",
    scientificName: "Urtica dioica",
    type: "Wild Edible",
    sunRequirements: "Partial, Shade",
    waterRequirements: "Moderate, High",
    soilPreference: "Loam",
    usdaZones: "3,4,5,6,7,8,9,10",
    isNative: true,
    description:
      "Nitrogen-rich mineral powerhouse. Cooking completely neutralizes sting, making a rich spinach substitute. Great compost starter.",
  },
  {
    name: "Chickweed",
    scientificName: "Stellaria media",
    type: "Wild Edible",
    sunRequirements: "Partial, Shade",
    waterRequirements: "Moderate",
    soilPreference: "Loam, Clay",
    usdaZones: "3,4,5,6,7,8,9",
    isNative: false,
    description:
      "Tender, cooling green with a mild flavor similar to sweet corn. Excellent raw in spring salads and as a soil-protecting green cover.",
  },
  {
    name: "Wood Sorrel",
    scientificName: "Oxalis stricta",
    type: "Wild Edible",
    sunRequirements: "Partial, Shade",
    waterRequirements: "Moderate",
    soilPreference: "Loam, Sand",
    usdaZones: "4,5,6,7,8,9",
    isNative: true,
    description:
      "Heart-shaped clover-like leaves with a tart, bright lemony flavor. Highly refreshing in salads. Rich in vitamin C.",
  },
];

const RELATIONSHIPS: [string, string, "companion" | "antagonist", string][] = [
  [
    "Tomato",
    "Basil",
    "companion",
    "Basil repels thrips, flies, and hornworms, and improves tomato flavor.",
  ],
  [
    "Tomato",
    "Marigold",
    "companion",
    "Marigolds repel nematodes, tomato hornworms, and other garden pests.",
  ],
  [
    "Tomato",
    "Nasturtium",
    "companion",
    "Nasturtiums act as a trap crop for aphids and repel whiteflies.",
  ],
  [
    "Tomato",
    "Potato",
    "antagonist",
    "Tomatoes and potatoes are both susceptible to early and late blight, and can infect each other.",
  ],
  [
    "Tomato",
    "Fennel",
    "antagonist",
    "Fennel releases allelopathic chemicals that stunt the growth of nightshades like tomatoes.",
  ],
  [
    "Bean",
    "Carrot",
    "companion",
    "Beans enrich the soil with nitrogen, which benefits root crops like carrots.",
  ],
  [
    "Bean",
    "Corn",
    "companion",
    "Corn acts as a natural trellis for pole beans, while beans fix nitrogen for the corn.",
  ],
  [
    "Bean",
    "Onion",
    "antagonist",
    "Allium family members (onions, garlic) inhibit the growth of nitrogen-fixing bacteria on bean roots.",
  ],
  [
    "Pea",
    "Carrot",
    "companion",
    "Peas fix nitrogen, boosting the growth of nearby carrots.",
  ],
  [
    "Pea",
    "Onion",
    "antagonist",
    "Onions inhibit the growth of peas and beans.",
  ],
  [
    "Carrot",
    "Lettuce",
    "companion",
    "Carrots and lettuce have different root depths and do not compete for space.",
  ],
  [
    "Carrot",
    "Dill",
    "antagonist",
    "Dill can cross-pollinate with carrots and stunt their growth.",
  ],
  [
    "Cucumber",
    "Radish",
    "companion",
    "Radishes repel cucumber beetles and act as a companion trap crop.",
  ],
  ["Cucumber", "Sage", "antagonist", "Sage stunts the growth of cucumbers."],
  [
    "Cucumber",
    "Potato",
    "antagonist",
    "Potato blight can easily transfer to cucumbers and vice-versa.",
  ],
  [
    "Potato",
    "Marigold",
    "companion",
    "Marigolds protect potato crops from pests.",
  ],
  [
    "Potato",
    "Sunflower",
    "antagonist",
    "Sunflowers can stunt potato growth and increase susceptibility to potato blight.",
  ],
  [
    "Squash",
    "Marigold",
    "companion",
    "Marigolds repel squash bugs and beetles.",
  ],
  [
    "Squash",
    "Nasturtium",
    "companion",
    "Nasturtiums repel squash bugs and cucumber beetles.",
  ],
  [
    "Squash",
    "Corn",
    "companion",
    "Part of the Three Sisters: squash leaves shade the ground to prevent weeds and retain moisture.",
  ],
  [
    "Apple",
    "Lavender",
    "companion",
    "Lavender attracts pollinators like bees, essential for apple blossom fruit set.",
  ],
  [
    "Cherry",
    "Lavender",
    "companion",
    "Attracts key pollinators to cherry blossoms.",
  ],
  [
    "Peach",
    "Lavender",
    "companion",
    "Attracts key pollinators and repels peach tree pests with strong scent.",
  ],
];

function expandTemplates(
  templates: Template[],
  type: string,
  desc: (v: string, n: string) => string,
): BasePlant[] {
  const out: BasePlant[] = [];
  for (const [name, sci, sun, water, soil, zones, vars] of templates) {
    for (const v of vars) {
      const full = v.includes(name) ? v : `${v} ${name}`;
      out.push({
        name: full,
        scientificName: sci,
        type,
        sunRequirements: sun,
        waterRequirements: water,
        soilPreference: soil,
        usdaZones: zones,
        isNative: false,
        description: desc(name.toLowerCase(), v),
      });
    }
  }
  return out;
}

function buildCatalog(): BasePlant[] {
  const catalog: BasePlant[] = [
    ...expandTemplates(
      VEGETABLES,
      "Vegetable",
      (n, v) => `Popular ${n} variety: '${v}'. Great for home gardens.`,
    ),
    ...expandTemplates(
      HERBS,
      "Herb",
      (n, v) => `Flavorful ${n} variety: '${v}'. Fits container gardening.`,
    ),
    ...expandTemplates(
      FRUITS,
      "Fruit",
      (n, v) =>
        `Delicious ${n} variety: '${v}'. Suitable for backyard orchards.`,
    ),
  ];
  for (const [name, sci, sun, water, soil, zones, isNat, vars] of NATIVES) {
    for (const v of vars) {
      const full = v.includes(name) ? v : `${v} ${name}`;
      catalog.push({
        name: full,
        scientificName: sci,
        type: isNat ? "Native" : "Flower",
        sunRequirements: sun,
        waterRequirements: water,
        soilPreference: soil,
        usdaZones: zones,
        isNative: isNat,
        description: `Beautiful ${name.toLowerCase()} variety: '${v}'. Great for pollinators and companion benefits.`,
      });
    }
  }
  catalog.push(...WILD_EDIBLES);
  return catalog;
}

interface Dimensions {
  height: number;
  width: number;
  minRad: number;
  maxRad: number;
  foliageColor: string;
  canopyShape: string;
  fruitColor: string | null;
}

function dimensionsFor(name: string, type: string): Dimensions {
  const n = name.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => n.includes(k));
  if (
    n.includes("tree") ||
    n.includes("orchard") ||
    type.toLowerCase() === "fruit tree"
  ) {
    const d: Dimensions = {
      height: 15.0,
      width: 8.0,
      minRad: 3.0,
      maxRad: 5.0,
      foliageColor: "#3b7a57",
      canopyShape: "rounded",
      fruitColor: null,
    };
    if (n.includes("apple")) d.fruitColor = "#ef4444";
    else if (n.includes("orange") || n.includes("citrus"))
      d.fruitColor = "#f97316";
    else if (n.includes("lemon")) d.fruitColor = "#eab308";
    else if (n.includes("peach")) d.fruitColor = "#fca5a5";
    else if (n.includes("pear")) d.fruitColor = "#84cc16";
    else if (n.includes("cherry")) d.fruitColor = "#be123c";
    return d;
  }
  if (
    has(
      "tomato",
      "cucumber",
      "pepper",
      "eggplant",
      "bean",
      "pea",
      "melon",
      "watermelon",
    )
  ) {
    const d: Dimensions = {
      height: 6.0,
      width: 3.0,
      minRad: 1.0,
      maxRad: 2.0,
      foliageColor: "#4f825d",
      canopyShape: "rounded",
      fruitColor: null,
    };
    if (n.includes("tomato")) d.fruitColor = "#ef4444";
    else if (n.includes("pepper")) d.fruitColor = "#f59e0b";
    else if (n.includes("eggplant")) d.fruitColor = "#581c87";
    else if (n.includes("cucumber")) d.fruitColor = "#15803d";
    return d;
  }
  if (has("squash", "zucchini", "pumpkin")) {
    return {
      height: 1.2,
      width: 4.0,
      minRad: 1.5,
      maxRad: 2.5,
      foliageColor: "#1b4332",
      canopyShape: "rounded",
      fruitColor: null,
    };
  }
  if (
    has(
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
    )
  ) {
    if (n.includes("sunflower")) {
      return {
        height: 8.0,
        width: 4.0,
        minRad: 1.5,
        maxRad: 2.5,
        foliageColor: "#2e7d32",
        canopyShape: "columnar",
        fruitColor: "#eab308",
      };
    }
    if (n.includes("lavender")) {
      return {
        height: 3.0,
        width: 2.0,
        minRad: 0.8,
        maxRad: 1.5,
        foliageColor: "#2e7d32",
        canopyShape: "vase",
        fruitColor: "#a855f7",
      };
    }
    const d: Dimensions = {
      height: 3.0,
      width: 2.0,
      minRad: 0.8,
      maxRad: 1.5,
      foliageColor: "#2e7d32",
      canopyShape: "rounded",
      fruitColor: null,
    };
    if (n.includes("marigold")) d.fruitColor = "#f59e0b";
    else if (n.includes("nasturtium")) d.fruitColor = "#ea580c";
    return d;
  }
  return {
    height: 1.0,
    width: 1.0,
    minRad: 0.4,
    maxRad: 0.8,
    foliageColor: "#556b2f",
    canopyShape: "rounded",
    fruitColor: null,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function seedDatabase(): Promise<{
  plants: number;
  relationships: number;
}> {
  const catalog = buildCatalog();
  console.log(`Generated list of ${catalog.length} plants to seed.`);

  // Clear first (relationships before plants for FK), then re-insert.
  await db.delete(relationships);
  await db.delete(plants);

  for (const batch of chunk(catalog, 50)) {
    await db.insert(plants).values(
      batch.map((p) => {
        const d = dimensionsFor(p.name, p.type);
        return {
          name: p.name,
          scientificName: p.scientificName,
          type: p.type,
          sunRequirements: p.sunRequirements,
          waterRequirements: p.waterRequirements,
          soilPreference: p.soilPreference,
          usdaZones: p.usdaZones,
          isNative: p.isNative,
          description: p.description,
          matureHeight: d.height,
          matureWidth: d.width,
          minRadius: d.minRad,
          maxRadius: d.maxRad,
          foliageColor: d.foliageColor,
          canopyShape: d.canopyShape,
          fruitColor: d.fruitColor,
        };
      }),
    );
  }

  const rows = await db
    .select({ id: plants.id, name: plants.name })
    .from(plants);
  const byKeyword = (kw: string) =>
    rows.filter((r) => r.name.toLowerCase().includes(kw.toLowerCase()));

  let relCount = 0;
  for (const [kw1, kw2, type, desc] of RELATIONSHIPS) {
    const left = byKeyword(kw1);
    const right = byKeyword(kw2);
    const pairs = [];
    for (const a of left) {
      for (const b of right) {
        if (a.id !== b.id)
          pairs.push({
            plantId: a.id,
            targetId: b.id,
            type,
            description: desc,
          });
      }
    }
    for (const batch of chunk(pairs, 200)) {
      await db.insert(relationships).values(batch).onConflictDoNothing();
    }
    relCount += pairs.length;
  }
  console.log(`Successfully seeded ${relCount} relationship entries.`);

  const plantCount = (await db.select({ id: plants.id }).from(plants)).length;
  const relTotal = (
    await db.select({ id: relationships.id }).from(relationships)
  ).length;
  console.log(
    `Verification: ${plantCount} plants and ${relTotal} relationships inside local.db.`,
  );
  return { plants: plantCount, relationships: relTotal };
}
