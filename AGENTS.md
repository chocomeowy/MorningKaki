# AGENTS.md — Project Rules for AI Coding Agents
# This file is read by Antigravity, Cursor, Codex, and Claude Code.

---

## Project: MorningKaki

A daily AI companion PWA for Singapore seniors, paired with a caregiver
setup wizard and dashboard for their adult children.

Every morning, the senior receives a personalised greeting with an
OpenAI-generated illustrated scene, checks in via voice or emoji mood sticker,
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
| POST   | `/api/morning`          | Generate greeting text from weather, reminders, news  |
| POST   | `/api/voice`            | Transcribe audio + generate reply + sentiment score   |
| POST   | `/api/mood`             | Log emoji sticker selection with timestamp            |
| POST   | `/api/push/subscribe`   | Save web push subscription to Supabase                |
| POST   | `/api/push/send`        | Manually trigger a push notification (demo use)       |
| POST   | `/api/tts`              | Generate spoken audio with ElevenLabs                 |
| GET    | `/api/voice-logs`       | Return signed caregiver voice-memory URLs             |
| GET    | `/api/morning-image`    | Return today's cached morning image or static fallback|
| POST   | `/api/morning-image/generate` | Generate and cache today's theme image          |
| GET    | `/api/image-proxy`      | Proxy images for sharing and display                  |

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
- Add medication manually in the setup flow for the current demo
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
2. OpenAI-generated or cached morning illustration — full width, ~40% screen height
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

### OpenAI
- Morning spoken script generation via the Responses API.
- Default morning model: `gpt-5.4-mini`.
- Morning fallback model: `gpt-5-nano` when access or model availability fails.
- Voice reply and sentiment generation: `gpt-5-nano`.
- Voice transcription: `whisper-1`.
- Morning image generation: `gpt-image-2-2026-04-21`.
- Always keep non-AI fallbacks for senior-facing flows so the morning screen
  can still render if an external service is unavailable.

### ElevenLabs (All TTS output)
- Morning greeting spoken aloud on screen load
- News card read aloud on 🔊 tap
- Voice reply to senior's spoken input
- Medication and appointment reminder announcements
- Use the ElevenLabs HTTP API from Next.js API routes
- Select a warm, unhurried voice — not a young tech assistant voice
- Language: match senior's profile language setting

### Static and Cached Visuals
- Mood stickers are static SVG sets in `public/stickers`.
- Daily theme backgrounds live in `public/daily-theme-*.png`.
- Generated morning images are cached in Supabase Storage and `daily_images`.
- Do not regenerate stickers at runtime.

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
│   ├── api/
│   │   ├── morning/        # Spoken script generation
│   │   ├── voice/          # Whisper, reply, sentiment, ElevenLabs
│   │   ├── tts/            # ElevenLabs-only text-to-speech
│   │   ├── mood/           # Mood log writes
│   │   ├── push/           # Web push subscribe/send
│   │   └── morning-image/  # Cached/generated image routes
│   ├── s/[token]/          # Senior PWA — fullscreen
│   │   └── page.tsx
│   ├── setup/              # Caregiver setup wizard
│   │   ├── page.tsx
│   │   ├── SetupWizard.tsx
│   │   └── _components/
│   ├── dashboard/[id]/     # Caregiver dashboard
│   │   ├── page.tsx
│   │   └── DashboardView.tsx
│   ├── generate/           # Demo generator page
│   └── generator/          # Supabase helper page
├── components/
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── morning-designs.ts  # Morning image theme prompts
│   ├── mood-stickers.ts    # Sticker metadata
│   ├── morning-image-cache.ts
│   └── supabase/
│       ├── client.ts       # Browser client
│       └── server.ts       # Server/service-role client
├── public/
│   ├── stickers/           # Static sticker SVG sets
│   ├── daily-theme-*.png   # Theme backgrounds
│   └── sw.js               # Service worker
└── AGENTS.md               # This file
```

---

## Tech Stack

| Layer           | Choice                                              |
|-----------------|-----------------------------------------------------|
| Frontend        | Next.js 16 (App Router), React 19, TypeScript strict|
| Styling         | Tailwind CSS v4, shadcn/ui, v0 for component gen    |
| Backend         | Next.js API Routes                                  |
| Database        | Supabase (PostgreSQL + Storage + Edge Functions)    |
| Package mgmt    | pnpm                                                |
| Image gen       | OpenAI `gpt-image-2-2026-04-21`                     |
| LLM             | OpenAI `gpt-5.4-mini` default, `gpt-5-nano` fallback|
| TTS             | ElevenLabs HTTP API                                 |
| Transcription   | OpenAI `whisper-1`                                  |
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

### Backend (Next.js API Routes)
- Keep route handlers thin and typed.
- Validate request payloads before calling external services or Supabase.
- Wrap OpenAI, ElevenLabs, web-push, and Supabase calls in try/catch with
  senior-friendly fallbacks where the senior PWA depends on the response.

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
