# TinyTaps — Implementation Plan

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Astro 5 (SSR) + Svelte 5 | Astro for routing/SSR, Svelte for interactive islands |
| Styling | Tailwind CSS 4 | Utility-first, design tokens via CSS variables |
| Hosting | Cloudflare Pages | With `@astrojs/cloudflare` adapter |
| Database | Cloudflare D1 | SQLite-compatible relational store |
| Object Storage | Cloudflare R2 | Images, uploaded audio, cached TTS audio |
| KV Store | Cloudflare KV | Admin session tokens |
| TTS | Edge TTS lib | Provided later; called from Workers |
| Build Tool | Bun | Dev server, install, scripts |
| Font | Nunito (Google Fonts) | Rounded, friendly, matches design system |

---

## 2. Project Structure

```
tiny-taps/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── bun.lock
├── wrangler.jsonc              # D1, R2, KV bindings
├── tsconfig.json
├── plan/
│   ├── design_system.md
│   └── implementation_plan.md
├── db/
│   └── schema.sql              # D1 migration
├── src/
│   ├── env.d.ts                # Cloudflare bindings type augmentation
│   ├── middleware.ts            # Auth middleware for /admin routes
│   ├── lib/
│   │   ├── db.ts               # D1 query helpers
│   │   ├── r2.ts               # R2 upload/fetch helpers
│   │   ├── kv.ts               # KV session helpers
│   │   ├── auth.ts             # Login/session validation
│   │   ├── tts.ts              # Edge TTS wrapper + R2 cache logic
│   │   ├── voices.ts           # TTS voice definitions
│   │   └── tags.ts             # Predefined tag definitions
│   ├── components/
│   │   ├── TopicCard.svelte    # Dashboard topic card
│   │   ├── SubjectCard.svelte  # Tappable subject card (core UX)
│   │   ├── AudioEngine.svelte  # Sequential audio player
│   │   ├── TagFilter.svelte    # Tag filter chips
│   │   ├── Pagination.svelte   # Pagination controls
│   │   ├── NavHome.svelte      # Home icon button
│   │   ├── AdminLayout.svelte  # Admin shell (sidebar/nav)
│   │   ├── SoundEditor.svelte  # Admin: ordered sound list editor
│   │   └── ImageUpload.svelte  # Admin: image upload with preview
│   ├── layouts/
│   │   ├── PublicLayout.astro  # Cream background, viewport safe
│   │   └── AdminLayout.astro   # Standard scrollable admin layout
│   ├── pages/
│   │   ├── index.astro                     # Dashboard
│   │   ├── topic/
│   │   │   └── [slug].astro                # Play page
│   │   ├── admin/
│   │   │   ├── index.astro                 # Login page
│   │   │   ├── dashboard.astro             # Admin dashboard
│   │   │   ├── tags.astro                  # Manage tags
│   │   │   ├── topics/
│   │   │   │   ├── index.astro             # List topics
│   │   │   │   ├── new.astro               # Create topic
│   │   │   │   └── [id]/
│   │   │   │       ├── edit.astro          # Edit topic
│   │   │   │       └── subjects.astro      # Manage subjects + sounds
│   │   ├── api/
│   │   │   ├── subjects/
│   │   │   │   └── [id]/
│   │   │   │       └── sounds.ts           # GET → resolve audio URLs
│   │   │   ├── topics.ts                   # GET → public paginated list
│   │   │   └── admin/
│   │   │       ├── login.ts                # POST → authenticate
│   │   │       ├── logout.ts               # POST → destroy session
│   │   │       ├── topics.ts               # CRUD
│   │   │       ├── subjects.ts             # CRUD
│   │   │       ├── sounds.ts               # CRUD
│   │   │       ├── tags.ts                 # CRUD
│   │   │       └── upload.ts               # POST → R2 upload
│   └── styles/
│       └── global.css           # Tailwind directives + design tokens
└── public/
    └── favicon.svg
```

---

## 3. Data Model (D1)

### 3.1 Schema

```sql
-- db/schema.sql

CREATE TABLE IF NOT EXISTS tags (
  id       TEXT PRIMARY KEY,  -- UUID
  name     TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',  -- 'age' | 'category'
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
  id                TEXT PRIMARY KEY,  -- UUID
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  background_key    TEXT,              -- R2 object key
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topic_tags (
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id         TEXT PRIMARY KEY,  -- UUID
  topic_id   TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  image_key  TEXT,              -- R2 object key
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sounds (
  id            TEXT PRIMARY KEY,  -- UUID
  subject_id    TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  delay_before_ms INTEGER NOT NULL DEFAULT 0,  -- delay in ms before playing this sound (e.g. 800 for voiceover)
  type          TEXT NOT NULL CHECK(type IN ('text', 'file')),
  -- For type='text'
  text_content  TEXT,
  language      TEXT DEFAULT 'en-US',
  voice         TEXT DEFAULT 'en-US-AvaMultilingualNeural',
  -- For type='file'
  file_key      TEXT,              -- R2 object key (uploaded mp3)
  -- TTS cache
  cache_key     TEXT,              -- R2 object key (generated mp3)
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_subjects_topic ON subjects(topic_id, sort_order);
CREATE INDEX idx_sounds_subject ON sounds(subject_id, sort_order);
CREATE INDEX idx_topic_tags_tag ON topic_tags(tag_id);
```

### 3.2 R2 Key Convention

```
images/topics/{topic_id}/{filename}
images/subjects/{subject_id}/{filename}
audio/uploads/{sound_id}/{filename}
audio/tts/{sha256_hash}.mp3          # hash of (text + language + voice)
```

---

## 4. Cloudflare Bindings

### wrangler.jsonc

```jsonc
{
  "name": "tiny-taps",
  "compatibility_date": "2025-01-15",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    { "binding": "DB", "database_name": "tiny-taps-db", "database_id": "<ID>" }
  ],
  "r2_buckets": [
    { "binding": "R2", "bucket_name": "tiny-taps-assets" }
  ],
  "kv_namespaces": [
    { "binding": "KV", "id": "<ID>" }
  ],
  // ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set as secrets only:
  //   wrangler secret put ADMIN_USERNAME
  //   wrangler secret put ADMIN_PASSWORD_HASH
  // Do NOT put credentials in "vars" — they would be plaintext in the repo.
}
```

Environment secrets (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`) set via `wrangler secret` or Pages dashboard.

---

## 5. Authentication

### Flow
1. Admin visits `/admin` → login form.
2. POST `/api/admin/login` with `{ username, password }`.
3. Worker compares username to `ADMIN_USERNAME`, hashes password with SHA-256 and compares to `ADMIN_PASSWORD_HASH`.
4. On success → generate session token (UUID), store in KV with TTL 24h, set `HttpOnly` cookie.
5. Middleware (`src/middleware.ts`) intercepts all `/admin/*` routes (except `/admin/index.astro` login page) and `/api/admin/*`, validates session cookie against KV. Redirect to `/admin` if invalid.

---

## 6. API Design

### 6.1 Public APIs

#### `GET /api/topics?tag={tagId}&page={n}&pageSize={n}`
Returns paginated topics grouped by tags.
```
Response: {
  groups: [
    {
      tag: { id, name, category },
      topics: [{ id, title, slug, backgroundUrl, tags: [...] }]
    }
  ],
  pagination: { page, pageSize, total }
}
```

#### `GET /api/topics/{slug}/subjects`
Returns all subjects and their resolved sound URLs for a topic (used by play page SSR and client preloading).
```
Response: {
  subjects: [
    {
      id, title, imageUrl, sortOrder,
      sounds: [
        { sortOrder: 0, delayBeforeMs: 0, url: "https://r2-public-url/audio/tts/abc123.mp3" },
        { sortOrder: 1, delayBeforeMs: 800, url: "https://r2-public-url/audio/uploads/def456/cow.mp3" }
      ]
    }
  ]
}
```

#### `GET /api/subjects/{subjectId}/sounds`
Resolves all sounds for a single subject into playable URLs (used by admin preview).
```
Response: {
  sounds: [
    { sortOrder: 0, delayBeforeMs: 0, url: "https://r2-public-url/audio/tts/abc123.mp3" },
    { sortOrder: 1, delayBeforeMs: 800, url: "https://r2-public-url/audio/uploads/def456/cow.mp3" }
  ]
}
```

**Worker logic per sound:**
1. If `type === 'file'` → return R2 presigned/public URL from `file_key`.
2. If `type === 'text'`:
   a. Compute cache key: `audio/tts/{sha256(text + language + voice)}.mp3`
   b. Check R2 for `cache_key` → if exists, return URL.
   c. If miss → call Edge TTS lib → get audio buffer → PUT to R2 → update `cache_key` in D1 → return URL.

### 6.2 Admin APIs

| Method | Path | Action |
|---|---|---|
| POST | `/api/admin/login` | Authenticate |
| POST | `/api/admin/logout` | Destroy session |
| GET/POST | `/api/admin/tags` | List / Create tag |
| PUT/DELETE | `/api/admin/tags` | Update / Delete tag (by id in body) |
| GET/POST | `/api/admin/topics` | List / Create topic |
| PUT/DELETE | `/api/admin/topics` | Update / Delete topic |
| GET/POST | `/api/admin/subjects` | List (by topic_id) / Create |
| PUT/DELETE | `/api/admin/subjects` | Update / Delete |
| GET/POST | `/api/admin/sounds` | List (by subject_id) / Create |
| PUT/DELETE | `/api/admin/sounds` | Update / Delete |
| POST | `/api/admin/upload` | Upload file to R2, returns key + URL |

---

## 7. Page Designs

### 7.1 Dashboard (`/` — Public)

**Layout:** `PublicLayout.astro` — Cream background. Dashboard uses its own touch rules (NOT the play-page viewport lock).

**Structure:**
- Top bar: App logo/title ("TinyTaps 🐾"), no other nav needed.
- Tag filter row: horizontal scrollable chip bar (predefined tags). Each chip uses an **icon/emoji + text label** (e.g. 🐾 Animals, 🚗 Vehicles) so toddlers can recognize by icon while parents can read text. Active tag highlighted with `Sky Blue`.
- Topic groups: Each tag group as a section heading, followed by a responsive grid of `TopicCard` components.
- Pagination: Bottom, large tap targets (≥100px), simple prev/next with page dots.

**TopicCard.svelte:**
- 200×200px minimum on mobile, scales up.
- Background image (from R2) with gradient overlay.
- `border: 4px solid` dark-gray + `border-radius: 24px`, soft shadow (per design system §2.3).
- Title overlay at bottom (Nunito, 24pt, white text with shadow).
- Tag pills below title.
- Tap → navigate to `/topic/{slug}`.

**Scrolling:** Vertical scroll allowed. Dashboard layout sets `touch-action: pan-y` (NOT `touch-action: none`). See §7.2 for how viewport lock is applied selectively.

### 7.2 Play Page (`/topic/[slug]` — Public)

**Layout:** Full viewport lock per design system (no scroll, no zoom, no select).

The viewport lock CSS is applied **only** on the play page (via a `.viewport-lock` class on the `<body>` or within the play-page layout), NOT globally in `global.css`. This keeps the dashboard scrollable without hacks.

```css
.viewport-lock {
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
```

**Data Loading & Audio Preloading (Critical for <100ms):**
1. Astro SSR frontmatter fetches all subjects + resolved sound URLs via D1/R2 (or calls the internal `GET /api/topics/{slug}/subjects` logic).
2. Subject data (including all sound URLs) is passed as props to the Svelte island.
3. On Svelte mount, `AudioEngine` **preloads all audio buffers** using Web Audio API `fetch()` → `AudioContext.decodeAudioData()`.
4. On tap, playback is purely local from pre-decoded buffers — **zero network latency**.

**Structure:**
- Top-left: Home button (house icon, 100×100px) → navigates to `/`.
- Topic title centered at top (48pt, Nunito, `text-transform: uppercase` per design system §2.2).
- Subject grid: responsive grid of `SubjectCard` components. Grid fills remaining viewport.
  - On phones: 2 columns.
  - On tablets: 3-4 columns.
  - If subjects exceed viewport → paginated with large arrow buttons (≥100px). No native swipe (blocked by `touch-action: none`). Swipe can be implemented via JavaScript `pointer` events if desired.
- **Empty state:** If topic has zero subjects, show a friendly illustration with a "Coming soon!" visual cue (no text-only messages).

**SubjectCard.svelte (Core Component):**
- Minimum 100×100px (scales to fill grid cell, maintaining aspect ratio).
- Shows subject image (from R2) with 4px dark-gray border, `border-radius: 24px`.
- Title below image (24pt, centered, `text-transform: uppercase` per design system §2.2).
- **Idle state:** Gentle breathing animation (`scale 1.0 → 1.02`, CSS keyframes):
  ```css
  @keyframes breathe {
    0%, 100% { transform: scale(1.0); }
    50% { transform: scale(1.02); }
  }
  animation: breathe 3s ease-in-out infinite;
  ```
- **Active state (on tap):**
  1. Immediate `transform: scale(0.9)` (CSS transition, <50ms).
  2. `border: 8px solid #FFD93D` (Sun Yellow glow).
  3. Wiggle animation (CSS keyframes).
  4. Plays pre-decoded audio buffers via `AudioEngine` (no network call on tap).
- **Multi-touch shielding:** Only respond to first `pointerdown` event. Subsequent simultaneous touches (palm mashing) are ignored. However, tapping a **different** card cancels the current card's audio and starts the new card's sequence — the child is never "locked out" of interacting with other cards.

**AudioEngine.svelte:**
- Uses **Web Audio API** (`AudioContext` + `decodeAudioData`). No `HTMLAudioElement` fallback — Web Audio API is required for the <100ms latency target.
- On page mount: preloads and decodes all sound buffers for every subject on the page.
- On tap: plays the subject's sounds sequentially, respecting each sound's `delayBeforeMs` (e.g., 0ms for the animal sound, 800ms for the voiceover — per design system §3.2).
- **No stacking:** If the same card is tapped again during playback, stop current sequence, restart from sound 1.
- If a different card is tapped, stop current card's sequence and start the new card's sequence.
- Handles decode/network errors gracefully (skip failed sound, continue sequence).
- **Empty sounds:** If a subject has zero sounds, the tap still triggers the visual animation (scale + glow + wiggle) but no audio plays.

### 7.3 Admin Pages

Standard scrollable layout. No toddler UX rules. Clean, functional.

**Login (`/admin`):**
- Centered card with username + password fields + submit button.

**Admin Dashboard (`/admin/dashboard`):**
- Summary stats (topic count, subject count).
- Quick links to manage topics, tags.

**Tag Management (`/admin/tags`):**
- Table: name, category, sort order.
- Inline create/edit/delete.
- Predefined categories: `age` (`0-1`, `1-2`, `2-3`, `3+`) and `category` (`animals`, `vehicles`, `food`, `colors`, `shapes`, `numbers`, `nature`).

**Topic Management (`/admin/topics`):**
- Table: title, slug, tags, subject count, actions.
- Create/Edit form: title, slug (auto-generated from title), background image upload, tag picker (multi-select from predefined tags).

**Subject & Sound Management (`/admin/topics/[id]/subjects`):**
- Left panel: sortable list of subjects for this topic.
- Right panel: selected subject editor.
  - Image upload with preview.
  - **Sound list editor (`SoundEditor.svelte`):**
    - Ordered list (drag to reorder).
    - Each sound row: type toggle (`text` | `file`).
      - If `text`: text input + language dropdown + voice dropdown.
      - If `file`: file upload (mp3) with playback preview.
    - Add/remove sound buttons.
    - "Preview" button: calls the sounds API and plays the sequence.

---

## 8. TTS Integration

### `src/lib/tts.ts`

```
async function getOrGenerateTTS(
  env: Env,
  text: string,
  language: string,
  voice: string
): Promise<string> {
  // 1. Compute hash: sha256(`${text}|${language}|${voice}`)
  // 2. Build cache key: `audio/tts/${hash}.mp3`
  // 3. Check R2: env.R2.head(cacheKey)
  // 4. If exists → return public URL
  // 5. If miss → call edgeTTS.generate(text, { voice }) → ArrayBuffer
  // 6. PUT to R2: env.R2.put(cacheKey, audioBuffer, { httpMetadata: { contentType: 'audio/mpeg' } })
  // 7. Return public URL
}
```

Edge TTS lib integration deferred until provided. The `tts.ts` module will export a clean interface that the sounds API calls.

### Supported voices (initial set, configurable in admin)

| Language | Voice ID | Label |
|---|---|---|
| en-US | en-US-AvaMultilingualNeural | Ava (English) |
| en-US | en-US-AndrewMultilingualNeural | Andrew (English) |
| vi-VN | vi-VN-HoaiMyNeural | HoaiMy (Vietnamese) |
| de-DE | de-DE-SeraphinaMultilingualNeural | Seraphina (German) |

Stored in `src/lib/voices.ts` as a constant array.

---

## 9. R2 Public Access

Use **R2 custom domain** or **R2 public bucket** to serve assets directly to the browser without going through the Worker for every image/audio request. Configure via Cloudflare dashboard.

Alternative: Worker route that streams from R2 (adds latency but gives access control). For public assets, direct R2 serving is preferred.

---

## 10. Tailwind Configuration

```js
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      colors: {
        canvas:  '#FFF9E6',
        playful: '#FF4B4B',
        sky:     '#4BA3FF',
        meadow:  '#6BCB77',
        sun:     '#FFD93D',
        border:  '#4A4A4A',   // dark-gray for image/card borders (design system §2.3)
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        body:    ['24px', { lineHeight: '1.4' }],   // design system §2.2 minimum body size
        heading: ['48px', { lineHeight: '1.2' }],   // design system §2.2 heading size
      },
      borderRadius: {
        card: '24px',
      },
    },
  },
}
```

**Global CSS (`src/styles/global.css`):**
- Import Tailwind directives and design tokens.
- Set `font-family: 'Nunito', sans-serif` and `font-size: 24px` as base on public layouts.
- The viewport lock CSS (`.viewport-lock`) is defined here but only applied on the play page `<body>`, NOT globally.
- `-webkit-tap-highlight-color: transparent` is included in `.viewport-lock`.

---

## 11. Implementation Phases

### Phase 1: Project Scaffold
- [ ] Initialize Astro project with Bun
- [ ] Add Svelte, Tailwind CSS, Cloudflare adapter
- [ ] Configure `wrangler.jsonc` with D1, R2, KV bindings
- [ ] Set up TypeScript, env types for Cloudflare bindings
- [ ] Create D1 schema migration
- [ ] Set up global CSS with design tokens
- [ ] Create `PublicLayout.astro` and `AdminLayout.astro`

### Phase 2: Admin Backend
- [ ] Auth: login/logout API, session middleware, KV session store
- [ ] Admin login page
- [ ] Tag CRUD API + admin page
- [ ] Topic CRUD API + admin pages (list, create, edit)
- [ ] R2 upload API (images + audio files)
- [ ] Subject CRUD API + admin page with image upload
- [ ] Sound CRUD API + `SoundEditor.svelte` (ordered, type toggle, reorder)

### Phase 3: TTS Integration
- [ ] Integrate Edge TTS lib into `src/lib/tts.ts`
- [ ] Implement cache-through logic (R2 check → generate → store)
- [ ] Wire `GET /api/subjects/{id}/sounds` to resolve all sound URLs
- [ ] Admin preview: play generated sound sequence

### Phase 4: Public Frontend
- [ ] Dashboard page: tag filter (icon + text chips), topic groups, pagination
- [ ] `TopicCard.svelte` with background image, 4px dark-gray border, tags, tap navigation
- [ ] Play page: subject grid, selective viewport lock (`.viewport-lock` on body)
- [ ] `GET /api/topics/{slug}/subjects` endpoint for bulk subject + sound data
- [ ] `SubjectCard.svelte` with breathing animation, tap states, glow, uppercase titles
- [ ] `AudioEngine.svelte` with Web Audio API preloading, sequential playback with `delayBeforeMs`, no-stacking, restart logic
- [ ] Multi-touch shielding (block same-card re-mash, allow different-card switch)
- [ ] Home navigation button (house icon, 100×100px)
- [ ] Empty states (zero subjects, zero sounds)

### Phase 5: Polish & Deploy
- [ ] Responsive testing (phone, tablet)
- [ ] Audio preloading strategy (preload sounds on page load for <100ms response)
- [ ] Error handling (network failures, missing assets)
- [ ] Loading states (skeleton cards)
- [ ] Deploy to Cloudflare Pages
- [ ] Set admin secrets via `wrangler secret`
- [ ] Configure R2 public access / custom domain
- [ ] Seed initial content (a few topics with subjects and sounds)

---

## 12. Key Design Decisions

| Decision | Rationale |
|---|---|
| Astro SSR (not SSG) | Admin routes need server-side D1/R2 access; public pages benefit from fresh data |
| TTS cached in R2 | Meets <100ms playback requirement; avoids repeated TTS calls |
| Sound URLs resolved server-side | Worker handles TTS generation transparently; client just plays URLs |
| Audio preloaded on page mount | All sound buffers decoded on play-page load so tap→playback is purely local (<100ms) |
| `delayBeforeMs` per sound row | Configurable inter-sound delay (e.g. 800ms before voiceover) per design system §3.2 |
| Selective viewport lock | `.viewport-lock` class applied only on play page, not globally — dashboard remains scrollable |
| Single admin account via env secrets | Simplest approach; secrets set via `wrangler secret`, never in `vars`/repo |
| Predefined tags with icons | Consistent categorization; icons support zero-text navigation for toddlers |
| Svelte islands in Astro | Only interactive components (cards, audio, editors) ship JS; static parts are zero-JS |
| Web Audio API for playback | Lower latency than `<audio>` elements; required for <100ms tap response; no HTMLAudioElement fallback |
| SHA-256 hash for TTS cache key | Deterministic; same text+voice always hits cache; no duplicates |
| Multi-touch: per-card, not global | Same-card re-tap restarts audio; different-card tap switches; child never locked out |