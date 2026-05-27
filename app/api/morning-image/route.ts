import { NextResponse } from "next/server";
import {
  getMorningImageTheme,
  getSingaporeDateString,
  getThemeForDesign,
  getRotationIndex,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeName = getThemeForDesign(searchParams.get("designId"));
  const theme = getMorningImageTheme(themeName);
  const dateString = getSingaporeDateString();

  try {
    const supabase = createServerSupabaseClient();
    
    // 1. Try to find today's image in the database for this specific theme
    const { data: todayImages, error: todayError } = await supabase
      .from("daily_images")
      .select("image_url, date_string")
      .eq("theme", theme.name)
      .eq("date_string", dateString)
      .limit(1);

    const todayImage = todayImages?.find((item) => item.image_url);
    if (todayImage?.image_url && !todayError) {
      return NextResponse.json({
        imageUrl: todayImage.image_url,
        theme: theme.name,
        dateString,
        cacheDateString: todayImage.date_string,
        source: "storage",
      });
    }

    // 2. Rotate through existing images in the database
    const { data: cachedImages, error: cacheError } = await supabase
      .from("daily_images")
      .select("image_url, date_string, theme")
      .order("date_string", { ascending: true });

    if (!cacheError && cachedImages && cachedImages.length > 0) {
      const allImages = cachedImages.filter((item) => item.image_url);
      if (allImages.length > 0) {
        const themeImages = allImages.filter((item) => item.theme === theme.name);
        const reusableImages = themeImages.length > 0 ? themeImages : allImages;

        const rotatedImage = reusableImages[getRotationIndex(dateString, reusableImages.length)];
        return NextResponse.json({
          imageUrl: rotatedImage.image_url,
          theme: theme.name,
          dateString,
          cacheDateString: rotatedImage.date_string,
          source: "rotated-cache",
        });
      }
    }
  } catch {
    // Fall through to static image so the senior screen never waits on storage.
  }

  return NextResponse.json({
    imageUrl: theme.fallbackImage,
    theme: theme.name,
    dateString,
    cacheDateString: null,
    source: "static",
  });
}
