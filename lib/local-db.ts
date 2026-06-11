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

// --- URL Serialization for Self-Contained Sharing ---

export interface SetupWizardSerializedData {
  fullName: string;
  nickname: string;
  language: string;
  medications: { id: string; name: string; timing: string }[];
  reminders: { id: string; name: string; date: string; time: string; location: string }[];
  timings: {
    morning: string;
    med: string;
    quietStart: string;
    quietEnd: string;
  };
}

export function serializeSetupData(data: SetupWizardSerializedData): string {
  try {
    const payload = {
      n: data.nickname,
      fn: data.fullName,
      l: data.language,
      m: data.medications.filter((med) => med.name.trim()).map((med) => ({
        n: med.name.trim(),
        t: data.timings.med ? [data.timings.med] : [],
      })),
      r: data.reminders.filter((rem) => rem.name.trim()).map((rem) => ({
        t: rem.location.trim() ? `${rem.name.trim()} (${rem.location.trim()})` : rem.name.trim(),
        d: `${rem.date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })}T${rem.time}:00+08:00`,
      })),
      t: {
        m: data.timings.morning,
        qs: data.timings.quietStart,
        qe: data.timings.quietEnd,
      }
    };
    const jsonStr = JSON.stringify(payload);
    // Safe Base64 encoding supporting unicode
    const b64 = isBrowser 
      ? window.btoa(unescape(encodeURIComponent(jsonStr))) 
      : Buffer.from(jsonStr).toString("base64");
    return b64;
  } catch (err) {
    console.error("Failed to serialize setup data:", err);
    return "";
  }
}

export function deserializeAndSaveSetupData(token: string, base64Data: string): Senior | null {
  try {
    const jsonStr = isBrowser
      ? decodeURIComponent(escape(window.atob(base64Data)))
      : Buffer.from(base64Data, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    
    const seniorId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    
    const seniorProfile: Senior = {
      id: seniorId,
      nickname: payload.n || "Ah Gong",
      full_name: payload.fn || "Ah Gong",
      primary_language: payload.l || "en",
      secondary_language: null,
      magic_token: token,
      morning_time: payload.t?.m || "07:30",
      quiet_start: payload.t?.qs || "21:00",
      quiet_end: payload.t?.qe || "07:00",
      created_at: new Date().toISOString(),
    };

    const medications: Medication[] = (payload.m || []).map((med: any) => ({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      senior_id: seniorId,
      name: med.n,
      dosage: "",
      schedule_times: med.t || [],
      created_at: new Date().toISOString(),
    }));

    const reminders: Reminder[] = (payload.r || []).map((rem: any) => ({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      senior_id: seniorId,
      text: rem.t,
      remind_at: rem.d,
      recurring: false,
      acknowledged_at: null,
    }));

    saveLocalSenior(seniorProfile);
    saveLocalMedications(seniorId, medications);
    saveLocalReminders(seniorId, reminders);

    return seniorProfile;
  } catch (err) {
    console.error("Failed to deserialize setup data:", err);
    return null;
  }
}
