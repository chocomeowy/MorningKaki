import { NextResponse } from "next/server";
import { generateAndCacheMorningImage } from "@/lib/morning-image-generator";
import { getMorningImageTheme, getThemeForDesign } from "@/lib/morning-image-cache";

interface GenerateMorningImageRequest {
  designId?: string;
  theme?: string;
}

export const maxDuration = 300;

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
    const message = getGenerationErrorMessage(error);
    return NextResponse.json({
      error: message,
      code: getGenerationErrorCode(message),
    }, { status: 500 });
  }
}

function getGenerationErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Failed to generate replacement image";
}

function getGenerationErrorCode(message: string) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("timed out") || lowerMessage.includes("timeout")) return "IMAGE_TIMEOUT";
  if (lowerMessage.includes("api key") || lowerMessage.includes("unauthorized")) return "OPENAI_CONFIG";
  if (lowerMessage.includes("model")) return "IMAGE_MODEL";
  if (lowerMessage.includes("constraint") || lowerMessage.includes("conflict")) return "IMAGE_CACHE_CONSTRAINT";
  if (lowerMessage.includes("supabase") || lowerMessage.includes("storage")) return "IMAGE_STORAGE";
  return "IMAGE_GENERATION_FAILED";
}
