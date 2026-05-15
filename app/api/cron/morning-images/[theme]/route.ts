import { NextResponse } from "next/server";
import {
  generateCronMorningImage,
  getValidMorningImageTheme,
  rejectUnauthorizedCron,
} from "@/lib/morning-image-cron";

export const maxDuration = 300;

export async function GET(
  request: Request,
  context: { params: Promise<{ theme: string }> },
) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;

  const params = await context.params;
  const theme = getValidMorningImageTheme(params.theme);
  if (!theme) {
    return NextResponse.json({ error: "Unknown morning image theme" }, { status: 404 });
  }

  return generateCronMorningImage(theme);
}
