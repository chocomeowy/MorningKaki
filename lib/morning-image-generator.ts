import {
  getMorningImageTheme,
  getSingaporeDateString,
  getRotationIndex,
  type MorningImageTheme,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface GeneratedMorningImage {
  imageUrl: string;
  theme: MorningImageTheme;
  dateString: string;
  storagePath: string;
}

export async function generateAndCacheMorningImage(themeName: MorningImageTheme): Promise<GeneratedMorningImage> {
  const theme = getMorningImageTheme(themeName);
  const dateString = getSingaporeDateString();

  const supabase = createServerSupabaseClient();
  const { data: cachedImages, error } = await supabase
    .from("daily_images")
    .select("image_url, date_string, theme, storage_path")
    .order("date_string", { ascending: true });

  if (error) throw error;

  const allImages = (cachedImages ?? []).filter((item) => item.image_url);
  if (allImages.length === 0) {
    throw new Error("No saved images found in the database to rotate.");
  }

  // Filter by theme first, fallback to all images if none match the theme
  const themeImages = allImages.filter((item) => item.theme === theme.name);
  const reusableImages = themeImages.length > 0 ? themeImages : allImages;

  const rotatedImage = reusableImages[getRotationIndex(dateString, reusableImages.length)];

  return {
    imageUrl: rotatedImage.image_url,
    theme: theme.name,
    dateString,
    storagePath: rotatedImage.storage_path || "",
  };
}
