export interface PresetCrop {
  query: string;
  weight: number;
}

export interface GardenPreset {
  key: string;
  name: string;
  description: string;
  crops: PresetCrop[];
}

export const GARDEN_PRESETS: GardenPreset[] = [
  {
    key: "berry",
    name: "Berry patch",
    description: "Perennial berries and ground-covering strawberries.",
    crops: [
      { query: "Albion Strawberry", weight: 0.4 },
      { query: "Caroline Raspberry", weight: 0.3 },
      { query: "Bluecrop Blueberry", weight: 0.3 },
    ],
  },
  {
    key: "covercrop",
    name: "Cover crops",
    description: "Nitrogen-building crops that protect exposed soil.",
    crops: [
      { query: "Garden Pea", weight: 0.4 },
      { query: "Black Bean", weight: 0.3 },
      { query: "Common Yarrow", weight: 0.3 },
    ],
  },
  {
    key: "orchard",
    name: "Fruit orchard",
    description: "A compact perennial fruit-tree canopy.",
    crops: [
      { query: "Gala Apple Tree", weight: 0.4 },
      { query: "Redhaven Peach Tree", weight: 0.3 },
      { query: "Bartlett Pear Tree", weight: 0.3 },
    ],
  },
  {
    key: "nitrofix",
    name: "Nitrogen fixers",
    description: "Pulses and peas that rebuild low-nitrogen soil.",
    crops: [
      { query: "Garden Pea", weight: 0.3 },
      { query: "Snow Pea", weight: 0.3 },
      { query: "Black Bean", weight: 0.2 },
      { query: "Chickpea Pea", weight: 0.2 },
    ],
  },
  {
    key: "pizza",
    name: "Pizza garden",
    description: "Tomatoes, peppers, basil, and oregano for sauce.",
    crops: [
      { query: "Beefsteak Tomato", weight: 0.4 },
      { query: "Genovese Basil", weight: 0.2 },
      { query: "Italian Oregano", weight: 0.2 },
      { query: "Bell Pepper", weight: 0.2 },
    ],
  },
  {
    key: "pollinator",
    name: "Pollinator haven",
    description: "Flowers and host plants for native pollinators.",
    crops: [
      { query: "Autumn Beauty Sunflower", weight: 0.3 },
      { query: "Common Milkweed", weight: 0.3 },
      { query: "Jacob Cline Bee Balm", weight: 0.2 },
      { query: "English Lavender", weight: 0.2 },
    ],
  },
  {
    key: "salad",
    name: "Salad greens",
    description: "Fast-growing greens and fresh culinary herbs.",
    crops: [
      { query: "Loose Leaf Lettuce", weight: 0.3 },
      { query: "Baby Leaf Spinach", weight: 0.3 },
      { query: "Arugula Lettuce", weight: 0.2 },
      { query: "Curly-leaf Parsley", weight: 0.2 },
    ],
  },
  {
    key: "salsa",
    name: "Salsa garden",
    description: "Tomatoes, hot peppers, cilantro, and red onion.",
    crops: [
      { query: "Cherokee Purple Tomato", weight: 0.4 },
      { query: "Cayenne Pepper", weight: 0.2 },
      { query: "Coriander Cilantro", weight: 0.2 },
      { query: "Red Onion", weight: 0.2 },
    ],
  },
  {
    key: "stew",
    name: "Stew staples",
    description: "Root crops, onions, and aromatic herbs.",
    crops: [
      { query: "Danvers Carrot", weight: 0.25 },
      { query: "Yukon Gold Potato", weight: 0.25 },
      { query: "Yellow Onion", weight: 0.2 },
      { query: "Common Thyme", weight: 0.15 },
      { query: "Arp Rosemary", weight: 0.15 },
    ],
  },
  {
    key: "supergreens",
    name: "Super greens",
    description: "Nutrient-dense leafy greens and brassicas.",
    crops: [
      { query: "Baby Leaf Spinach", weight: 0.3 },
      { query: "Calabrese Broccoli", weight: 0.3 },
      { query: "Loose Leaf Lettuce", weight: 0.2 },
      { query: "Bok Choy Cabbage", weight: 0.2 },
    ],
  },
  {
    key: "threesisters",
    name: "Three sisters",
    description: "A traditional climbing, fixing, and ground-cover guild.",
    crops: [
      { query: "Acorn Squash", weight: 0.4 },
      { query: "Black Bean", weight: 0.3 },
      { query: "Autumn Beauty Sunflower", weight: 0.3 },
    ],
  },
  {
    key: "wellness",
    name: "Wellness garden",
    description: "Aromatic herbs and flowers for teas and topical uses.",
    crops: [
      { query: "English Lavender", weight: 0.3 },
      { query: "Peppermint Mint", weight: 0.3 },
      { query: "Jacob Cline Bee Balm", weight: 0.2 },
      { query: "Common Yarrow", weight: 0.2 },
    ],
  },
];

export const METHODOLOGIES = [
  {
    key: "Nucleation",
    description:
      "Dense islands that expand into the surrounding area over time.",
  },
  {
    key: "Block",
    description:
      "Clear crop blocks optimized for access and repeatable maintenance.",
  },
  {
    key: "DirectSeeding",
    description:
      "Seed directly into prepared beds with minimal transplant disturbance.",
  },
  {
    key: "FoodForest",
    description: "Layer canopy, shrub, herb, groundcover, and root crops.",
  },
  {
    key: "Miyawaki",
    description:
      "Closely plant diverse native layers to accelerate establishment.",
  },
  {
    key: "Syntropic",
    description:
      "Arrange succession and stratification around frequent biomass management.",
  },
] as const;
