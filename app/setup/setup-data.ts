import { Bell, CalendarDays, Gift, Pill, UserRound } from "lucide-react";

export const setupSteps = [
  { label: "Loved one", railLabel: "Profile", icon: UserRound },
  { label: "Medication", railLabel: "Meds", icon: Pill },
  { label: "Reminders", railLabel: "Plans", icon: CalendarDays },
  { label: "Timing", railLabel: "Time", icon: Bell },
  { label: "Send link", railLabel: "Link", icon: Gift },
] as const;
