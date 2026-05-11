import { NextResponse } from "next/server";
import { generateAndCacheMorningImage } from "@/lib/morning-image-generator";
import { getMorningImageTheme, getThemeForDesign } from "@/lib/morning-image-cache";

interface GenerateMorningImageRequest {
  designId?: string;
  theme?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateMorningImageRequest;
    const themeName = body.theme ?? getThemeForDesign(body.designId);
    const theme = getMorningImageTheme(themeName);
    const generatedImage = await generateAndCacheMorningImage(theme.name);

    return NextResponse.json({
      ...generatedImage,
      source: "manual",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate replacement image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
