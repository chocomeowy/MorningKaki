import { generateCronMorningImage, rejectUnauthorizedCron } from "@/lib/morning-image-cron";

export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;

  return generateCronMorningImage("blessing");
}
