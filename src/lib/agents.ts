// Port of backend/app/services/agents.py — specialist roster + coordinator.
// Plain shared module (no "use server"): imported by actions/create-diagnosis.ts.

export interface TranscriptItem {
  agentKey: string;
  agentName: string;
  agentRole: string;
  agentIcon: string;
  message: string;
}

interface Specialist {
  key: string;
  name: string;
  role: string;
  icon: string;
  description: string;
  systemInstructions: (
    soil: string,
    sun: string,
    zone: string,
    crops: string[],
  ) => string;
  rulesAnalysis: (
    query: string,
    soil: string,
    sun: string,
    zone: string,
    crops: string[],
  ) => string;
}

async function queryGeminiAgent(
  systemInstructions: string,
  prompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstructions}\n\n${prompt}` }],
            },
          ],
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      contents?: { parts?: { text?: string }[] }[];
    };
    return body.contents?.[0]?.parts?.[0]?.text?.trim() ?? null;
  } catch (err) {
    console.error(
      "Error querying Gemini for agent analysis, falling back to rules-engine",
      err,
    );
    return null;
  }
}

const ROSTER: Record<string, Specialist> = {
  tomato: {
    key: "tomato",
    name: "Tomato Specialist",
    role: "Nightshade Horticulturist",
    icon: "🍅",
    description:
      "Expert in yellowing leaves, rot, early/late blight, and calcium requirements for nightshades.",
    systemInstructions: () =>
      "You are a professional Nightshade Horticulturist specializing in tomatoes, peppers, and eggplants. Diagnose growth issues, leaf yellowing, blight pathogens, and fruit end-rot from a horticultural perspective.",
    rulesAnalysis: (query, _soil, sun) => {
      const q = query.toLowerCase();
      if (q.includes("yellow") || q.includes("chlorosis")) {
        return "From a nightshade perspective, yellowing lower leaves usually indicate early signs of Nitrogen deficiency or root stress due to moisture fluctuations. If there are concentric dark rings, it is likely Early Blight (Alternaria solani). I recommend deep, infrequent watering at the base of the plant, removing the bottom 12 inches of foliage, and applying an organic calcium-rich foliar feed.";
      }
      if (q.includes("rot") || q.includes("black") || q.includes("bottom")) {
        return "Blackening at the bottom of the fruit is classic Blossom-End Rot. This is not a pathogen, but rather a structural calcium deficiency in the developing fruit, usually caused by inconsistent watering. Ensure the soil remains evenly damp and add organic gypsum or bone meal to stabilize soil calcium availability.";
      }
      if (
        q.includes("bug") ||
        q.includes("pest") ||
        q.includes("eat") ||
        q.includes("hole")
      ) {
        return "If you notice large chunks of tomato leaves missing overnight, check for Hornworms. Their camouflage is superb; inspect the undersides of stems. Smaller holes point to Flea Beetles or Spider Mites. Introduce companion African Marigolds to repel them naturally.";
      }
      return `As a nightshade specialist, I recommend keeping tomatoes in full sun (${sun} exposure) with well-draining soil. Avoid planting them directly next to potatoes to reduce cross-pathogen vulnerability. Proper staking will maximize air circulation and reduce disease risk.`;
    },
  },
  soil: {
    key: "soil",
    name: "Soil Scientist",
    role: "Pedologist & Agronomist",
    icon: "🧪",
    description:
      "Analyzes soil sand/clay texture ratios, drainage washouts, organic matter, and compost inputs.",
    systemInstructions: () =>
      "You are an expert Soil Pedologist. Analyze soil structures, clay drainage limits, sandy nutrient washouts, organic compost applications, and N-P-K mineral adjustments.",
    rulesAnalysis: (query, soil) => {
      const q = query.toLowerCase();
      if (
        q.includes("clay") ||
        q.includes("drain") ||
        q.includes("water") ||
        q.includes("wet")
      ) {
        return `Heavy clay soil restricts root aeration and holds water too long, causing root rot. In your '${soil}' soil, adding raw sand will create concrete-like conditions; instead, incorporate organic compost, leaf mold, or expanded shale to aggregate the clay particles and improve drainage structure.`;
      }
      if (q.includes("yellow") || q.includes("chlorosis")) {
        return `Yellowing leaves are frequently caused by nutrient lockout in clay or leaching in sandy soil. With your '${soil}' soil, heavy rains may have washed away mobile nitrogen. I suggest applying an organic compost top-dressing to buffer soil chemistry and slowly release essential nitrogen and iron.`;
      }
      if (
        q.includes("compost") ||
        q.includes("fertilizer") ||
        q.includes("organic")
      ) {
        return "Building soil organic matter is key. I recommend applying a 2-inch layer of well-rotted leaf compost or worm castings. This feeds the soil microbiome, builds aggregate stability, and naturally regulates water retention.";
      }
      return `Your soil type is classified as '${soil}'. To optimize root aeration and microbial activity, incorporate aged organic matter and avoid mechanical compaction when wet. Conduct a slurry pH test to ensure it sits between 6.0 and 7.0 for optimal mineral availability.`;
    },
  },
  pest: {
    key: "pest",
    name: "Pest Entomologist",
    role: "Agricultural Entomologist",
    icon: "🐛",
    description:
      "Identifies chewing/sucking insects, aphids, mites, and prescribes organic neem and companion controls.",
    systemInstructions: () =>
      "You are a professional Agricultural Entomologist. Identify insect damage (aphids, mites, beetles, caterpillars) and prescribe organic integrated pest management (IPM) techniques.",
    rulesAnalysis: (query) => {
      const q = query.toLowerCase();
      if (q.includes("yellow") || q.includes("spot")) {
        return "Leaf speckling or yellowing can be caused by sucking pests like Spider Mites or Aphids on the leaf undersides. Spraying plants with a strong stream of water will dislodge them. For persistent infestations, apply a 1% dilution of organic cold-pressed neem oil during evening hours.";
      }
      if (
        q.includes("hole") ||
        q.includes("eat") ||
        q.includes("bite") ||
        q.includes("chew")
      ) {
        return "Irregular holes in leaves suggest chewing pests such as Hornworms, Flea Beetles, or Slugs. Handpick larger caterpillars at dusk. Dusting the base with food-grade diatomaceous earth will form a protective physical barrier against crawling insects like beetles and slugs.";
      }
      return "Integrated Pest Management (IPM) is best. I recommend planting companion Nasturtiums and Sweet Alyssum as trap crops to draw pests away from your main crops, while attracting beneficial predators like ladybugs and lacewings.";
    },
  },
  regen: {
    key: "regen",
    name: "Regenerative Agronomist",
    role: "Agroecologist",
    icon: "🌾",
    description:
      "Specializes in cover crops, nitrogen-fixing polycultures, and low-till soil regeneration.",
    systemInstructions: () =>
      "You are a Regenerative Agroecologist. Analyze polycultures, cover cropping, nitrogen-fixing symbiosis, low-till biology, and long-term soil health.",
    rulesAnalysis: (query) => {
      const q = query.toLowerCase();
      if (
        q.includes("yellow") ||
        q.includes("fertilizer") ||
        q.includes("nitrogen")
      ) {
        return "To address nitrogen depletion without chemical inputs, integrate leguminous companion crops like Peas or Clover. Their root nodules form symbiotic relationships with Rhizobium bacteria to fix atmospheric nitrogen directly into your root zone.";
      }
      if (q.includes("clay") || q.includes("weed") || q.includes("till")) {
        return "Minimize soil tilling to protect the delicate mycorrhizal fungal networks. In heavy soils, use deep-rooting cover crops like Daikon Radish to drill through compacted zones naturally, leaving the decaying roots in place to build organic channels.";
      }
      return "Polyculture design is essential. Rather than clean rows, utilize the Three Sisters approach (Squash, Beans, and tall supports) or plant dense cover crops. This keeps the soil covered, suppresses weeds, retains moisture, and feeds the biological food web.";
    },
  },
  climate: {
    key: "climate",
    name: "Climate Advisor",
    role: "Biometeorologist",
    icon: "🌦️",
    description:
      "Reviews USDA cold hardiness zones, frost timelines, heat stress, and light exposure.",
    systemInstructions: () =>
      "You are a Biometeorologist and climate expert. Analyze plant health relative to USDA cold hardiness zones, frost thresholds, heat indexes, and sun exposure.",
    rulesAnalysis: (query, _soil, sun, zone) => {
      const q = query.toLowerCase();
      if (q.includes("frost") || q.includes("cold") || q.includes("winter")) {
        return `In USDA Climate ${zone}, watch out for late spring frost events. If temperatures dip close to freezing, cover tender nightshades and melons with floating row covers. Do not plant warm-season crops until night temperatures consistently stay above 50°F (10°C).`;
      }
      if (
        q.includes("sun") ||
        q.includes("hot") ||
        q.includes("summer") ||
        q.includes("dry")
      ) {
        return `Under '${sun}' conditions, warm-season plants will transpire rapidly. High heat indexes can scorch young leaves and cause tomato blossoms to drop. Apply a thick straw mulch layer to cool the soil surface and protect roots from thermal shock.`;
      }
      return `Your garden is mapped to Climate ${zone} with '${sun}' sun exposure. Align your planting schedule to local frost-free dates, and provide afternoon shade cloth for cool-season greens like lettuce and spinach during peak summer heat.`;
    },
  },
};

export function getSpecialist(key: string): Specialist | undefined {
  return ROSTER[key];
}

export async function analyzeWithSpecialist(
  key: string,
  query: string,
  soil: string,
  sun: string,
  zone: string,
  crops: string[],
): Promise<TranscriptItem | null> {
  const agent = ROSTER[key];
  if (!agent) return null;
  const prompt = `
Query: ${query}
Soil: ${soil}
Sun exposure: ${sun}
Climate Zone: ${zone}
Selected Crops: ${crops.length > 0 ? crops.join(", ") : "None"}

Provide your specialized analysis in 2-4 clean sentences. Do not mention other agents by name. Write in first-person as a professional expert.
`;
  try {
    const llmText = await queryGeminiAgent(
      agent.systemInstructions(soil, sun, zone, crops),
      prompt,
    );
    const message =
      llmText ?? agent.rulesAnalysis(query, soil, sun, zone, crops);
    return {
      agentKey: agent.key,
      agentName: agent.name,
      agentRole: agent.role,
      agentIcon: agent.icon,
      message,
    };
  } catch (err) {
    console.error(`Error executing agent ${key} analysis: ${err}`);
    return null;
  }
}

function synthesizeRules(
  query: string,
  specialistsData: Record<string, string>,
  soil: string,
  sun: string,
): { confidence: string; summary: string } {
  const q = query.toLowerCase();
  if (
    "tomato" in specialistsData &&
    (q.includes("yellow") || q.includes("chlorosis"))
  ) {
    return {
      confidence: "High",
      summary: `### 📋 Consensus Diagnosis
The expert panel agrees that leaf yellowing is primarily caused by **nitrogen availability stress** or waterlogged soil conditions disrupting nutrient uptake in nightshades.

### 🎯 Confidence Rating
**High** - Symptoms align closely with classic nitrogen chlorosis and soil saturation patterns in standard agricultural models.

### 🛠️ Actionable Strategy
1. **Regulate Irrigation**: Water deeply but infrequently (1-2 times a week at the base) to prevent root suffocation.
2. **Apply Organic Compost**: Incorporate a 2-inch top-dressing of nitrogen-rich leaf compost or worm castings around the plant base.
3. **Prune Lower Stems**: Trim off lower leaves touching the ground to reduce risk of early blight infection.
`,
    };
  }
  if (q.includes("rot") || q.includes("black")) {
    return {
      confidence: "High",
      summary: `### 📋 Consensus Diagnosis
The primary issue is identified as **Blossom-End Rot**, which is a calcium uptake deficiency caused by uneven watering and root transpiration stress.

### 🎯 Confidence Rating
**High** - Blossom-end rot leaves a highly distinct dry black lesion at the base of developed nightshade fruits.

### 🛠️ Actionable Strategy
1. **Stabilize Watering**: Keep soil evenly damp using organic straw mulches to insulate root zones.
2. **Add Calcium Amendments**: Apply agricultural gypsum or bone meal to the soil to provide accessible calcium.
3. **Avoid Excess Nitrogen**: Do not apply heavy nitrogen fertilizers, as they stimulate leaf growth at the expense of calcium transport to the fruit.
`,
    };
  }
  if (
    q.includes("bug") ||
    q.includes("pest") ||
    q.includes("eat") ||
    q.includes("hole")
  ) {
    return {
      confidence: "Medium",
      summary: `### 📋 Consensus Diagnosis
The panel diagnoses insect chewing damage, likely due to caterpillars (like Hornworms) or climbing beetles.

### 🎯 Confidence Rating
**Medium** - Visual confirmation is needed to identify the exact insect species, but feeding marks point to active foliage pests.

### 🛠️ Actionable Strategy
1. **Handpick at Dusk**: Inspect leaf undersides and hand-remove caterpillars during evening hours.
2. **Create Barriers**: Apply food-grade diatomaceous earth around the base to repel crawling pests.
3. **Biological Repellents**: Plant companion African Marigolds to naturally deter beetles and attract helpful predators.
`,
    };
  }
  return {
    confidence: "Medium",
    summary: `### 📋 Consensus Diagnosis
The panel notes mild physiological stress. In your '${soil}' soil under '${sun}' light, plants require balanced organic fertilization and structured water tables.

### 🎯 Confidence Rating
**Medium** - General diagnostic parameters indicate soil moisture transitions or minor climatic adaptations.

### 🛠️ Actionable Strategy
1. **Organic Top-Dressing**: Apply well-rotted leaf compost or organic mulch to build soil microbial activity.
2. **Water Monitoring**: Ensure watering happens early in the morning to reduce leaf moisture evaporation loss.
3. **Companion Integration**: Introduce diverse companion crops (herbs and flowers) to build local ecological resilience.
`,
  };
}

export async function synthesizeDiagnosis(
  query: string,
  _activeAgents: string[],
  specialistsData: Record<string, string>,
  soil: string,
  sun: string,
  zone: string,
): Promise<{ confidence: string; summary: string }> {
  let discussion = "";
  for (const [name, msg] of Object.entries(specialistsData)) {
    discussion += `- ${name}: ${msg}\n`;
  }
  const prompt = `
You are the Lead Coordinator Agent for an advanced agricultural AI system. Synthesize the findings from our specialized expert panel:
Query: ${query}
Soil: ${soil}
Sun: ${sun}
Zone: ${zone}

Expert Panel Recommendations:
${discussion}
Provide a structured markdown response with exactly these sections:
### 📋 Consensus Diagnosis
Write 2 sentences summarizing the root cause of the user's issue based on the experts' agreement.

### 🎯 Confidence Rating
Specify exactly one: **High**, **Medium**, or **Low** with a brief 1-sentence explanation of why.

### 🛠️ Actionable Strategy
Provide 3 bulleted recommendations (1-2 sentences each) ordered by priority.
`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (res.ok) {
        const body = (await res.json()) as {
          contents?: { parts?: { text?: string }[] }[];
        };
        const text = body.contents?.[0]?.parts?.[0]?.text?.trim() ?? "";
        if (text) {
          const lower = text.toLowerCase();
          const confidence = lower.includes("high")
            ? "High"
            : lower.includes("low")
              ? "Low"
              : "Medium";
          return { confidence, summary: text };
        }
      }
    } catch (err) {
      console.error(`Error in Coordinator synthesis: ${err}`);
    }
  }
  return synthesizeRules(query, specialistsData, soil, sun);
}
