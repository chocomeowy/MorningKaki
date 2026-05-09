# AGENTS.md — Project Rules for AI Coding Agents
# This file is read by Antigravity, Cursor, Codex, and Claude Code.

---

## Project: MorningKaki

A daily AI companion PWA for Singapore seniors, paired with a caregiver
setup wizard and dashboard for their adult children.

Every morning, the senior receives a personalised greeting with a
Fal-generated illustrated scene, checks in via voice or emoji mood sticker,
sees their reminders and local news — all spoken aloud in their language.
The caregiver gets a quiet daily summary with mood trends, sentiment
analysis, and saved voice memories. No app store. No senior login. Just a
home screen icon and a tap.

---

## Hackathon Mode (Active)

These rules override the Testing Requirements section below for the duration
of the hackathon sprint.

- Skip unit tests and coverage requirements entirely.
- Prioritise a working, demo-ready feature over clean architecture.
- Hardcode non-sensitive demo values where it unblocks progress (e.g. weather
  condition = "sunny", news feed = CNA RSS, notification time = 7:30am default).
- Pre-generated sticker assets are static files — do not regenerate them at
  runtime.
- All Safety Guardrails remain non-negotiable even in hackathon mode.
- Placeholder UI is acceptable for stretch features (HealthBuddy link,
  voice clone). Label them clearly with a "Coming Soon" badge component.

---

## Architecture Overview

### Two Views, One PWA

**Senior View** — installed as a PWA home screen icon on the senior's phone.
Fullscreen, no browser chrome, no navigation bar. One screen, always the
same structure. Accessed via magic token URL.

**Caregiver View** — standard Next.js app at `/setup` and `/dashboard`.
Full navigation. All configuration and monitoring lives here.

### Key Routes

| Route                  | Description                                      |
|------------------------|--------------------------------------------------|
| `/s/[token]`           | Senior PWA (fullscreen, token resolves profile)  |
| `/setup`               | Caregiver 5-step setup wizard                    |
| `/dashboard/[id]`      | Caregiver dashboard (Today / Trends / Memories)  |

### Key API Endpoints

| Method | Path                    | Description                                           |
|--------|-------------------------|-------------------------------------------------------|
| POST   | `/api/morning`          | Generate greeting text + trigger Fal illustration     |
| POST   | `/api/voice`            | Transcribe audio + generate reply + sentiment score   |
| POST   | `/api/mood`             | Log emoji sticker selection with timestamp            |
| POST   | `/api/push/subscribe`   | Save web push subscription to Supabase                |
| POST   | `/api/push/send`        | Manually trigger a push notification (demo use)       |
| GET    | `/api/summary/[id]`     | Caregiver daily summary for a given senior            |
| POST   | `/api/medications/scan` | Fal multimodal scan of medication label photo         |

---

## Caregiver Setup Flow (5 Steps)

Must feel like setting up a gift, not filling a government form. Each step
is a single focused screen. Progress indicator visible throughout.

**Step 1 — About your loved one**
- Full name and preferred nickname (Ah Gong, Mum, Po Po)
- Photo upload — stored in Supabase Storage, used in illustration prompts
- Date of birth — for birthday personalisation
- Primary language: English, Mandarin, Hokkien, Cantonese, Malay
- Secondary language toggle (optional)

**Step 2 — Medications**
- "Add medication" opens camera — photo sent to `/api/medications/scan`
- Fal reads the label, extracts name and dosage, pre-fills the form
- Caregiver confirms or edits before saving
- Schedule: morning after breakfast / evening after dinner / custom time
- Unlimited entries

**Step 3 — Appointments and custom reminders**
- Add appointment: type, date, time, location (free text)
- Custom reminders: any text, any time, one-off or recurring
- "Link HealthBuddy (Coming Soon)" placeholder button — do not implement,
  just render the UI with a Coming Soon badge
- "Forward clinic SMS (Coming Soon)" — same treatment

**Step 4 — Notification settings**
- Morning greeting time picker (default 07:30)
- Medication reminder times (auto-populated from Step 2, editable)
- Appointment reminders: 1 day before toggle, 1 hour before toggle
- Quiet hours window (do not disturb)
- All values stored to Supabase `seniors` and `reminders` tables

**Step 5 — Send the magic link**
- Preview of the senior's morning screen with their name and photo
- Generate unique token URL: `morningkaki.vercel.app/s/[token]`
- Share options:
  - WhatsApp deep link (pre-written message in senior's chosen language)
  - SMS share via Web Share API
  - QR code rendered on screen (use `qrcode.react`)
- On senior's first open: token resolves to profile, web push permission
  requested with a friendly prompt, PWA install banner triggered

WhatsApp message templates (use senior's language from Step 1):
- English: "Mum, tap this link and add it to your home screen.
  I'll send you a good morning every day. ❤️ [URL]"
- Mandarin: "妈妈，点这里，每天早上我会给你发早安 ❤️ [URL]"

---

## Senior PWA Screen Layout

One screen. No scrolling required for core content. Large text minimum 18px,
high contrast, warm colour palette. No navigation bar. No settings visible.

Structure (top to bottom):
1. App bar: "MorningKaki" wordmark left, [EN] [中] language toggle right
2. Fal-generated morning illustration — full width, ~40% screen height
3. Greeting text: "Good morning, [Nickname]!" + date + weather condition
4. TAP TO TALK button — large, prominent, rounded, microphone icon
5. Emoji sticker row — 5 stickers, pre-generated, always the same 5:
   😊 Energetic  😴 Tired  🌧️ Feeling down  ❤️ Grateful  😕 Confused
6. TODAY section — medication reminders and appointments for today
7. NEWS section — 2 to 3 local news cards, each with a 🔊 speak button
8. Share to WhatsApp button — shares today's illustration + greeting as image

Language toggle switches all text and re-requests ElevenLabs audio.
Illustration does not regenerate on language toggle.

---

## Caregiver Dashboard (3 Tabs)

**Today tab**
- Senior's mood sticker for today (or "Not yet checked in" state)
- Reminders acknowledged vs pending
- AI-generated one-paragraph voice conversation summary
- Alerts: missed medication streak, negative mood streak (3+ days)

**Trends tab**
- Mood chart: daily sticker plotted over 7 / 30 / 90 day toggle
- Sentiment score line chart (derived from voice transcript analysis)
- Medication adherence rate as a percentage
- All charts: Recharts. No D3 — keep it simple.
- Seed with realistic fake data for the hackathon demo if real data
  is insufficient

**Memories tab**
- Chronological list of saved voice recordings
- Each entry: date, mood sticker, transcript excerpt, audio play button
- "Voice Clone (Coming Soon)" banner at top of tab

---

## AI Services

### Gemini (Primary LLM)
- Morning greeting generation (English and Mandarin)
- News summarisation from CNA RSS — 2 sentences per item, local context
- Conversational voice reply to senior's spoken input
- Sentiment analysis on voice transcripts:
  Return a JSON object: `{ "score": 0-100, "label": "positive|neutral|low|distressed" }`
- Use `google-generativeai` Python SDK on the backend
- Model: `gemini-2.5-pro` for complex tasks, `gemini-2.0-flash` for fast replies

### Whisper (OpenAI — transcription only)
- Transcribe senior's voice recording from MediaRecorder audio blob
- Send as multipart form to OpenAI Whisper endpoint
- Return transcript string to Gemini for reply generation

### ElevenLabs (All TTS output)
- Morning greeting spoken aloud on screen load
- News card read aloud on 🔊 tap
- Voice reply to senior's spoken input
- Medication and appointment reminder announcements
- Use `elevenlabs` Python SDK
- Select a warm, unhurried voice — not a young tech assistant voice
- Language: match senior's profile language setting

### Fal (Image generation)
- Daily morning illustration — generated once per morning per senior
  Prompt template: "Soft watercolour illustration, warm pastel colours,
  Singapore context, [weather condition] morning, [mood hint from yesterday],
  cosy and cheerful, no text, suitable for elderly audience"
- Medication label scan — multimodal input, extract name and dosage as JSON
- Onboarding sticker generation — run once during caregiver setup,
  save 5 static files to Supabase Storage, never regenerate at runtime
  Style: "Soft watercolour round character, warm pastel, simple and clear,
  elderly-friendly, Singapore cultural warmth"

### LiteLLM (Fallback routing)
- Wrap all LLM calls in LiteLLM so the provider can be swapped without
  rewriting service logic
- Primary: Gemini. Fallback: OpenAI GPT-4o if Gemini credits run out

---

## Web Push Implementation

- Use `web-push` npm library on the Next.js API route layer
- Generate VAPID keys once, store in `.env` as `VAPID_PUBLIC_KEY` and
  `VAPID_PRIVATE_KEY`
- On senior PWA first load: call `PushManager.subscribe()`, POST the
  subscription object to `/api/push/subscribe`, save to `push_subscriptions`
  table in Supabase
- Supabase Edge Function on cron (every minute): query seniors whose
  `morning_time` matches current time, send push via web-push protocol
- Notification payload: `{ title: "🌅 Good morning, [Nickname]!",
  body: "Your morning is ready.", url: "/s/[token]" }`
- Medication reminders: same Edge Function checks `reminders` table
- For hackathon demo: use `/api/push/send` to manually trigger a push
  rather than relying on the cron

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Core profile
seniors (
  id uuid primary key,
  nickname text,
  full_name text,
  photo_url text,
  birth_date date,
  primary_language text,  -- 'en' | 'zh' | 'hokkien' | 'cantonese' | 'ms'
  secondary_language text,
  morning_time time,       -- default 07:30
  quiet_start time,
  quiet_end time,
  magic_token text unique,
  caregiver_id uuid,
  created_at timestamptz
)

-- Medications
medications (
  id uuid primary key,
  senior_id uuid references seniors,
  name text,
  dosage text,
  schedule_times time[],   -- array of reminder times
  created_at timestamptz
)

-- Reminders (appointments + custom)
reminders (
  id uuid primary key,
  senior_id uuid references seniors,
  text text,
  remind_at timestamptz,
  recurring boolean,
  recurrence_rule text,    -- RRULE string for recurring
  acknowledged_at timestamptz
)

-- Daily mood logs
mood_logs (
  id uuid primary key,
  senior_id uuid references seniors,
  sticker_type text,       -- 'energetic'|'tired'|'down'|'grateful'|'confused'
  timestamp timestamptz
)

-- Voice interaction logs
voice_logs (
  id uuid primary key,
  senior_id uuid references seniors,
  transcript text,
  sentiment_label text,
  sentiment_score int,     -- 0-100
  audio_url text,          -- Supabase Storage URL
  timestamp timestamptz
)

-- Web push subscriptions
push_subscriptions (
  id uuid primary key,
  senior_id uuid references seniors,
  endpoint text,
  p256dh text,
  auth text,
  created_at timestamptz
)
```

---

## Folder Structure

```
/
├── app/
│   ├── s/[token]/          # Senior PWA — fullscreen
│   │   └── page.tsx
│   ├── setup/              # Caregiver setup wizard
│   │   ├── page.tsx        # Step router
│   │   └── steps/          # Step1.tsx through Step5.tsx
│   └── dashboard/[id]/     # Caregiver dashboard
│       ├── page.tsx
│       └── tabs/           # Today.tsx, Trends.tsx, Memories.tsx
├── components/
│   ├── senior/             # Large-text, high-contrast senior UI
│   │   ├── MorningCard.tsx
│   │   ├── TalkButton.tsx
│   │   ├── MoodStickerRow.tsx
│   │   ├── ReminderCard.tsx
│   │   └── NewsCard.tsx
│   ├── caregiver/          # Standard dashboard components
│   │   ├── MoodChart.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── VoiceMemoryItem.tsx
│   │   └── AlertBanner.tsx
│   └── ui/                 # shadcn/ui + v0-generated base components
├── lib/
│   ├── ai/
│   │   ├── gemini.ts       # Greeting, summarisation, sentiment, reply
│   │   ├── elevenlabs.ts   # TTS for all spoken output
│   │   ├── fal.ts          # Illustration + medication scan
│   │   └── whisper.ts      # Voice transcription
│   ├── push/
│   │   ├── vapid.ts        # VAPID key helpers
│   │   └── service-worker/ # SW registration + push handler
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client
│       └── queries.ts      # Typed query helpers
├── backend/                # Python FastAPI (if needed alongside Next.js API routes)
│   ├── routers/
│   ├── services/
│   ├── schemas/
│   └── prompts.py          # All LLM prompt templates as string constants
├── public/
│   └── stickers/           # 5 pre-generated sticker PNGs (static, never regenerate)
├── prompts/                # Prompt templates mirrored for frontend use if needed
└── AGENTS.md               # This file
```

---

## Tech Stack

| Layer           | Choice                                              |
|-----------------|-----------------------------------------------------|
| Frontend        | Next.js 15 (App Router), React, TypeScript strict   |
| Styling         | Tailwind CSS v4, shadcn/ui, v0 for component gen    |
| Backend         | Next.js API Routes (primary) + Python FastAPI (AI)  |
| Database        | Supabase (PostgreSQL + Storage + Edge Functions)    |
| Package mgmt    | pnpm (frontend), uv (backend)                       |
| Image gen       | Fal (Flux model)                                    |
| LLM             | Gemini 2.5 Pro via LiteLLM (OpenAI as fallback)     |
| TTS             | ElevenLabs                                          |
| Transcription   | OpenAI Whisper                                      |
| Push            | Web Push API + web-push library + Supabase cron     |
| Deploy          | Vercel (frontend + API routes)                      |
| QR code         | qrcode.react                                        |
| Charts          | Recharts                                            |

---

## Code Quality and Architecture

### General
- Maximum file length: 300 lines — split larger files into modules.
- Maximum function length: 30 lines.
- Cyclomatic complexity limit: 10 per function.
- No `console.log` or `print()` in production paths — use a structured logger.
- When uncertain about intent, ask rather than guessing.

### Frontend (Next.js / React)
- Use the App Router (`app/` directory) exclusively.
- Default to React Server Components. Only use `"use client"` when
  interactivity or hooks are strictly required.
- Prefer named exports over default exports.
- Use `interface` for object shapes, `type` for unions and intersections.
- Keep components small and focused on a single responsibility.
- Senior-facing components: minimum 18px text, minimum 48px tap targets,
  warm colour palette, no small icons without labels.

### Backend (Python / FastAPI)
- Modular structure: separate `routers`, `schemas`, `models`, `services`,
  `dependencies`.
- Use `async def` for I/O bound routes. Use `def` for CPU bound routes.
- Strictly type all arguments and return values with type hints and Pydantic.
- Keep routers thin — move all logic to `services/`.

---

## Testing Requirements

> Suspended in Hackathon Mode. Resume for production.

- Write unit tests for every new utility function.
- Minimum 80% coverage on new code.
- Ensure all types pass strict checking before marking a task complete.

---

## Safety Guardrails (Critical — never suspended)

- Never write to the database without explicit user confirmation.
- Never commit `.env`, `.env.local`, or any file containing secrets.
- Never hardcode credentials, API keys, or tokens. Use environment variables.
- Validate all user input before processing (Pydantic on backend, Zod on
  frontend).
- Wrap all external API calls in try/catch with proper error handling.
- Senior voice recordings are private — never expose audio URLs without
  authentication. Caregiver dashboard requires auth before rendering.
- Sentiment analysis results are sensitive — treat as personal health data.

---

## Git Conventions

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`.
- Keep PRs under 400 lines of diff when possible.
- Always include a brief summary in the commit body for non-trivial changes.

---

## Communication

- Be concise — skip explanations of basic concepts.
- When suggesting a change, explain the why, not just the what.
- If you notice a potential bug while working on something else, stop
  and flag it.
- Always suggest the simplest solution that meets the requirements.
- For senior-facing UI changes: default to larger, simpler, warmer.
  When in doubt, make the button bigger.
