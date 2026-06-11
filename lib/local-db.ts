"use client";

// Check if window/localStorage is available (SSR safety)
const isBrowser = typeof window !== "undefined";

const KEYS = {
  SENIORS: "morningkaki:db:seniors",
  MEDICATIONS: "morningkaki:db:medications",
  REMINDERS: "morningkaki:db:reminders",
  MOOD_LOGS: "morningkaki:db:mood_logs",
  VOICE_LOGS: "morningkaki:db:voice_logs",
  PUSH_SUBSCRIPTIONS: "morningkaki:db:push_subscriptions",
};

export interface Senior {
  id: string;
  nickname: string;
  full_name: string;
  photo_url?: string;
  birth_date?: string;
  primary_language?: string | null;
  secondary_language?: string | null;
  morning_time?: string;
  quiet_start?: string;
  quiet_end?: string;
  magic_token: string;
  caregiver_id?: string;
  created_at: string;
}

export interface Medication {
  id: string;
  senior_id: string;
  name: string;
  dosage?: string;
  schedule_times?: string[];
  created_at: string;
  status?: string | null;
}

export interface Reminder {
  id: string;
  senior_id: string;
  text: string;
  remind_at: string;
  recurring: boolean;
  recurrence_rule?: string;
  acknowledged_at?: string | null;
}

export interface MoodLog {
  id: string;
  senior_id: string;
  sticker_type: string;
  timestamp: string;
}

export interface VoiceLog {
  id: string;
  senior_id: string;
  transcript: string;
  sentiment_label: string;
  sentiment_score: number;
  audio_url: string | null;
  timestamp: string;
}

export interface PushSubscription {
  id: string;
  senior_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// Helper safely parses string to JSON or returns fallback
function parseJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error parsing localStorage key "${key}":`, err);
    return fallback;
  }
}

// Helper safely writes data to localStorage
function writeJSON<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing localStorage key "${key}":`, err);
  }
}

// --- Seniors CRUD ---
export function getLocalSeniors(): Record<string, Senior> {
  return parseJSON<Record<string, Senior>>(KEYS.SENIORS, {});
}

export function saveLocalSenior(senior: Senior): void {
  const seniors = getLocalSeniors();
  seniors[senior.id] = senior;
  writeJSON(KEYS.SENIORS, seniors);
}

export function getLocalSeniorById(id: string): Senior | null {
  const seniors = getLocalSeniors();
  return seniors[id] || null;
}

export function getSeniorByToken(token: string): Senior | null {
  const seniors = getLocalSeniors();
  return Object.values(seniors).find((s) => s.magic_token === token) || null;
}

// --- Medications CRUD ---
export function getLocalMedications(seniorId: string): Medication[] {
  const all = parseJSON<Medication[]>(KEYS.MEDICATIONS, []);
  return all.filter((m) => m.senior_id === seniorId);
}

export function saveLocalMedications(seniorId: string, medications: Medication[]): void {
  let all = parseJSON<Medication[]>(KEYS.MEDICATIONS, []);
  all = all.filter((m) => m.senior_id !== seniorId);
  all.push(...medications);
  writeJSON(KEYS.MEDICATIONS, all);
}

export function updateLocalMedicationStatus(medicationId: string, status: string | null): void {
  const all = parseJSON<Medication[]>(KEYS.MEDICATIONS, []);
  const index = all.findIndex((m) => m.id === medicationId);
  if (index !== -1) {
    all[index].status = status;
    writeJSON(KEYS.MEDICATIONS, all);
  }
}

// --- Reminders CRUD ---
export function getLocalReminders(seniorId: string): Reminder[] {
  const all = parseJSON<Reminder[]>(KEYS.REMINDERS, []);
  return all.filter((r) => r.senior_id === seniorId);
}

export function saveLocalReminders(seniorId: string, reminders: Reminder[]): void {
  let all = parseJSON<Reminder[]>(KEYS.REMINDERS, []);
  all = all.filter((r) => r.senior_id !== seniorId);
  all.push(...reminders);
  writeJSON(KEYS.REMINDERS, all);
}

export function updateLocalReminder(reminderId: string, acknowledgedAt: string | null): void {
  const all = parseJSON<Reminder[]>(KEYS.REMINDERS, []);
  const index = all.findIndex((r) => r.id === reminderId);
  if (index !== -1) {
    all[index].acknowledged_at = acknowledgedAt;
    writeJSON(KEYS.REMINDERS, all);
  }
}

// --- Mood Logs CRUD ---
export function getLocalMoodLogs(seniorId: string): MoodLog[] {
  const all = parseJSON<MoodLog[]>(KEYS.MOOD_LOGS, []);
  return all.filter((m) => m.senior_id === seniorId);
}

export function saveLocalMoodLog(seniorId: string, stickerType: string): void {
  const all = parseJSON<MoodLog[]>(KEYS.MOOD_LOGS, []);
  const newLog: MoodLog = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    senior_id: seniorId,
    sticker_type: stickerType,
    timestamp: new Date().toISOString(),
  };
  all.push(newLog);
  writeJSON(KEYS.MOOD_LOGS, all);
}

// --- Voice Logs CRUD ---
export function getLocalVoiceLogs(seniorId: string): VoiceLog[] {
  const all = parseJSON<VoiceLog[]>(KEYS.VOICE_LOGS, []);
  return all
    .filter((v) => v.senior_id === seniorId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function saveLocalVoiceLog(seniorId: string, log: Omit<VoiceLog, "id" | "senior_id" | "timestamp">): void {
  const all = parseJSON<VoiceLog[]>(KEYS.VOICE_LOGS, []);
  const newLog: VoiceLog = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    senior_id: seniorId,
    timestamp: new Date().toISOString(),
    ...log,
  };
  all.push(newLog);
  writeJSON(KEYS.VOICE_LOGS, all);
}

// --- Push Subscriptions CRUD ---
export function getLocalSubscriptions(seniorId: string): PushSubscription[] {
  const all = parseJSON<PushSubscription[]>(KEYS.PUSH_SUBSCRIPTIONS, []);
  return all.filter((s) => s.senior_id === seniorId);
}

export function saveLocalSubscription(seniorId: string, subscription: any): void {
  const all = parseJSON<PushSubscription[]>(KEYS.PUSH_SUBSCRIPTIONS, []);
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys?.p256dh || "";
  const auth = subscription.keys?.auth || "";

  const existingIndex = all.findIndex((s) => s.endpoint === endpoint);
  if (existingIndex !== -1) {
    all[existingIndex].senior_id = seniorId;
  } else {
    all.push({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      senior_id: seniorId,
      endpoint,
      p256dh,
      auth,
      created_at: new Date().toISOString(),
    });
  }
  writeJSON(KEYS.PUSH_SUBSCRIPTIONS, all);
}
