import type { MorningDesignId } from "./morning-designs";

export type MoodStickerId = "energetic" | "tired" | "down" | "grateful" | "confused";

export type MoodStickerTheme = "blessing" | "gardens" | "calm";

const themeByDesign: Record<MorningDesignId, MoodStickerTheme> = {
  "heritage-card": "blessing",
  "garden-collage": "gardens",
  "waterfall-calm": "calm",
};

export function getMoodStickerTheme(designId: MorningDesignId): MoodStickerTheme {
  return themeByDesign[designId];
}

export function getMoodStickerSrc(designId: MorningDesignId, moodId: MoodStickerId) {
  return `/stickers/${getMoodStickerTheme(designId)}/${moodId}.svg`;
}
