import { getMorningDesign } from "@/lib/morning-designs";

export const morningImageBucket = "morning-images";

export const morningImageThemes = [
  {
    name: "blessing",
    fallbackImage: "/daily-theme-blessing.png",
    prompt:
      "Soft watercolour illustration, warm pastel colours, Singapore context, morning sunrise, blooming pink lotus and orchids, doves flying, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in beautiful, large, readable golden calligraphy.",
  },
  {
    name: "gardens",
    fallbackImage: "/daily-theme-gardens.png",
    prompt:
      "Soft watercolour illustration, warm pastel colours, Singapore context, Gardens by the Bay supertrees at morning sunrise, lush greenery, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in elegant white calligraphy.",
  },
  {
    name: "calm",
    fallbackImage: "/daily-theme-calm.png",
    prompt:
      "Soft watercolour illustration, warm pastel colours, Singapore context, calm morning mist over a zen garden with bamboo, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in gentle soft-focus calligraphy.",
  },
] as const;

export type MorningImageTheme = (typeof morningImageThemes)[number]["name"];

const designThemeMap: Record<string, MorningImageTheme> = {
  "heritage-card": "blessing",
  "garden-collage": "gardens",
  "waterfall-calm": "calm",
};

export function getSingaporeDateString(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
}

export function getThemeForDesign(designId: string | null | undefined) {
  const design = getMorningDesign(designId ?? null);
  return designThemeMap[design.id] ?? "blessing";
}

export function getMorningImageTheme(theme: string | null | undefined) {
  return morningImageThemes.find((item) => item.name === theme) ?? morningImageThemes[0];
}

export function getStoragePath(dateString: string, theme: MorningImageTheme) {
  return `daily-images/${dateString}/${theme}.png`;
}
