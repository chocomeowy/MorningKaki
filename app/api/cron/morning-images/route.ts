import { NextResponse } from "next/server";
import { generateAndCacheMorningImage } from "@/lib/morning-image-generator";
import { getSingaporeDateString, morningImageThemes } from "@/lib/morning-image-cache";

export async function GET(request: Request) {
  // Check authorization for cron job (Vercel adds this header automatically)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = getSingaporeDateString();
  console.log(`Starting daily image generation for ${today}`);

  try {
    const generationPromises = morningImageThemes.map(async (theme) => {
      console.log(`Generating image for theme: ${theme.name}`);

      try {
        const generatedImage = await generateAndCacheMorningImage(theme.name);
        return { ...generatedImage, success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown image generation error";
        console.error(`Error generating ${theme.name}:`, err);
        return { theme: theme.name, success: false, error: message };
      }
    });
    
    const results = await Promise.all(generationPromises);
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0) {
      return NextResponse.json({ 
        message: "Partial success", 
        results,
        date: today 
      }, { status: 207 }); // Multi-Status
    }
    
    return NextResponse.json({ success: true, results, date: today });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron job failed";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Cron job outer failed:", error);
    return NextResponse.json({ 
      error: message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined
    }, { status: 500 });
  }
}
