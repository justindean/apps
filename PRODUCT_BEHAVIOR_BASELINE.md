# TapHabla — Product Behavior Baseline

**Status:** PR-1 (documentation only). No production behavior changed. No temporary diagnostics added — every finding below is from static code-path tracing, so no `console.log` instrumentation was required.

**Purpose:** This is the canonical acceptance specification for the TapHabla resurrection. It captures, for every surface, the *intended* product behavior, the *current observed* behavior (from code, not runtime unless noted), a verdict, the exact runtime code path, and whether real-iPhone verification is required before we trust the verdict.

**Legend:**
- **PASS** — code path is present and correct; behaves as intended.
- **DEGRADED** — works but with a known defect, wrong assumption, or missing polish.
- **FAIL** — intended behavior is broken or absent in the code path.
- **UNKNOWN** — cannot be determined without runtime on a real device/browser. Static analysis alone is insufficient (iOS Safari mic, autoplay, audio unlock, gesture rules).

**Critical caveat on iOS:** This app's core value depends on iOS Safari behaviors that CANNOT be validated from code — mic permission lifecycle, `webkitSpeechRecognition` availability/quality, audio autoplay unlock, and pull-to-refresh. Every item touching those is marked **UNKNOWN / real-iPhone required** even where the code looks correct. This is deliberate: we do not label device-dependent behavior PASS from a desktop preview.

---

## Architecture snapshot (as traced)

- **UI:** Next.js 16 App Router. `app/page.tsx` owns app state and renders two bottom-sheet drawers: **Listen** (`components/ListenPanel.tsx`, ~1,707 lines) and **Say** (inline in `page.tsx`).
- **AI:** raw `fetch` to OpenAI (no AI SDK, no AI Gateway). Models: `gpt-4o-mini` (classify, translate, generate-reply), `whisper-1` (transcription). TTS: ElevenLabs direct fetch (Daniel / Mila voices).
- **Capture:** dual path — `webkitSpeechRecognition` (live) with `MediaRecorder` → `/api/transcribe` (Whisper) as fallback.
- **Env vars present:** `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID_DANIEL`, `ELEVENLABS_VOICE_ID_MILA`.

---

## HOME

| # | Intended behavior | Observed (code) | Verdict | Runtime code path | iPhone req? |
|---|---|---|---|---|---|
| H1 | **HEAR IT** is the clear primary action | Two primary CTAs render in `page.tsx`; HEAR IT opens the Listen drawer (`setListenOpen(true)`) | UNKNOWN (visual hierarchy) | `app/page.tsx` CTA block → `ListenPanel` | No (desktop preview OK for layout) |
| H2 | **SAY IT** is clearly discoverable (secondary) | SAY IT toggle opens the Say drawer in `page.tsx` | UNKNOWN (visual hierarchy) | `app/page.tsx` say drawer state | No |
| H3 | Context selection works | Context grid (`CategoryGrid.tsx`) sets active context in `page.tsx` state | PASS (code present) | `app/page.tsx` context state + `data/contextPrompts.ts` | No |
| H4 | Context **deselection** works | Need runtime confirm that tapping active context clears it vs. no-op | UNKNOWN | `app/page.tsx` context handler | No |
| H5 | No-selection default = neutral/general | Contexts default to none; prompts fall back to general instruction | DEGRADED — see C6; verify no restaurant default bleeds in | `data/contextPrompts.ts` fallback branch | No |
| H6 | Context state persists across Listen/Say operations | Context is app-level state in `page.tsx`, passed into both drawers | UNKNOWN — confirm it is not reset on drawer close | `app/page.tsx` shared state | No |

---

## HEAR IT (Listen drawer — `components/ListenPanel.tsx`)

| # | Intended behavior | Observed (code) | Verdict | Runtime code path | iPhone req? |
|---|---|---|---|---|---|
| L1 | First mic permission request | Capture start triggers `getUserMedia` / SpeechRecognition start | UNKNOWN | `ListenPanel` start-listen handler → `navigator.mediaDevices.getUserMedia` / `webkitSpeechRecognition` | **Yes** |
| L2 | Repeated listen without re-permission | No explicit re-request in code; depends on Safari session grant | UNKNOWN | same as L1 | **Yes** |
| L3 | Refresh then listen | Permission should persist per Safari policy | UNKNOWN | page reload → L1 | **Yes** |
| L4 | Safari kill/reopen then listen | Permission re-prompt likely; unverified | UNKNOWN | cold start → L1 | **Yes** |
| L5 | Denied-permission recovery | **No visible recovery/error UI traced** for a hard-denied mic | FAIL (likely) | `ListenPanel` catch on getUserMedia — confirm user-facing message | **Yes** |
| L6 | Actual capture path on iPhone (SpeechRecognition vs MediaRecorder→Whisper) | Code prefers `webkitSpeechRecognition`, falls back to `MediaRecorder`→`/api/transcribe` | UNKNOWN — which branch iOS Safari actually takes must be confirmed | `ListenPanel` capability check | **Yes** |
| L7 | Live Spanish transcript | Interim results rendered from SpeechRecognition events | UNKNOWN | `ListenPanel` `onresult` handler | **Yes** |
| L8 | No visibly broken provisional English | Risk: interim results may show mis-language before final | UNKNOWN | `ListenPanel` interim render | **Yes** |
| L9 | Auto-stop after speaker finishes | Relies on SpeechRecognition end / silence timeout | UNKNOWN | `ListenPanel` `onend` / silence timer | **Yes** |
| L10 | Final transcript | Final result captured, passed to classify | PASS (code path present) | `ListenPanel` → `corrected` → `/api/classify` (line ~737) | Partial |
| L11 | English meaning | `/api/classify` returns understanding/meaning | PASS (code present) | `app/api/classify/route.ts` (gpt-4o-mini) | No |
| L12 | Contextual interpretation | Active context injected into classify prompt | DEGRADED — verify context actually reaches prompt (see C-set) | `ListenPanel` → classify body → `data/contextPrompts.ts` | No |
| L13 | Primary response | classify returns a primary suggested response | PASS (code present) | `app/api/classify/route.ts` response shape | No |
| L14 | Alternate responses / follow-ups | classify returns tone variants + follow-ups | PASS (code present) | `app/api/classify/route.ts` | No |
| L15 | Local / Standard / Polite switching with **zero network + zero blanking** | **Tones returned in one classify call and switched client-side** — good. Confirm switch does not re-fetch or blank results | UNKNOWN (need runtime) | `ListenPanel` tone toggle state (client only) | Partial |
| L16 | Speak/TTS for primary AND alternate responses | TTS via `/api/tts` at `ListenPanel:25` and `:80` | UNKNOWN (audio playback) | `ListenPanel` → `/api/tts` (ElevenLabs) | **Yes** |
| L17 | Repeat listen | Re-invoking start after a cycle | UNKNOWN | `ListenPanel` start handler re-entry | **Yes** |
| L18 | Drawer dismissal by drag / X / backdrop | Drawer close handlers present | UNKNOWN (drag gesture on iOS) | `ListenPanel` close/drag handlers | **Yes** |
| L19 | No Safari pull-to-refresh accident | **No `overscroll-behavior` / touch guard traced** at drawer scroll top | FAIL (likely) | global CSS / drawer container — confirm `overscroll-behavior: contain` | **Yes** |

### Latent bug flagged in Listen path
- **Fuzzy-cache confidence scale mismatch (DEGRADED → likely FAIL for cache correctness):** `/api/classify` guards cache reuse with `conf >= 0.75`, but the model returns confidence on a **0–100** scale. The guard is therefore almost always trivially true, so low-confidence classifications can be cached/reused. Code path: `app/api/classify/route.ts` confidence check. Not user-fatal, but corrupts interpretation quality silently.

---

## SAY IT (Say drawer — inline in `app/page.tsx`)

| # | Intended behavior | Observed (code) | Verdict | Runtime code path | iPhone req? |
|---|---|---|---|---|---|
| S1 | Text input | Controlled input in `page.tsx` | PASS (code present) | `app/page.tsx` say input state | No |
| S2 | English voice input | SpeechRecognition for English dictation | UNKNOWN | `page.tsx` voice-input handler (confirm it exists/wired) | **Yes** |
| S3 | No translation while still typing | Translate must only fire on explicit submit, not on keystroke | UNKNOWN — confirm no debounce-translate | `page.tsx` submit handler → `/api/translate` (line ~191) | No |
| S4 | Explicit submit | Submit triggers `/api/translate` | PASS (code present) | `app/page.tsx:191` → `app/api/translate/route.ts` | No |
| S5 | Clear | Clear button resets input/output | UNKNOWN | `page.tsx` clear handler | No |
| S6 | State reset on close | Drawer close should reset Say state | UNKNOWN — confirm not sticky | `page.tsx` say-drawer close | No |
| S7 | Context reaches model | Active context injected into translate prompt | DEGRADED — verify propagation | `page.tsx` translate body → `data/contextPrompts.ts` | No |
| S8 | Local / Standard / Polite behavior | translate accepts `speechMode` param | PASS (code present) | `app/api/translate/route.ts` speechMode branch | No |
| S9 | Optional response TTS | TTS via `/api/tts` at `page.tsx:222` | UNKNOWN (audio) | `app/page.tsx:222` → `/api/tts` | **Yes** |
| S10 | ElevenLabs vs silence/system-voice behavior | If ElevenLabs fails, behavior on fallback is unclear | UNKNOWN — confirm graceful silence vs. error | `app/api/tts/route.ts` failure branch | **Yes** |

---

## CONTEXT REGRESSION SET

Fixed examples to run and record **actual model outputs** on each release. Primary goal: **restaurant assumptions must never bleed into Medical / Personal Care / Getting Around / Shopping / no-context.**

| # | Context | Fixed example input | Intended output character | Verdict | Path | iPhone req? |
|---|---|---|---|---|---|---|
| C1 | Food | Waiter: "¿Ya decidieron qué van a ordenar?" | Menu/order framing; response options to order food/drink | UNKNOWN (record output) | `contextPrompts.ts` food + classify/translate | No |
| C2 | Getting Around | "¿A dónde lo llevo?" (taxi) | Directions/destination framing, not restaurant | UNKNOWN (record output) | `contextPrompts.ts` transit branch | No |
| C3 | Shopping | "¿Qué talla busca?" | Size/product/payment framing | UNKNOWN (record output) | `contextPrompts.ts` shopping branch | No |
| C4 | Medical | dosage: "20mg", "ml", "sprays", dosage instructions | Precise medical/dosage handling — **no food framing** | UNKNOWN (record output) — **high risk of restaurant bleed** | `contextPrompts.ts` medical branch | No |
| C5 | Personal Care | specific haircut instructions | Grooming/haircut specifics — **no food framing** | UNKNOWN (record output) — **high risk of restaurant bleed** | `contextPrompts.ts` personal-care branch | No |
| C6 | No context | generic greeting/interaction | Neutral/general — **no restaurant default** | UNKNOWN (record output) | `contextPrompts.ts` fallback | No |

**Regression assertion (must hold every release):** C4, C5, C6 outputs contain zero menu/order/waiter vocabulary unless the input itself is about food. `data/restaurantIntents.ts` and any restaurant-specific scaffolding must not be the default assumption in the prompt. **Confirm the classify/translate prompts do not hardcode a restaurant persona.**

---

## DEMO (`components/DemoModal.tsx`)

| # | Intended behavior | Observed (code) | Verdict | Runtime code path | iPhone req? |
|---|---|---|---|---|---|
| D1 | No mic permission required | Demo plays audio only; no capture traced | PASS (code present) | `DemoModal` — no getUserMedia | No |
| D2 | One explicit Start Demo gesture | Requires a user tap to start (needed for iOS autoplay unlock) | UNKNOWN — confirm single gesture unlocks audio | `DemoModal` start handler | **Yes** |
| D3 | Native-quality waiter audio | **Generated at runtime via `/api/tts` (ElevenLabs)** — `DemoModal:35` | DEGRADED — see D8 | `DemoModal:35` → `/api/tts` | **Yes** |
| D4 | Waiter audio begins WITH transcript (not seconds later) | Sync between audio start and transcript reveal depends on runtime timing of the TTS fetch | UNKNOWN — likely off because audio is fetched on demand | `DemoModal` play + transcript timer | **Yes** |
| D5 | Transcription timing stays believable through clip | Hardcoded/scripted timing vs. audio length | UNKNOWN | `DemoModal` transcript scheduler | **Yes** |
| D6 | English meaning appears correctly | Scripted in demo data | UNKNOWN (record) | `DemoModal` demo script | No |
| D7 | Useful response appears + response voice auto-plays in sequence | Scripted sequence with TTS | UNKNOWN | `DemoModal` sequence | **Yes** |
| D8 | Deterministic assets not regenerated unnecessarily | **`public/` is empty — pre-generated demo audio was NEVER committed.** `scripts/generate-demo-audio.js` + `/api/generate-demo-audio` exist but produce nothing on disk. Demo regenerates via ElevenLabs on every play → cost, latency, and D4 timing break. | **FAIL** | `public/` (empty) vs `scripts/generate-demo-audio.js` / `app/api/generate-demo-audio/route.ts` | No |
| D9 | Close/restart works cleanly | Close handler + state reset | UNKNOWN | `DemoModal` close/reset | **Yes** |

---

## TTS AUDIT (every `/api/tts` caller)

| Caller | Phrase spoken | When generation occurs | Voice requested | Prefetched/cached? | Failure behavior | Product-critical? |
|---|---|---|---|---|---|---|
| `ListenPanel.tsx:25` | Response phrase (primary/alternate Spanish) — generate/prefetch call site | On response availability / prefetch | Daniel or Mila (by env voice IDs) | **No persistent cache traced** — regenerated per request | UNKNOWN — confirm silence vs. error | **Yes** (core) |
| `ListenPanel.tsx:80` | Response phrase playback | On user tap to speak | Daniel/Mila | No | UNKNOWN | **Yes** (core) |
| `FlowNavigator.tsx:57` | Selected phrase-tree phrase (Spanish) | On phrase tap | Daniel/Mila | No | UNKNOWN | Conditional — only if phrase-tree subsystem is reachable (see Route Audit) |
| `DemoModal.tsx:35` | Waiter demo line(s) | On demo play — **runtime regeneration** | Daniel/Mila | **No — should be deterministic committed asset (D8)** | UNKNOWN | **Yes** (demo is the marketing hook) |
| `page.tsx:222` | Say-drawer translated Spanish output | On user tap to speak translated text | Daniel/Mila | No | UNKNOWN | **Yes** (core) |

**TTS-wide findings:**
- **No audio caching layer** anywhere — every spoken phrase hits ElevenLabs live. Cost + latency + offline fragility.
- **ElevenLabs failure fallback is unverified** across all callers — need to confirm whether a failed TTS produces graceful silence, a system-voice fallback, or a broken/hung UI. Marked UNKNOWN pending runtime.
- All callers request the same two voices via `ELEVENLABS_VOICE_ID_DANIEL` / `ELEVENLABS_VOICE_ID_MILA`.

---

## ROUTE AUDIT — reachability proof

Method: grep for every `fetch("/api/...")` call site across `**/*.{ts,tsx}` (excluding read-only notes).

| Route | Concrete caller(s) | Verdict |
|---|---|---|
| `/api/classify` | `ListenPanel.tsx:737` | **LIVE** |
| `/api/transcribe` | `ListenPanel.tsx:904` | **LIVE** (Whisper fallback path) |
| `/api/translate` | `page.tsx:191` | **LIVE** (Say path) |
| `/api/tts` | `ListenPanel.tsx:25`, `ListenPanel.tsx:80`, `FlowNavigator.tsx:57`, `DemoModal.tsx:35`, `page.tsx:222` | **LIVE** |
| `/api/generate-reply` | **None.** Only its own definition (`app/api/generate-reply/route.ts:32,45`) and the review notes reference the name. No `fetch("/api/generate-reply")` exists in any component or page. | **DEAD — confirmed disconnected** |
| `/api/generate-demo-audio` | Build/one-off script intent only; no runtime component caller traced, and `public/` output is absent | **DEAD at runtime** (see D8) |
| `/api/debug/openai-ping` | Dev-only debug surface | **Dev-only — should not ship** |
| `/api/voices` | Dev voices surface (`app/dev/voices`) | **Dev-only — should not ship** |

**`/api/generate-reply` reachability conclusion:** Proven **DEAD** by absence of any call path. The Listen flow gets its response + tone variants + follow-ups from `/api/classify` in a single call, so `generate-reply` is redundant. Safe to delete in the cleanup PR.

**Phrase-tree subsystem reachability:** `FlowNavigator` and `PhraseList` ARE rendered in `page.tsx` (lines ~561–563) gated on a truthy `scenario`. `scenario` is set by `setScenario(found)` at `page.tsx:117`. Whether that branch is ever actually reached at runtime for a user (i.e., a selected context resolves to a `restaurantIntents` scenario) is **UNKNOWN** and must be confirmed on device. Do NOT delete the phrase-tree subsystem until this is resolved — it is conditionally wired, not orphaned.

---

## SUMMARY

### Launch blockers (must fix before we trust a build)
1. **D8 — Demo audio regenerated live / no committed assets** (`public/` empty). The demo is the primary hook; runtime ElevenLabs regeneration breaks timing (D4), adds latency, and costs per play.
2. **L5 — No mic-denied recovery UI.** A user who denies permission likely hits a dead end. Core flow.
3. **L19 — No pull-to-refresh guard.** On iOS an accidental swipe at drawer top can reload and destroy state mid-interaction.
4. **C4/C5/C6 restaurant-bleed risk** — must prove Medical, Personal Care, and no-context outputs are not contaminated by restaurant assumptions before this is safe to show real users.
5. **Classify confidence scale bug** — 0–100 vs `0.75` guard silently degrades interpretation/caching quality.

### Degraded-but-usable
- No TTS caching anywhere (cost/latency, not fatal).
- Context propagation into classify/translate present but unverified end-to-end (L12, S7).
- README is stale (says Vite; project is Next.js 16).

### Confirmed-good behavior we must protect (do not regress)
- **Single-call tone model:** `/api/classify` returns understanding + Local/Standard/Polite variants + follow-ups in one request, enabling client-side tone switching with no refetch (L15). This is the right architecture — preserve it.
- Live routes `classify`, `transcribe`, `translate`, `tts` are all wired to real callers.
- `speechMode` (Local/Standard/Polite) is a real parameter honored by `translate` (S8).
- Dual capture strategy (SpeechRecognition + Whisper fallback) exists (L6) — keep the fallback.

### Dead / disconnected subsystems
- **`/api/generate-reply`** — no caller. Delete in cleanup.
- **`/api/generate-demo-audio` + `scripts/generate-demo-audio.js`** — produce no committed output; dead at runtime.
- **`/api/debug/openai-ping`** and **`app/dev/voices` + `/api/voices`** — dev-only surfaces shipping in the app; remove from production build.

### Unknowns requiring Justin's real-iPhone validation
- All of **L1–L4, L6–L9, L16–L19** (mic permission lifecycle, capture branch actually taken on iOS Safari, live transcript quality, auto-stop, TTS playback, drag-dismiss, pull-to-refresh).
- **S2, S9, S10** (English voice input, response TTS playback, ElevenLabs failure fallback).
- **D2, D4, D5, D7, D9** (demo autoplay unlock and timing believability).
- **H1/H2** visual hierarchy is confirmable in desktop preview but should be sanity-checked at iPhone width.

---

**Next step:** Stop here for review. Do not begin the cleanup/modernization PR until this baseline is approved and Justin has run the real-iPhone validation items so the UNKNOWNs can be resolved to PASS/DEGRADED/FAIL.
