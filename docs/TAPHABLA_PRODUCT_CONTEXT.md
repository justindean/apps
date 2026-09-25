# TapHabla Product Context
## Living Product / Strategy / Architecture State File

**Status date:** 2026-09-24  
**Purpose:** Canonical historical and strategic context for TapHabla so future AI agents, engineers, product/design collaborators, and the founder do not have to reconstruct the product from code alone.

> **Important:** This file is not a replacement for `PRODUCT_BEHAVIOR_BASELINE.md`.  
> `PRODUCT_BEHAVIOR_BASELINE.md` is the current acceptance / runtime behavior artifact.  
> This document captures the deeper **why**: product thesis, real-world pain, UX intent, decisions, rejected directions, historical bugs, architectural lessons, positioning, monetization, and long-term direction.

---

# 0. READ THIS FIRST

TapHabla was not designed from a clean PRD and then implemented once. It emerged through repeated real-world use, especially while living in Mexico City, where the founder repeatedly encountered the exact situations the product is intended to solve: restaurants, drinks, taxis, shopping, medical conversations, personal-care interactions, fast native Spanish, ambiguous local phrasing, and the moment where someone who knows a little Spanish immediately loses the thread once a native speaker responds normally.

A large amount of odd-looking code, prompt wording, UI behavior, and iOS-specific handling exists because of real failures encountered in those situations.

**Do not treat the repository as a generic cleanup exercise.**

Before removing or rewriting something, determine whether it represents:

1. current live product behavior,
2. a deliberately abandoned product direction,
3. a temporarily disconnected feature,
4. hard-won iPhone/Safari compatibility logic,
5. old AI-era scaffolding that modern models can now replace,
6. or genuinely dead code.

The product has gone through many v0-generated PRs and regressions. A merged PR is **not evidence that the feature worked on a real iPhone**.

The most important historical lesson is:

> **Code reachability and product intent are not the same thing.**

---

# 1. THE ONE-SENTENCE PRODUCT

TapHabla is a **real-time foreign-language interaction copilot for people who do not want to learn the language first**.

The simplest mental model is:

> **Someone speaks. Tap. Understand. Know what to say. Continue the interaction.**

The long-term category analogy is:

> **The Shazam of foreign-language moments.**

This is not primarily a translation app. It is not primarily a language-learning app. It is not a phrasebook. It is not meant to turn the user into a student. It is meant to remove the moment of social paralysis that happens when another human starts speaking a language the user does not understand.

---

# 2. THE CORE CUSTOMER TRUTH

One of the strongest strategic insights in the project was:

> **Nobody learns Spanish before their trip.**

People routinely tell themselves they will learn enough before travel. Usually they do not. Even when they studied the language in school, that does not prepare them for a real waiter, doctor, barber, driver, shopkeeper, or local speaking at normal speed.

The real aspiration is not language mastery. The aspiration is the trip, the food, the view, the romance, the culture, the movement, and the experience. Language is friction between the user and that experience. TapHabla removes the friction.

---

# 3. PRIMARY CUSTOMER

The highest-value customer is **temporary**, not aspirationally fluent:

- traveler leaving tomorrow
- tourist on a short trip
- frequent international traveler
- business traveler
- vacationing family
- person suddenly needing a foreign language
- person traveling to multiple countries over a year

Secondary users can include expats, retirees abroad, digital nomads, and temporary residents, but those are not the product center.

A critical product insight was:

> **Depth is almost inversely related to the intended direction.**

A traveler who visits Mexico in March, Italy in December, and the Caribbean in between does not want three learning commitments. They want one utility they already understand.

---

# 4. THE DEEPEST PAIN THE PRODUCT SOLVES

The real pain is social.

Typical moment:

1. User walks into a restaurant.
2. User confidently says “Hola” or “Buenas tardes.”
3. The waiter responds with five seconds of normal, fast Spanish.
4. User catches almost nothing.
5. User has no idea whether they were greeted, asked a question, offered a special, asked what they want to drink, told something is unavailable, or expected to answer.
6. User freezes.
7. The other adult realizes the user cannot communicate.
8. The interaction becomes awkward and the local person must rescue it.

Then the same thing happens at breakfast, coffee, in the taxi, at a store, at a doctor, pharmacy, barber, hotel, and everywhere else.

The product removes the **deer-in-the-headlights moment**.

The emotional value is confidence, dignity, flow, reduced embarrassment, and feeling capable instead of helpless.

Public marketing should sell relief and confidence, not shame. But future product agents should understand the raw emotional problem because that is why the product matters.

---

# 5. CATEGORY POSITIONING

Several messages emerged because they communicate the truth cleanly:

> **Nobody learns Spanish before their trip.**

> **Don't learn Spanish. Just do Spanish.**

> **Your trip is tomorrow and you didn't learn Spanish?**

These are best treated as **marketing truths**, not necessarily in-app copy.

A major design learning was:

> **The app is not the landing page.**

Acquisition can be disruptive, playful, confronting, funny, or sharp. Once the user is inside the product, the experience should become calm, confident, immediate, useful, operational, premium, and low-friction.

---

# 6. NORTH STAR EXPERIENCE

Desired reaction before trying it:

> “Oh shit. I need this for my trip.”

Desired reaction after using it:

> “Holy shit. That actually worked.”

The core loop is:

### HEAR
Someone speaks.

### UNDERSTAND
The app tells you what they actually mean.

### RESPOND
The app tells you what to say back naturally.

### CONTINUE
The interaction keeps moving.

Every feature should earn its existence by improving that loop.

---

# 7. PRIMARY PRODUCT MODE: HEAR IT

Historically this was often called Listen. The later, stronger interaction language became:

## **HEAR IT.**

This is the primary product action. The giant red microphone is intentionally the dominant object on the home screen.

The user should not have to choose a workflow, browse a phrasebook, pick a scenario tree, configure an AI, write a prompt, or understand a language-learning taxonomy.

The interaction should feel like Shazam:

1. tap the big mic,
2. hold the phone toward the person,
3. let them speak,
4. understand,
5. respond.

### Intended HEAR IT flow

1. User taps the giant mic.
2. App immediately indicates listening.
3. User holds the phone toward the speaker.
4. Spoken Spanish is captured.
5. App should ideally detect the end of speech automatically.
6. Spanish transcription is shown.
7. English meaning is shown.
8. AI interprets contextual meaning, not merely literal word substitution.
9. App provides a useful primary Spanish response.
10. App provides tone/register variants.
11. App may provide useful follow-up lines.
12. User normally reads the response and says it.
13. User may optionally tap playback if they need pronunciation help or want the phone to speak.

This is the core product.

---

# 8. AUTO-STOP MATTERS

The user should not have to tap again just to stop listening if the other person has clearly finished speaking.

The ideal behavior is:

- tap once to listen,
- speech ends,
- capture stops naturally,
- result appears.

Existing silence-detection logic may reflect this requirement. Do not remove it casually.

---

# 9. “THEY SAID” IS NOT THE SAME AS “WHAT IT MEANS”

Spoken language is messy: incomplete, colloquial, local, fast, grammatically loose, sometimes poorly transcribed, and heavily dependent on context.

Therefore the product historically separated concepts like:

## THEY SAID
The approximate Spanish that was heard.

and

## MEANING
What the speaker was actually communicating.

This distinction should survive even if a modern model can now produce both in a single call.

The product should answer:

> **“What is happening here?”**

not merely:

> “What is the dictionary translation of these words?”

---

# 10. DO NOT SHOW LOW-CONFIDENCE GARBAGE AS TRUTH

One historical UX failure: provisional English was displayed too early during live capture, producing half-English/half-Spanish or visibly wrong output.

Principle:

> **It is acceptable for live Spanish transcription to be provisional. It is not acceptable for bad provisional English to look authoritative.**

If modern streaming models make reliable incremental interpretation possible, use it. Otherwise wait briefly for correct meaning.

---

# 11. SECOND PRODUCT MODE: SAY IT

The inverse problem is:

> “I know what I want to communicate. Help me say it naturally.”

This became:

## **SAY. IT.**

It supports typing English, optionally speaking English, translating into natural target-language speech, pronunciation guidance, and optional audio playback.

The two verbs are intentionally simple:

### HEAR IT.
### SAY. IT.

They represent actual product behaviors, not decorative taglines.

---

# 12. SAY IT SHOULD NOT TRANSLATE WHILE THE USER IS STILL TYPING

A historical bug made the experience jumpy because the app generated while the user was still typing, thinking, or dictating.

The explicit design decision was:

> **Use explicit submit.**

Desired behavior:

- user types or speaks freely,
- then taps Go / Done / Translate,
- generation begins,
- result appears,
- clear X is available,
- stale state resets predictably.

Do not reintroduce per-keystroke AI just because streaming makes it possible.

---

# 13. CONTEXT IS CORE PRODUCT IP

Context chips were never intended to be decorative. The same words can mean different things depending on the situation.

Later context set:

- **Ordering food / Food & Drink**
- **Getting Around**
- **Shopping**
- **Medical**
- **Personal Care**

### Important rule

There is no need for a visible **General** chip. No context selection already means general.

---

# 14. CONTEXT MUST REACH THE MODEL

A historical bug allowed users to select Medical while the model still behaved as if it were in a restaurant. Medication, milligram, spray, and doctor phrases could produce irrelevant restaurant-ish output.

This proved:

> **A context chip that does not materially change the model is fake functionality.**

Every context must be verified end-to-end:

UI selection → request payload → prompt / structured input → model reasoning → output behavior.

---

# 15. MEDICAL CONTEXT RULE

Medical context should primarily help the user accurately understand and communicate.

Historical principle:

> **Translate and clarify. Do not debate the physician. Do not invent medical guidance.**

If a doctor gives dosage instructions, TapHabla should accurately convey them rather than “improving” medically important facts.

---

# 16. PERSONAL CARE EXISTS FOR A REAL REASON

A haircut is a near-perfect TapHabla use case.

A user may want to communicate:

> finger-length scissor cut on top, light fade into 1.5 on the sides, executive interview this week.

That is very different from translating “short haircut.”

Personal Care should cover barber, hair salon, nails, spa, and similar high-context services.

---

# 17. TONE / REGISTER IS A REAL DIFFERENTIATOR

Tone evolved into:

- **Local**
- **Standard**
- **Polite**

Earlier labels included Street / Neutral / Formal.

### Local
How people actually say it there.

### Standard
Clear, broadly understood neutral wording.

### Polite
More respectful / formal phrasing.

This matters because technically correct translation can still sound unnatural.

---

# 18. TONE SWITCHING MUST BE INSTANT

A historical implementation flaw caused tone changes to trigger another LLM request and blank the existing response for 2–3 seconds.

That is unacceptable when another person is waiting.

Desired architecture:

> **Generate Local / Standard / Polite variants in the original structured response and switch client-side.**

The latest static audit indicates `/api/classify` already follows this model. Protect it.

---

# 19. FUTURE “LOCAL” CAN BECOME SMARTER

Long-term possibilities include location- or locale-aware slang, dialect, vocabulary, product terms, city/country phrasing, and common conversational patterns.

This is not required for resurrection MVP. Do not let geolocation complexity derail launch.

---

# 20. RESPONSES SHOULD MOVE THE INTERACTION FORWARD

TapHabla should not stop at “here is the translation.”

It should help with the next five seconds through:

- primary response,
- alternate phrasing,
- useful follow-up lines.

The moat is not:

> Spanish sentence → English sentence.

It is:

> **Understand what is happening and know how to handle the interaction.**

---

# 21. REAL LANGUAGE, NOT TEXTBOOK LANGUAGE

Prompt work intentionally pushed toward natural Mexican usage, real-world phrasing, useful shorthand, actual brand/product names where relevant, and language people actually use.

“Local” should feel local, not merely grammatically correct.

---

# 22. HOME SCREEN DESIGN PRINCIPLES

The strongest visual direction used:

- TapHabla brand at top
- bold hero text
- enormous red microphone
- HEAR IT as primary interaction
- SAY IT as visible secondary interaction
- context chips
- lots of whitespace

The giant red mic is intentionally the single dominant red element.

Repeated redesign attempts became worse when they introduced multiple competing red buttons, generic SaaS styling, “library app” feel, too much explanation, or weak hierarchy.

> **Do not big-bang redesign working visual hierarchy. Make surgical changes.**

---

# 23. LATEST HOME COPY DIRECTION

Latest known direction before the long pause:

### SPANISH. NOW.

Large red mic

### HEAR IT.

Secondary CTA:

### SAY. IT.

Context prompt/chips beneath.

This may evolve, especially once the brand becomes language-neutral.

---

# 24. TAP/HABLA AS A BRAND IS PROBABLY TEMPORARY

TapHabla makes intuitive sense as a Spanish-specific brand, but long-term direction is broader.

The founder concluded:

> **The future name does not have to explain the entire category. It just cannot be capped by Spanish.**

A future name should support multiple travel languages, imply immediacy/action, avoid sounding like a course, and be understandable without huge brand-awareness spend.

Naming remains unresolved. Do not rename the codebase casually.

---

# 25. MULTI-LANGUAGE DIRECTION

Spanish is the launch wedge.

The larger opportunity is:

> **one familiar tool for whatever language the user encounters while traveling.**

Long-term architecture should eventually support language-neutral contexts, target-language parameterization, locale-aware output, and a language-neutral brand.

But do not overbuild ten languages before proving Spanish conversion.

---

# 26. THE DEMO EXISTS BECAUSE THE CUSTOMER CANNOT SELF-DEMO

People who most need TapHabla often cannot easily test it because they do not speak Spanish well enough to produce a realistic native-speed interaction.

Therefore the built-in demo is not a tutorial. It is proof.

It should create:

> **“That is exactly what happens to me — and this just solved it.”**

within seconds.

---

# 27. DEMO SCENARIO

Restaurant was chosen because the pain is universal.

Intended flow:

1. user taps **Start Demo** once,
2. realistic native waiter voice begins,
3. app visibly “hears” the Spanish,
4. transcript appears in sync,
5. English meaning appears,
6. useful reply appears,
7. a different voice speaks the suggested reply,
8. user understands the entire product loop.

No permissions. No setup. No tutorial. No multi-step fake walkthrough.

---

# 28. DEMO AUDIO QUALITY IS CRITICAL

Default computer/system TTS sounded cheap, robotic, fake, and janky.

ElevenLabs was introduced because its Spanish voices were materially better.

Voices selected during experimentation:

- **Daniel** — male
- **Mila** — female

Exact ElevenLabs voice IDs belong in environment configuration.

The waiter should sound like an actual native speaker at realistic speed.

---

# 29. DEMO SHOULD BE DETERMINISTIC

The demo is scripted. It does not need a live TTS generation round-trip.

Correct architecture:

- pre-generate demo audio once,
- commit/store deterministic audio assets,
- preload them,
- use the initial user tap to satisfy iOS audio restrictions,
- synchronize UI timing to actual playback.

The latest static audit found that intended pre-generated files were never present in `public/`, so the demo currently falls back to live ElevenLabs generation. This is a known launch blocker.

---

# 30. DEMO AUDIO SYNC IS PART OF THE ILLUSION

A historical bug caused transcript text to appear several seconds before the Spanish voice.

Required behavior:

> **Audio and transcript begin together.**

Best principle:

- preload known audio,
- user taps Start Demo,
- call play,
- begin text animation from actual `playing` event,
- drive progress from real audio duration/time where practical.

---

# 31. CORE HEAR IT DOES NOT NEED SYNTHETIC AUDIO

In normal HEAR IT use, the audio source is a real person.

ElevenLabs is **not** needed to synthesize “what they said.”

Synthetic “they said” audio exists only for the demo.

---

# 32. CORE RESPONSE AUDIO IS OPTIONAL

The founder's real-world observation:

Having the phone speak on your behalf can itself be awkward.

Most users will probably read the suggested phrase and say it themselves.

Response audio should therefore be optional, easy to access, good enough to help pronunciation, but not the center of the experience.

---

# 33. ELEVENLABS CORE TTS HISTORY

ElevenLabs eventually worked in the demo.

Attempts were then made to use ElevenLabs in core response playback. Multiple v0 PRs changed TTS helper behavior, background prefetch, blob URL caching, `HTMLAudioElement` caching, iOS gesture handling, and button loading states.

At the time, the founder still observed bad or incorrect behavior on iPhone.

The latest static audit adds an important correction:

- there is currently **no** `speechSynthesis` fallback in the codebase,
- current TTS callers appear to use ElevenLabs or fail silently.

Therefore the historical “default iPhone voice” symptom is not explained by a current browser fallback.

Current concern:

> **ElevenLabs failure can produce silence with little/no visible error.**

Verify on-device.

---

# 34. DESIRED CORE TTS ARCHITECTURE

Text comes first.

When a response is generated:

1. show text immediately,
2. optionally prepare ElevenLabs audio in background,
3. user reads/responds normally,
4. if user taps audio, play prepared audio quickly,
5. if audio fails, show a real failure state,
6. do not silently fall back to low-quality system TTS.

Audio must never block the primary interaction.

---

# 35. IPHONE SAFARI IS THE REAL ACCEPTANCE PLATFORM

Many historical bugs existed only or primarily on iPhone Safari: microphone permission, `getUserMedia` gesture requirements, audio playback gesture rules, sheet/swipe behavior, pull-to-refresh, microphone lifecycle, and Web Speech differences.

> **v0 desktop preview success is not acceptance.**

Critical flows must be validated on a real iPhone Safari session.

---

# 36. MICROPHONE PERMISSION HISTORY

Experiments included localStorage “granted before” flags, custom pre-permission screens, direct `getUserMedia()` from the initial tap, reusing streams, probing permissions, and passing an external stream to ListenPanel.

Latest static audit suggests current path calls `getUserMedia` synchronously inside the home mic tap and passes an `externalMicStream` into ListenPanel.

Before changing it, test:

1. first launch,
2. grant permission,
3. listen,
4. close,
5. listen again,
6. refresh,
7. listen again,
8. kill/reopen Safari,
9. denied permission recovery.

---

# 37. BOTTOM-SHEET HISTORY

Historical issues included unreliable swipe-down dismissal, faint close affordances, hard swipes causing Safari refresh, and refresh causing further mic friction.

Later changes added grabbers, larger X controls, drag handling, and body-scroll control.

Do not assume current behavior is perfect. Test it before rewriting it.

---

# 38. LATENCY IS A PRODUCT FEATURE

Another human may literally be staring at the user while TapHabla works.

Principles:

- render useful text as soon as possible,
- do not blank existing answers during supplementary work,
- precompute tone variants,
- do not make optional audio block the core answer,
- preserve output while refreshing secondary data,
- avoid unnecessary model round-trips.

Perceived speed is core functionality.

---

# 39. CURRENT TECHNICAL STATE — STATIC AUDIT, 2026-09-24

Latest code audit found:

### Framework
- Next.js 16
- React 19
- mobile-first single-page experience

### Main live surfaces
- `app/page.tsx`
- `ListenPanel.tsx`
- `DemoModal.tsx`

### AI
- OpenAI calls via raw `fetch`
- `gpt-4o-mini` for classify/translate-style work
- `whisper-1` for transcription
- ElevenLabs for TTS

### Home
Live home exposes giant red mic, HEAR IT, Try Demo, SAY IT, context chips, hero roughly “SPANISH. NOW.”, build label `v0.80`.

### Core paths
- HEAR IT → ListenPanel
- SAY IT → drawer in page
- Demo → DemoModal
- context reaches both HEAR and SAY routes according to static tracing

### Tone
Current classify architecture appears to return multiple registers in one request, which is the intended design.

---

# 40. `PRODUCT_BEHAVIOR_BASELINE.md`

A dedicated baseline file now exists in the repository.

Reported commit:

`32a12f0`

Branch:

`v0/taphabla-project-alignment-0adab72d`

It contains HOME, HEAR IT, SAY IT, context, DEMO, TTS-caller, and route-reachability matrices with PASS / FAIL / DEGRADED / UNKNOWN states and real-iPhone validation needs.

Future agents should read that file together with this one.

This document explains **why**.  
The baseline explains **what currently appears to happen**.

---

# 41. CURRENT KNOWN / SUSPECTED LAUNCH BLOCKERS

Per latest static audit:

### Demo deterministic audio
`public/` does not contain the intended pre-generated demo MP3s, causing live ElevenLabs fallback, latency, cost, and timing drift.

### Mic-denied recovery
No robust user-facing recovery behavior is confirmed.

### Pull-to-refresh / sheet behavior
Static audit has conflicting interpretations around body-scroll locking vs a true pull-to-refresh guard. Requires clarification and device validation.

### Confidence scale
A cache/classification guard appears to compare a 0–100 confidence value against `0.75`, likely making the guard trivially permissive.

### Context bleed
Medical / Personal Care / no-context behavior must be tested to ensure restaurant assumptions do not leak across contexts.

### TTS failure visibility
ElevenLabs errors can apparently result in silence.

---

# 42. ROUTE / CODE REACHABILITY FINDINGS

### `/api/generate-reply`
Proven dead in the current live product. HEAR already gets response, tone variants, and follow-ups from classify.

### Phrase-tree subsystem
Historically there was a richer phrase/scenario browsing system involving `FlowNavigator`, `PhraseList`, `PhraseCard`, `SubContextBar`, `CategoryGrid`, `SpeechModeToggle`, `RescueModal`, and large hand-authored phrase trees.

The product direction evolved away from browsing phrase libraries and toward the HEAR/SAY loop.

However, some old prompt/parser/type code remains load-bearing. `restaurantIntents.ts` reportedly still provides parser/schema/types used by live Listen.

> **Do not delete the old subsystem in one sweep. Extract live IP and dependencies first.**

---

# 43. WHY THE OLD PHRASE TREE PROBABLY EXISTS

Earlier hypothesis:

> users may want to browse common travel situations and phrases.

Later stronger insight:

> when the user is actually stuck, they do not want to browse a library; they want the app to understand the current moment.

Likely long-term outcome: much of the phrase system can be removed, but historical examples, tone logic, intent schemas, or prompts may contain valuable product knowledge.

Before deleting:

- identify every live importer,
- migrate useful examples,
- migrate types/parsers if still needed,
- then remove disconnected UI.

---

# 44. MODERN MODEL OPPORTUNITY

The original architecture was built around older model capability.

Some complexity may now be removable:

- client-side caches,
- fuzzy matching,
- hand translation dictionaries,
- regex transcript corrections,
- multiple prompt modules,
- manual JSON parsing,
- hand-maintained fallback logic.

Desired modernization outcome is **subtraction**, not layering.

Bad outcome:

> GPT-5.6 + all the old scaffolding.

Good outcome:

> A modern structured model call reliably reproduces the product behavior while eliminating brittle legacy complexity.

Potential future shape:

raw/noisy speech → context-aware model → structured schema containing corrected transcript, meaning, confidence, Local response, Standard response, Polite response, pronunciation guidance, and useful follow-ups.

Do not rewrite this until the current iPhone baseline is known.

---

# 45. MODERNIZATION PRINCIPLE

Modernization should be evaluated against the product contract, not code elegance.

Correct question:

> “Can the new path reproduce or improve the exact user behavior while removing complexity?”

Preferred migration:

1. establish known-good baseline,
2. fix launch blockers,
3. freeze/tag it,
4. design modern architecture,
5. replace one vertical slice,
6. compare behavior,
7. only then remove old scaffolding.

---

# 46. DO NOT BIG-BANG REWRITE LISTENPANEL

`ListenPanel.tsx` is large and likely contains both unnecessary historical complexity and hard-won device logic.

Map responsibilities first:

- mic lifecycle,
- capture,
- transcription,
- silence detection,
- context,
- cache,
- classify,
- rendering,
- tone switching,
- TTS,
- sheet behavior.

Then isolate/rewrite one responsibility at a time.

---

# 47. FUTURE AI ARCHITECTURE SHOULD PREFER STRUCTURED OUTPUT

A modern implementation should strongly consider explicit schema, structured outputs, typed response contracts, model-version abstraction, and one coherent prompt/context layer.

The product requires stable fields such as transcript, meaning, responses, tones, follow-ups, and confidence.

Do not change the response contract until current UI behavior is documented and protected.

---

# 48. CACHING PHILOSOPHY

Caching was introduced for latency, cost, and repeated phrases.

But a confidently wrong cached answer is worse than paying for another model call.

Future direction should probably prefer:

- exact or carefully scoped deterministic caching,
- clear cache observability,
- conservative reuse,
- correctness over aggressive hit rate.

The known confidence-scale bug is evidence that cache complexity needs scrutiny.

---

# 49. DEMO SHOULD NOT SHARE ALL CORE RUNTIME COMPLEXITY

The demo is intentionally artificial and should prove the product.

It does not need live mic, real transcription, live waiter TTS generation, live uncertainty, or live speech recognition.

Best demo architecture:

- fixed high-quality input audio,
- timed transcript,
- fixed/representative model output,
- fixed response audio,
- product-realistic UI.

A canned deterministic demo is not dishonest if it demonstrates the actual product loop.

---

# 50. ELEVENLABS ROLE

Use ElevenLabs where voice quality materially matters.

### Definitely
- demo waiter audio
- demo response audio

### Useful
- optional pronunciation playback in core responses

### Not needed
- synthesizing what a real speaker already said in HEAR IT

Cost controls can be tuned after experience quality is correct.

---

# 51. DEMO VOICE ROLES

Historical direction used two distinct voices, including Daniel and Mila.

The important attributes are:

- clearly different speakers,
- native quality,
- realistic accent,
- natural rhythm,
- high intelligibility.

The user must instantly understand that one voice is “them” and the other is “you.”

---

# 52. THE PRODUCT SHOULD FEEL CONFIDENT

A key emotional design target:

> **confident**

Not educational, apologetic, touristy, childish, overexplained, AI-demo-ish, or SaaS-dashboard-like.

The UI should communicate:

> You are okay. I know what is happening. Here is what to do.

This is why the big singular mic worked.

---

# 53. ONE DOMINANT HERO ACTION

Do not create two competing primary red CTAs.

The big microphone is the hero.

SAY IT is important but secondary.

The common emergency use case is HEAR IT.

---

# 54. DO NOT OVER-EXPLAIN CONTEXT CHIPS

A useful framing was:

> “What are you up to? We’ll give you better responses.”

That explains the benefit without turning the screen into instructions.

Avoid decorative complexity unless tested.

---

# 55. PRODUCT VS MARKETING LANGUAGE

## Marketing
Can use humor, tension, disruption, universal travel failure, and “you definitely did not learn Spanish.”

## Product
Should use HEAR IT, SAY IT, concise context, direct outputs, and clear actions.

Do not paste acquisition hooks into every screen.

---

# 56. GO-TO-MARKET WEDGE

This can be a high-converting social-ad product because:

- pain is instantly recognizable,
- target audience is enormous,
- demo is visual,
- value can be understood quickly,
- transaction is low-friction relative to trip spend.

The ideal ad does not explain AI.

It dramatizes the moment:

> You said “hola.”  
> Then they actually started speaking Spanish.

Then show TapHabla solving it.

---

# 57. MONETIZATION DIRECTION

Strongest concept:

## **Trip Pass**
### approximately **$19 for 7 days**

Why:

- user is temporary,
- problem is immediate,
- traveler may dislike another subscription,
- trip already costs hundreds or thousands,
- $19 is small relative to repeated interaction relief,
- price can reinforce premium positioning.

Monthly/annual plans may exist later, but temporary use should remain central.

---

# 58. BUSINESS OUTCOME

The aspiration is roughly:

> **$40k+/month in profit**

That creates meaningful financial breathing room and turns TapHabla into a real business asset and proof of product creation/monetization.

The app itself should become proof. Do not turn the founder into the product prematurely.

---

# 59. FOUNDER / PRODUCT STRATEGY

The founder is an experienced CTO/executive, not trying to become a generic AI consultant or course creator.

Preference:

> Build something real first. Let the product become the proof.

If TapHabla gets real users and revenue, it becomes a strong anchor for later advisory work, founder credibility, startup credibility, or other opportunities.

---

# 60. PRODUCT PHILOSOPHY

TapHabla should be:

- small
- obvious
- fast
- focused
- useful
- premium
- opinionated

Avoid:

- feature bloat
- gamification
- learning streaks
- lessons
- giant phrase libraries
- social feeds
- AI-chat-box syndrome
- unnecessary configuration

The product should feel closer to Shazam, a flashlight, a calculator, or an emergency tool than to Duolingo or a language school.

---

# 61. CURRENT RESURRECTION STRATEGY

As of 2026-09-24:

1. preserve historical context,
2. create behavior baseline,
3. add temporary observability,
4. test actual current app on iPhone,
5. identify true launch blockers,
6. fix blockers in existing architecture,
7. make demo deterministic and excellent,
8. freeze known-good behavior,
9. modernize AI layer deliberately,
10. remove legacy complexity only after replacement behavior is proven.

Do not start with mass deletion, framework migration, or giant redesign.

---

# 62. NEXT DIAGNOSTIC STEP

Proposed technical step is a gated mode such as:

`?debug=taphabla`

Instrument HEAR, SAY, DEMO, TTS, mic path, cache path, context, model timings, playback timings, and drawer actions so debugging is based on evidence instead of feel.

---

# 63. REAL-IPHONE VALIDATION PASS

Short high-value sequence:

1. fresh load
2. HEAR IT first permission
3. have another person speak a normal Spanish sentence
4. allow auto-stop
5. close and repeat without refresh
6. refresh and repeat
7. kill/reopen Safari and repeat
8. Food context test
9. Medical context test
10. Personal Care context test
11. switch Local / Standard / Polite
12. verify no new request during tone switching
13. play core response TTS
14. test SAY IT typing and submit
15. test SAY IT TTS
16. run demo
17. inspect audio/transcript sync
18. test sheet dismissal / pull-to-refresh

This pass determines whether resurrection is surgical stabilization or a deeper speech-pipeline modernization.

---

# 64. HIGH-VALUE FIXES LIKELY TO COME FIRST

Assuming core HEAR works:

1. deterministic demo audio
2. demo transcript/audio synchronization
3. visible TTS errors
4. context regression fixes
5. confidence-scale bug
6. mic-denied recovery
7. sheet/pull-to-refresh behavior if actually broken
8. performance instrumentation
9. model modernization

---

# 65. WHAT NOT TO DO WITHOUT EXPLICIT REVIEW

Future agents should not autonomously:

- delete thousands of lines because they look dead,
- rewrite ListenPanel wholesale,
- remove Safari workarounds,
- switch speech capture stacks,
- change tone behavior,
- reintroduce network calls on tone switching,
- redesign the home screen,
- rename the product,
- add ten languages,
- convert the app into a generic chatbot,
- add lessons,
- add subscriptions as the only payment model,
- replace natural local phrasing with literal translation,
- use low-quality system TTS in the demo,
- show provisional bad English,
- make users configure AI before using the product.

---

# 66. DECISION HIERARCHY FOR FUTURE AGENTS

When there is conflict, prioritize:

1. **real human interaction success**
2. **real iPhone behavior**
3. **product intent in this document**
4. **acceptance behavior in `PRODUCT_BEHAVIOR_BASELINE.md`**
5. **correctness**
6. **latency**
7. **simplicity**
8. **cost**
9. **code elegance**

A theoretically clean implementation that makes a waiter interaction worse is a regression.

---

# 67. SOURCE-OF-TRUTH HIERARCHY

Use these together:

## 1. `TAPHABLA_PRODUCT_CONTEXT.md`
Why the product exists and what it is trying to become.

## 2. `PRODUCT_BEHAVIOR_BASELINE.md`
What the current product is intended / observed to do.

## 3. Current runtime code
How it actually works today.

## 4. Real iPhone testing
Whether the implementation works in the environment that matters for launch.

## 5. Git history / old code
Useful for archaeology, not automatically authoritative.

---

# 68. HOW TO UPDATE THIS FILE

This should remain a **living state file**.

Update it when:

- a product principle changes,
- a major feature direction changes,
- a historical ambiguity is resolved,
- a critical bug is understood,
- monetization strategy changes,
- naming/branding is finalized,
- multi-language architecture becomes active,
- an old subsystem is intentionally retired,
- a major AI architecture decision is made.

Do not update it for tiny styling tweaks or routine implementation details.

Suggested cadence:

- after major product milestones,
- after architecture migrations,
- before handing work to a new AI/model/engineer,
- periodically during active development.

---

# 69. AI AGENT HANDOFF INSTRUCTION

Any AI agent asked to work materially on TapHabla should first read:

1. `TAPHABLA_PRODUCT_CONTEXT.md`
2. `PRODUCT_BEHAVIOR_BASELINE.md`

Then explicitly state:

- what feature it is changing,
- what historical behavior must remain true,
- which current code path it believes implements that behavior,
- what real-iPhone validation is required.

Before deleting a major subsystem, identify:

- current reachability,
- live dependencies,
- historical purpose,
- product IP embedded in it,
- migration destination for anything still valuable.

---

# 70. FINAL PRODUCT TRUTH

TapHabla has real teeth because the problem is embarrassingly simple and widely experienced:

> **People travel somewhere without learning the language, another human starts talking normally, and suddenly they have no idea what is happening.**

The product does not need to teach them the language.

It needs to rescue the moment.

The winning version of TapHabla is not the product with the most features.

It is the product the traveler remembers to open when someone starts speaking.

One tap.

Understand.

Respond.

Move on.

That is the product.
