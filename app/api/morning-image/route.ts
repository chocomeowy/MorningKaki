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
    const { data, error } = await supabase
      .from("daily_images")
      .select("image_url")
      .eq("theme", theme.name)
      .eq("date_string", dateString)
      .single();

    if (data?.image_url && !error) {
      return NextResponse.json({
        imageUrl: data.image_url,
        theme: theme.name,
        dateString,
        source: "storage",
      });
    }
  } catch {
    // Fall through to static image so the senior screen never waits on storage.
  }

  return NextResponse.json({
    imageUrl: theme.fallbackImage,
    theme: theme.name,
    dateString,
    source: "static",
  });
}
