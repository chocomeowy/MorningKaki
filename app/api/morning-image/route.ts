import { NextResponse } from "next/server";
import {
  getMorningImageTheme,
  getSingaporeDateString,
  getThemeForDesign,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeName = getThemeForDesign(searchParams.get("designId"));
  const theme = getMorningImageTheme(themeName);
  const dateString = getSingaporeDateString();

  try {
    const supabase = createServerSupabaseClient();
    const { data: todayImage, error } = await supabase
      .from("daily_images")
      .select("image_url, date_string")
      .eq("theme", theme.name)
      .eq("date_string", dateString)
      .single();

    if (todayImage?.image_url && !error) {
      return NextResponse.json({
        imageUrl: todayImage.image_url,
        theme: theme.name,
        dateString,
        cacheDateString: todayImage.date_string,
        source: "storage",
      });
    }

    const { data: cachedImages } = await supabase
      .from("daily_images")
      .select("image_url, date_string")
      .eq("theme", theme.name)
      .order("date_string", { ascending: true });

    const reusableImages = (cachedImages ?? []).filter((item) => item.image_url);

    if (reusableImages.length > 0) {
      const rotatedImage = reusableImages[getRotationIndex(dateString, reusableImages.length)];
      return NextResponse.json({
        imageUrl: rotatedImage.image_url,
        theme: theme.name,
        dateString,
        cacheDateString: rotatedImage.date_string,
        source: "rotated-cache",
      });
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

function getRotationIndex(dateString: string, imageCount: number) {
  const dayOfMonth = Number(dateString.split("-")[2] ?? "1");
  return Math.max(dayOfMonth - 1, 0) % imageCount;
}
