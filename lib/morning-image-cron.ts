import { NextResponse } from "next/server";
import { getSingaporeDateString, morningImageThemes, type MorningImageTheme } from "@/lib/morning-image-cache";
import { generateAndCacheMorningImage } from "@/lib/morning-image-generator";

export function rejectUnauthorizedCron(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return null;
}

export function getValidMorningImageTheme(themeName: string | null | undefined) {
  return morningImageThemes.find((theme) => theme.name === themeName)?.name ?? null;
}

export async function generateCronMorningImage(theme: MorningImageTheme) {
  const date = getSingaporeDateString();

  try {
    const generatedImage = await generateAndCacheMorningImage(theme);
    return NextResponse.json({
      success: true,
      date,
      result: generatedImage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown image generation error";
    return NextResponse.json({
      success: false,
      date,
      theme,
      error: message,
    }, { status: 500 });
  }
}
