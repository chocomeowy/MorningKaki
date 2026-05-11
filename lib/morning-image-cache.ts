import { getMorningDesign } from "@/lib/morning-designs";

export const morningImageBucket = "morning-images";

export const morningImageThemes = [
  {
    name: "blessing",
    fallbackImage: "/daily-theme-blessing.png",
    prompt:
      "Create a detailed Singapore WhatsApp good-morning blessing card for seniors, bright and cheerful, not minimalist. Scene: glowing blue morning sky with sun rays through clouds, a peaceful white dove flying, lotus and orchid flowers, small heart stickers, and soft Singapore warmth. Use a vivid greeting-card collage style with layered decorative typography like local family chat images. Include multiple large readable text phrases: 'Good Morning', '早安', 'Selamat Pagi', 'Stay healthy 天天健康', 'Take care always', and 'It's the little things that count'. Add one clear daily kindness or conservation reminder: 'Turn off your lights when not in use'. Text should be big, high contrast, outlined, placed around the edges and sky without blocking the dove. Elderly-friendly, warm, hopeful, colorful, polished, no watermark, no tiny unreadable text.",
  },
  {
    name: "gardens",
    fallbackImage: "/daily-theme-gardens.png",
    prompt:
      "Create a detailed Singapore WhatsApp good-morning card for seniors, inspired by Gardens by the Bay and a flower conservatory. Scene: Marina Bay Sands and Supertrees in the background, glasshouse roof light, lush greenery, large pink roses with morning dew in the foreground, golden sunlight, festive and uplifting. Use a colorful greeting-card collage style with bold layered typography, similar to family chat morning images. Include multiple large readable text phrases: 'GOOD MORNING', 'Have a nice day!', '早安', '一声问候 温暖在心', and '愿你把握大好时光 心想事成'. Add a short English blessing: 'It's a wonderful life because everyday is beautiful'. Put text in red, white, gold, and cyan with clean outlines so seniors can read it. Detailed, joyful, Singapore-specific, no watermark, no tiny unreadable text.",
  },
  {
    name: "calm",
    fallbackImage: "/daily-theme-calm.png",
    prompt:
      "Create a detailed Singapore WhatsApp good-morning card for seniors with a lush waterfall and garden theme. Scene: glowing morning light over a multi-tier waterfall, blue flowing water, red and pink tropical flowers, bamboo, rich greenery, gentle mist, peaceful but vivid colors. Use a nostalgic family-chat greeting-card style with decorative script and bold Chinese text, not minimalist. Include multiple large readable text phrases: 'Selamat Pagi', 'Good Morning', 'water is life...', '节约用水', and 'Remember to turn off your tap'. Add a smiling friendly emoji-style face near the lower side, but keep it tasteful and elderly-friendly. Text should be white, yellow, or red with strong shadow/outline, placed around the waterfall without hiding the main water flow. Bright, caring, high contrast, no watermark, no tiny unreadable text.",
  },
] as const;

export type MorningImageTheme = (typeof morningImageThemes)[number]["name"];

const designThemeMap: Record<string, MorningImageTheme> = {
  "heritage-card": "blessing",
  "garden-collage": "gardens",
  "waterfall-calm": "calm",
};

export function getSingaporeDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Singapore",
    year: "numeric",
  }).formatToParts(date);
  const valueFor = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")}`;
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
