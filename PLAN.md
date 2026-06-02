# Voxa — Master Plan: The Sentence-by-Sentence Delivery Coach

> Working name. Vision: the first app that coaches *every single sentence* of your speech
> across all 6 delivery axes — pace, pause, pitch, emphasis, articulation, body — the way an
> acting/voice coach marks up a script. Mass-market India, Hinglish-aware, free stack.

---

## 0. Where we are vs where we're going

**Today (honest audit of the existing code):**
- Karaoke read-aloud with word highlight (`Practice.jsx`).
- Voice metrics that are *real*: WPM, filler count, pause count, avg volume.
- Voice metrics that are **faked / hardcoded to 0**: `avgPitchHz`, `pitchVariance`, `clarityScore`. **Pitch & tonality are not measured at all.**
- Gesture metrics: crude motion rate / arms-crossed / open-palm via MediaPipe.
- Feedback: one Groq call → 3 generic tips per category + one overall score. **Whole-session, not per-sentence.**
- No: per-sentence prescription, articulation/pronunciation scoring, "when to raise/lower pitch," sentence-formation help, structured curriculum, deliberate-practice loop.

**The shift:**

| From | To |
|---|---|
| Record whole speech → 1 report card | Coach **one sentence at a time** on 6 axes |
| Generic tips ("be more confident") | **Per-word markup** ("pause 0.4s before *home*, lift pitch on *now*") |
| Grade only (after) | **Prescribe → demonstrate → grade the diff** (before + after) |
| Pitch faked | Pitch contour measured, scored, taught |
| One-shot practice | **Deliberate micro-reps** — re-do a line until the marks land |
| Reading aid | Full coach to **articulation level**, plus sentence *formation* for Indians |

---

## 1. The heart: the 6-Axis Sentence Engine

Every sentence the user practices is scored on **six axes**, each anchored to specific words/timestamps. This is the product's spine — everything else is UI and curriculum around it.

| Axis | What we measure | The rule we teach (one line) | Data source |
|---|---|---|---|
| **1. Pace** | local WPM + articulation rate per sentence | 140–160 WPM conversational; slow on key lines, speed on lists | Whisper word timings |
| **2. Pause** | gap before operative word; "power pause" after a thesis; punctuation→breath | Pause *before* the key word (~0.4s); land the thesis with ≥1.5s silence; replace fillers with silence | Word timings + silence |
| **3. Pitch / Tonality** | F0 contour per sentence; terminal slope; pitch range | **Statements end DOWN, questions end UP**; kill uptalk; no monotone; "staircase" descent | pYIN / parselmouth (server) |
| **4. Emphasis** | acoustic prominence peak (pitch+energy+duration) per word | Stress the **operative content word** (verb/noun/adj), ≤1–2 per clause | z-scored F0+RMS+duration |
| **5. Articulation** | intelligibility (Whisper WER vs target) → later phoneme GOP | Crisp consonants; fix MTI substitutions (v/w, th, s-clusters); stress-timed not syllable-timed | Whisper WER → wav2vec2 GOP |
| **6. Body** | beat gesture synced to operative word; open posture; sway; adaptors; eye-contact dwell | Beat gesture lands **on the operative word ±150ms**; open & grounded; eyes hold 3–5s | MediaPipe Pose/Hands |

**The killer feature this unlocks:** because emphasis (#4) and gesture (#6) both anchor to the *operative word*, Voxa can say **"gesture HERE, on the word *future*"** — per sentence. That's the thing the user said is missing.

### How "when to raise/lower pitch" gets computed (concrete)
1. Parse the target sentence → POS-tag → pick the **operative word** per clause (highest-content verb/noun/adj).
2. Classify sentence type: statement / question / list / "build" (rule-of-three climax, intensifiers) / conclusion.
3. Generate the **prescription**:
   - statement → terminal pitch **down**; question → terminal **up**; list → step **up** per item, **down** on last; build → rising trend; conclusion → drop to low register.
   - pause **before** operative word; **power pause** after a thesis/punchline sentence.
   - **beat gesture** scheduled on the operative word.
4. After the user speaks, measure actual F0 slope / prominence / gesture timing and **diff against the prescription**, word by word.

This prescription is pre-computed (rules + one Groq pass), cached on the sentence, and reused for every learner — cheap.

---

## 2. The signature UX: "The Marked Script"

Actors mark scripts with a notation. We make that notation the product's visual language — the thing that makes Voxa instantly *look* like real coaching, not a quiz.

**Notation vocabulary (rendered on the sentence):**
- **Underline** = operative word (stress here)
- `/` = short pause · `//` = long pause (power pause)
- `↑ ↓` = pitch rises / falls on that word
- ✋ icon under a word = beat gesture lands here
- `>` over a run = build energy

**Sentence Studio — the core loop screen (replaces today's `Practice.jsx` one-shot flow):**

```
┌─ Sentence 3 of 8 ───────────────────────────────────────────┐
│                                                              │
│   "The /  best time to start  ✋was yesterday //             │
│        the second↓ best time is  now↑."                      │
│         └underline=stress  ✋=gesture  ↑↓=pitch  /=pause      │
│                                                              │
│   [▶ Hear the ideal version]   [🎤 Your turn]                │
│                                                              │
│   ── after you speak: the DIFF ──                            │
│   Pace      ▓▓▓▓▓▓▓░░  168 wpm (a touch fast on a key line)  │
│   Pause     ✓ nailed the pause before "best"                 │
│   Pitch     ✗ you went UP on "now"'s neighbour — good, but   │
│             you rose on "yesterday" (uptalk). Resolve down.  │
│   Emphasis  ✓ stressed "best"  ✗ missed "now"                │
│   Diction   ✓ clear (98%)                                    │
│   Body      ✗ gesture came 0.4s late — land it on "was"      │
│                                                              │
│   [🔁 Try again]   [Next sentence →]                          │
└──────────────────────────────────────────────────────────────┘
```

- **Before** speaking: the marked script + an **ideal-version audio** (edge-tts with word-boundary sync; mentor's cloned voice if uploaded).
- **After** speaking: a **per-axis, per-word diff** with the exact fix. Positive-specific tone ("the pause before *best* was perfect — do that again").
- **Repeat gate:** the user can re-do the same line; "pass" requires N clean axes. This is the deliberate-practice loop that makes results visible.

This single screen is the entire revolution. It answers all four of the user's complaints (body per sentence, pace/pause/pitch/emphasis/articulation focus, when to move pitch, "detect everything").

---

## 3. The 5 communication pillars → mapped to Voxa features

The user wants all five pillars covered, not just delivery. Here's the mapping so nothing is hand-wavy.

### Pillar 1 — Clarity over vocabulary
- **Articulation axis** (#5): intelligibility scoring; if Whisper mishears you, the word was unclear.
- **"Plain-line" rewriter:** after a free-speak answer, Groq flags over-complex or vague sentences and offers a clearer version. Teaches "say it simply."
- Diction drills (tongue-twister mode) with accuracy gating.

### Pillar 2 — Structure / thinking out loud
- **Free-Speak mode** (not just read-aloud): user answers a prompt ("Introduce yourself in 60s"). We transcribe, then run a **structure analysis**: did you lead with the point (BLUF)? rule-of-three? signposting? 
- Visual **structure map** of what they said → suggested reorder. Templates: BLUF, Rule-of-Three, Story Spine (Pixar).

### Pillar 3 — Delivery mechanics (the 6-axis engine)
- This is §1. Pace, pause, pitch, emphasis, articulation, *and* sub-points all covered per sentence.

### Pillar 4 — Listening & adapting
- **Shadowing / echo mode:** play a native line, user repeats, we score how closely the *prosody* (pitch contour + rhythm) matches — trains the ear→voice loop.
- **Roleplay mode (v2):** Groq plays an interlocutor; user must respond appropriately (adapt tone to context: pitch a friend vs an investor). Scored on register-appropriateness.

### Pillar 5 — Confidence signals
- Detectable & coached: **hedge-word density** ("just", "I think", "maybe"), **uptalk** (terminal pitch), **filler→pause swaps**, **grounded stance / no sway / open posture** (pose), **eye-contact dwell**.
- A single **"Confidence meter"** aggregating these, shown trending up over time.

---

## 4. The India / Hinglish layer (our moat)

This is what makes Voxa *for India* and not a generic clone. Two sub-systems:

### 4a. Sentence Formation (Hinglish → natural English)
The user explicitly asked for this. In **Free-Speak** and a dedicated **"Fix my sentence"** mode:
1. **LanguageTool self-hosted** (has an Indian-English variant) → deterministic grammar errors with offsets → "underline + explain the fix."
2. **Groq LLM** → natural idiomatic rewrite + one-line reason per change, handling Hinglish/code-switching and L1 calques ("I am having a doubt" → "I have a question").
3. Show **both**: precise fixes *and* a fluent rewrite, side by side. User can then *practice speaking the corrected version* in Sentence Studio — closing the loop from "what to say" to "how to say it."

### 4b. Mother-Tongue Influence (MTI) pronunciation
Targeted minimal-pair drills for the classic Indian-English issues, flagged when detected:
- **v/w merge** (vine/wine), **th→t/d** (think/tink), **epenthetic vowel** on s-clusters (school/ischool), **z→s** devoicing, **wrong lexical stress** (deVELopment).
- **Stress-timing fix** (the highest-ROI rhythm correction): Indian English is syllable-timed; English is stress-timed. Measure syllable-duration variance → "stress the strong syllables, reduce the rest."
- Framed always as **"clarity," never "accent correction"** — keep it respectful and authentic.

---

## 5. The Voxa Path — level-wise game (Duolingo-style)

This is the **primary structure** of the product (it supersedes the old "themed tracks" idea, which was a content library, not a progression). The genius we borrow from Duolingo: **teach one skill at a time, layer the next on top, gate progress on mastery, make every step a tiny win.** This also fixes the biggest flaw in a naive design — scoring all 6 axes from sentence one would make a beginner fail everything and churn. The Path introduces the 6 axes **one section at a time**.

### Structure: Sections → Units → Lessons → Stars
- **Path:** one vertical scrolling map of **Units** (modern Duolingo style), grouped into **Sections** by skill.
- **Unit:** ~4–6 **Lessons** + a **Checkpoint**. Locked until the previous unit is passed.
- **Lesson:** 4–8 micro-exercises, each **< 20s** (one sentence). Ends with **1–3 stars**.
- **Crown levels:** redo a completed unit to push lessons 1★→2★→3★. Higher levels **raise the score threshold AND layer in prior axes** → infinite mastery depth + built-in spaced repetition.
- **Gold/decay:** 3★ a whole unit → it turns gold; gold decays over time → prompts a review session (spaced repetition, the thing that actually builds skill).

### The skill ladder (axes introduced progressively)

| Section | Theme | Units (lessons drill these) | Axes scored | Tech needed |
|---|---|---|---|---|
| **1. Foundations** | "Be understood" | Articulation basics · Speak up & steady · Slow down · Stop the "um" | clarity, volume, pace, filler | **Cheap** (Whisper WER, Web Audio, word timings) — already have it |
| **2. Rhythm** | "Pace & pause" | Pause before the key word · Punctuation = breath · The power pause · Pace control | + pause, pace | Cheap (word timings) |
| **3. Emphasis** | "Hit the right word" | Operative words · Contrastive stress · Don't flatten | + emphasis | Energy+duration prominence (no pitch yet) |
| **4. Melody** | "Pitch & tonality" | **End down (kill uptalk)** · Questions go up · Lists & the staircase · Build & resolve · Beat monotone | + pitch/tonality | **Python Audio Brain** (pitch contour) |
| **5. Presence** | "Body language" | Open & grounded · Beat gesture on the key word · Eye contact (3–5s) · Cut the fidget | + body | MediaPipe (already have) |
| **6. Confidence** | "Put it together" | Kill the hedges · 2 axes at once · 4 axes at once · Full delivery (all 6) | integration | All of the above |
| **7. Structure** | "Think out loud" | BLUF · Rule of three · Signposting · Tell a story | structure (free-speak) | Groq + transcript |
| **8. Real World** | "Use it" | Self-intro · Interview answers · Toast · Sales pitch · Daily convo | all 6 + structure, free-speak | All |
| **9+. Adapt** (advanced) | "Read the room" | Roleplay (tone to context) · Shadow a mentor · "Speak like \<X\>" | prosody-match, register | Audio Brain + Groq |

**India track (parallel side-quests, non-blocking):** "Fix My Sentence" (Hinglish→natural English) and **MTI minimal-pair drills** (v/w, th, s-clusters, stress-timing) appear as **daily bonus quests** and as **auto-remediation** when the engine detects an L1 issue — but they're *off the main gating path* so they never block a learner, and they award gems. Framed as clarity, never accent-shaming.

### Lesson anatomy (every lesson)
1. **Teach card (10s):** the rule + a good-vs-bad audio example ("hear uptalk vs authority").
2. **Drill reps:** sentences focused on this unit's axis. Early sections score **only that axis** (forgiving); later sections layer prior axes back in.
3. **Boss line:** one harder sentence combining the unit's skill.
4. **Result:** star rating + XP + which word you nailed/missed.

### Failure model — stars, not hearts (deliberate deviation from Duolingo)
Speech scoring is fuzzy, so a hearts/lives system that hard-blocks on a misfire = rage-quit. Instead:
- Retry any rep freely; nothing is "lost."
- A lesson **passes at a forgiving threshold** (1★ = "you got the main idea").
- Encouragement over punishment; the diff shows the fix, not a penalty.

### Game economy (retention)
- **XP** per lesson; **daily goal** (e.g., 30 XP) with a ring to close.
- **Streak** + **streak freeze**.
- **Gems**: earned by lessons, spent on streak freeze / bonus mentor content / retry boosts.
- **Leagues / weekly leaderboard** (by XP) — strong social driver for India (Phase 4).
- **Daily quests** ("Cut uptalk in 5 lines today") and **skill badges** ("Uptalk Slayer", "Pause Master").

### Placement test (onboarding, 3 min)
3-sentence baseline read + 1 free-speak → instant **Voice Report** (top 2 strengths, top 2 fixes, Confidence score) AND a **placement** on the Path (clear speakers skip Foundations). This is the hook: instant, specific, personal.

### Progress visualization = the "visible results" engine
- The **Path screen** (vertical, unit nodes, colored sections) — you *see* yourself climbing.
- **6 axis skill-meters** (Clarity · Rhythm · Emphasis · Melody · Presence · Structure) that fill as you progress — this is literally the proof "you got better at this exact thing," which is what keeps people in.

### Why it won't bore them
- Every rep < 20s with an instant visual diff — slot-machine feedback rhythm.
- One skill at a time — never overwhelming, always a clear "today I'm leveling up X."
- Climbing a visible map + streak + stars = the proven Duolingo habit loop.
- Replay-with-overlay: hear your own line with the markup, see the miss, fix in 2 reps.

---

## 6. Technical architecture (stay free, add one Python brain)

Keep the React + Node/Express + MongoDB spine. Add **one Python microservice** ("Voxa Audio Brain") for the acoustic analysis Node can't do well. Everything below is free/open-source.

```
Browser (React)                 Node/Express (API)            Python service (Audio Brain)
─────────────                   ──────────────────            ───────────────────────────
• MediaRecorder (audio)   ───►  • session orchestration  ───► • Whisper STT + word timings
• Web Audio (live energy,       • pause/pace arithmetic       • wav2vec2 forced alignment (<100ms)
  rough pitch needle)           • LanguageTool call           • pYIN/parselmouth → F0 contour
• MediaPipe Pose/Hands (live)   • Groq (prescription,         • RMS/intensity → prominence
• Silero VAD (onnx-web, live)     rewrite, coaching text)     • (v2) wav2vec2 GOP pronunciation
                                • edge-tts ideal version      • emphasis z-score model
                                                              • (premium) OpenVoice/F5 cloning
```

**Live (in-browser, cheap):** energy meter, rough pitch needle, VAD, pose/gesture, karaoke highlight.
**Batch (server, after recording):** everything word-anchored — pitch contour, emphasis, pause/pace, articulation, the diff. All depend on accurate Whisper word timings.

### Final free stack (confirmed by research)
| Capability | Tool | Where | Cost |
|---|---|---|---|
| F0 / pitch contour | `librosa.pyin` or `parselmouth` (batch); `pitchfinder` YIN (live needle) | Python / browser | Free |
| Emphasis/prominence | z-scored F0-peak + RMS + duration/syllable, utterance-normalized | Python/Node | Free |
| Pronunciation MVP | Whisper-vs-target **WER** + avg-logprob | Node (existing Whisper) | Free |
| Pronunciation v2 | wav2vec2 phoneme + **GOP-CTC** | Python | Free |
| Word-timing accuracy | **wav2vec2 forced alignment** (WhisperX-style) — the multiplier | Python | Free |
| Pause & pace | Whisper timings + `pyphen`/CMUdict syllables; 200ms pause floor | Node | Free |
| VAD | **Silero VAD** (ONNX) | browser + Python | Free |
| Ideal-version TTS + word sync | **edge-tts** (`WordBoundary` events) | Node | Free |
| Mentor voice cloning | **OpenVoice** (MIT, commercial-safe) or **F5-TTS** — *not* XTTS (non-commercial license) | Python, batch | Free |
| Grammar (deterministic) | **LanguageTool self-hosted** (Indian English) | Node→Docker | Free |
| Natural rewrite + coaching | **Groq** free tier | Node | Free tier |

**Two important watch-outs from research:**
- **edge-tts cannot do per-word emphasis SSML** (one prosody tag per utterance). Plan: whole-sentence prosody demo + *visual* per-word emphasis markers (we already compute those). Optionally segment-and-concatenate for a "hear this word emphasized" button.
- **Coqui shut down (Dec 2025).** XTTS-v2 weights still work but are **non-commercial** — for a paid product use **OpenVoice/F5-TTS** instead.

---

## 7. Data model changes (Mongo)

- **`Sentence`** (new): belongs to a Topic/Script. Fields: `text`, `clauses[]`, `operativeWords[]`, `sentenceType` (statement/question/list/build/conclusion), `prescription` (pause marks, pitch arrows, gesture beats — pre-computed & cached), `idealAudioUrl`.
- **`SentenceAttempt`** (new): per rep. `sessionId`, `sentenceId`, axis scores (pace/pause/pitch/emphasis/articulation/body), `perWordDiff[]`, `passed`, `attemptNumber`.
- **`Session`**: keep, but becomes a container of attempts; add `microSkill`, `track`, aggregate deltas.
- **`User`**: add `streak`, `streakFreezes`, `xp`, `gems`, `dailyGoal`, `confidenceScore` history, `mtiProfile` (detected L1 issues to target), `placement`.
- **`Unit` / `Lesson`** (new, content): the Path definition — section, order, axes scored, lesson exercises, unlock rules.
- **`UserProgress`** (new): per user × unit/lesson — `stars`, `crownLevel`, `gold` + `goldDecayAt`, `passed`, `bestScores` per axis. Drives the Path map + spaced-repetition review prompts.
- Keep `MentorClip`, `Topic` (Topic → gains `sentences[]`).

---

## 8. Phased roadmap (reordered: ship a playable GAME before the heavy audio infra)

Key insight from the level design: **Sections 1–3 only need cheap signals Node already computes** (Whisper WER, Web Audio energy, word timings, energy+duration prominence). The expensive Python "Audio Brain" (pitch/forced-alignment) isn't needed until **Section 4 (Melody)**. So we ship a real, playable Duolingo-style game first, then deepen.

**Phase 1 — The Path + Sentence Studio + Sections 1–3 (cheap stack).** *Ship a playable game.*
- Game scaffold: Path screen, Units/Lessons/Stars, XP, streak, daily goal, gems.
- **Sentence Studio** screen: marked script + ideal audio (edge-tts) + per-axis diff + free retry.
- Build Sections 1–3 (Foundations, Rhythm, Emphasis) with existing/cheap signals — **no Python service yet**.
- Prescription generator for these axes (POS + rules + 1 cached Groq pass).
- Placement test → Voice Report. Data model: Sentence, SentenceAttempt, user streak/XP.

**Phase 2 — Python Audio Brain + Section 4 (Melody) + Section 5 (Presence).** *The pitch unlock.*
- Stand up the Python service: Whisper + **wav2vec2 forced alignment** + pYIN/parselmouth F0.
- Make pitch REAL (kills the hardcoded-0 bug): terminal slope, pitch range, staircase.
- Melody units (end-down/kill-uptalk, questions-up, lists, build/resolve, monotone).
- Presence units (already have MediaPipe): gesture-on-operative-word sync, posture, sway, eye-contact.

**Phase 3 — Section 6 (Confidence) + Section 7 (Structure) + India track.**
- Integration units (2→4→6 axes at once), hedge-word + confidence meter.
- Free-Speak mode: BLUF / rule-of-three / signposting analysis (Groq).
- India side-quests: LanguageTool self-host + Groq rewrite ("Fix My Sentence") + MTI minimal-pair drills.

**Phase 4 — Section 8 Real World + social + moat.**
- Scenario units (interview, toast, pitch, daily convo) — apply all axes free-speak.
- **Leagues / leaderboards**, daily quests, skill badges.
- wav2vec2 GOP phoneme-level pronunciation.
- Mentor voice cloning (OpenVoice/F5) as premium; Section 9 roleplay + shadowing.

**Phase 5 — Polish, perf, monetize.**
- Anti-template visual design, **mobile-first**, Core Web Vitals.
- Razorpay subscriptions, paywall placement, analytics.

### Open design constraint to resolve
**Body-language (Section 5) needs a camera** — awkward on a handheld phone while gesturing. Options: "prop up your phone" prompt, make Presence the one desktop-recommended section, or make body units optional/bonus on mobile. Decide before Phase 2.

---

## 9. Monetization (freemium, India mass-market)

- **Free:** daily warm-up + 1 micro-skill + 2 Sentence-Studio lines/day + weekly Voice Report. Enough to feel real progress, capped enough to convert.
- **Paid (~₹199–399/mo, ~₹1499–1999/yr):** unlimited studio lines, all tracks, mentor cloning, phoneme-level pronunciation, full history/analytics, "Fix my sentence" unlimited.
- Conversion hook = **visible results**: "you cut uptalk 6→1, gestures synced 40%→85% — unlock to keep the streak."

---

## 10. Why this becomes unbeatable

1. **Per-sentence prescription + diff** — no consumer app does the actor's "marked script" loop. Competitors grade; we *coach*.
2. **All 6 axes anchored to the operative word** — lets us say "gesture HERE, lift pitch HERE" per line. That specificity *is* the product.
3. **India-native** — Hinglish sentence formation + MTI drills, framed as clarity not accent-shaming.
4. **Deliberate-practice engine** — short reps, one micro-skill/day, visible deltas → habit + results, the two things that retain.
5. **All free stack** — fat margins at ₹199, defensible on cost in India.

---

*Plan authored 2026-06-02. Built on: existing Voxa codebase audit + acting/voice-coaching pedagogy research + free-stack feasibility research (both archived in session).*
