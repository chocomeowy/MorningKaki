export type MorningDesignId = "heritage-card" | "garden-collage" | "waterfall-calm";

export interface MorningDesign {
  id: MorningDesignId;
  name: string;
  shortName: string;
  description: string;
  promptStyle: string;
  previewClassName: string;
  heroImage?: string;
}

export const morningDesigns: MorningDesign[] = [
  {
    id: "heritage-card",
    name: "Singapore blessing card",
    shortName: "Blessing",
    description: "Bold multilingual text, flowers, landmarks, and WhatsApp-ready warmth.",
    promptStyle:
      "Maximalist Singapore good morning blessing card with Marina Bay Sands, Gardens by the Bay, flowers, kopi, bilingual English and Chinese greetings, bright hopeful colours, elderly-friendly large text.",
    previewClassName: "bg-gradient-to-br from-sky-200 via-rose-100 to-amber-200",
    heroImage: "/demo-good-morning-card.png",
  },
  {
    id: "garden-collage",
    name: "Gardens collage",
    shortName: "Gardens",
    description: "Greenery, flowers, water-saving reminder, and local produce cues.",
    promptStyle:
      "Singapore garden collage with Supertrees, orchids, sunflowers, soft morning light, concise good morning text, water-saving and local produce encouragement.",
    previewClassName: "bg-gradient-to-br from-emerald-200 via-lime-100 to-sky-200",
  },
  {
    id: "waterfall-calm",
    name: "Waterfall calm",
    shortName: "Calm",
    description: "Peaceful waterfall, cool blues, gentle Malay and Chinese greeting options.",
    promptStyle:
      "Peaceful Singapore senior good morning card with waterfall, cool blue water, flowers, gentle multilingual greeting, calm health reminder, high contrast readable text.",
    previewClassName: "bg-gradient-to-br from-blue-300 via-cyan-100 to-rose-200",
  },
];

export const defaultMorningDesign = morningDesigns[0];

export function getMorningDesign(id: string | null) {
  return morningDesigns.find((design) => design.id === id) ?? defaultMorningDesign;
}

export const morningDesignStorageKey = "morningkaki:morning-design";
