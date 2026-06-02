# Voxa — R&D / Competitive Validation (the go/no-go gate)

> Done before building, the way a funded company would. Every claim below traces to web research
> (2026-06-02). Funding/user numbers cited only where a source existed; unverifiable items flagged.
> **Verdict: CONDITIONAL GO — build as a "delivery mirror," not an "objective grader," and run 3
> cheap validation tests BEFORE the heavy pipeline.** Reasoning below.

---

## 1. Does it already exist? (competitor reality)

**The market is crowded, well-funded, and splits cleanly into silos — but nobody occupies our intersection.**

| Competitor | What they do | Funding (sourced) | India price | The gap they leave |
|---|---|---|---|---|
| **Yoodli** | Pace, filler, eye-contact (claimed). Grade-after, whole-session. Enterprise/US. | ~$60M, $300M valn (TechCrunch Dec 2025) | none found | No per-sentence, no emphasis, no pitch, no India |
| **ELSA Speak** | Phoneme pronunciation + word-stress + intonation. India-strong. | ~$60M (Series C, TechCrunch 2023) | localizes (INR not verified) | Not a *game*, no delivery/body/Hinglish |
| **BoldVoice** | Phoneme accent coaching + coach videos. US-accent focus. | $27M, $10M ARR, 5M dls (AlleyWatch Jan 2026) | none found | Accent-only, US-skewed, no game/body/Hinglish |
| **SpeakX (India)** | AI conversation practice. "India's largest AI-speaking app." **Most direct rival.** | ~$23M, 200K paid, ~$7M ARR (Elevation) | **₹299/mo** | No delivery depth, no pitch/emphasis/body |
| **Duolingo** | Gamified vocab/grammar + new AI video-call. Best habit loop. | public (NASDAQ) | **Max ₹99/mo** | No pronunciation depth, no delivery, no body |
| **EngVarta / Clapingo / Cambly** | Human tutors, real correction. | various | ₹108/session · ₹999/mo · ₹1,999+ | Not gamified, not scalable, no camera/automation |
| **Pronounce** | Filler + pace on real meetings. | none found | none found | No pitch/emphasis/body, no game, no India |

**Verified gap (this is real, confirmed across ~25 products):**
- **No one does word-level EMPHASIS analysis.** Nobody.
- **No one does camera-based BODY-LANGUAGE analysis** in this market (Cambly has video calls but doesn't *analyze* them; VirtualSpeech does it only in VR).
- **No one does a "prescribe-then-grade / marked-script" loop** — all grade a free recording after the fact.
- **No one combines gamified path + delivery coaching + Hinglish sentence-formation.** The India players are pronunciation (ELSA) or conversation (SpeakX) or human tutors; the delivery players (Yoodli, Orai) are US-professional and ungamified.

**So: yes, the white space is real.** Delivery + body-language + Hinglish, wrapped in a Duolingo-style path, at an India price — is unoccupied.

---

## 2. Can we beat them? (and the brutal catch)

We can *differentiate* — but the competitive analysis and the **feasibility analysis collide on one painful point:**

> **The exact features that are our differentiators (word emphasis, body language) are the ones that are scientifically the HARDEST to measure reliably. And the features that are reliable (pace, pause, pitch) are partly commoditized.**

### Feasibility verdict per capability (from academic sources)

| Capability | Tool | Verdict | Grade or just show? |
|---|---|---|---|
| Pace / WPM / pauses | WhisperX timings (±100ms) | USABLE w/ caveats | Light grade |
| **Pitch contour / range / monotone** | CREPE/pYIN (~99% RPA clean) | **RELIABLE** | **Can grade** |
| **Emphasis / prominence** | z-scored pitch+energy+dur | **RISKY** (~24% err; humans agree only ~80%) | **SHOW only — never grade** |
| Pronunciation via Whisper-WER | Whisper | **RISKY** (auto-corrects accent → hides errors AND penalizes accent) | Don't score |
| Pronunciation via wav2vec2 GOP | GOP-CTC | USABLE (sentence PCC ~0.7–0.8) | Directional, phase 2 |
| **Body language / gesture / eye-contact** | MediaPipe | **RISKY** (no objective "good"; gaze unreliable; cultural) | **MIRROR only — never grade** |

### The hard truth about auto-grading "delivery"
- Trained human raters agree on public-speaking delivery quality at only **r = .23–.71** (ETS). **If experts can't agree, there is no ground truth for an AI to be "right" about.**
- Automated *proficiency* scoring (ETS SpeechRater r≈0.85) works — but it scores **timing/pausing/fluency/vocabulary**, NOT "did you emphasize the right word" or "were your gestures good."
- **Whisper accent bias is toxic for an India-first product:** scoring intelligible Indian-accented speech as "errors" is both wrong and reputationally damaging.

**Conclusion on "can we beat them":** Yes — but by being the **delivery mirror + India/Hinglish + gamified path**, leading with what's *reliable* (pace/pause/pitch) as scores and showing emphasis/body as *visual self-awareness*, never as a verdict. If we auto-grade the risky axes, we lose on trust (wrong ~1 in 4) — the fastest way to kill credibility.

---

## 3. Are they cheaper? (price reality)

**Yes, dangerously so. We cannot win on price.**
- **Duolingo Max: ₹99/mo** — the mass-market AI ceiling.
- **SpeakX: ₹299/mo** — the India-speaking-app benchmark.
- Free vernacular apps (Hello English, 50M installs) anchor the bottom at ₹0.

We can't out-cheap Duolingo. Our free stack (Edge TTS, Whisper, MediaPipe) makes a low price *viable* (SpeakX hit $7M ARR with 20 people at ₹299), so the play is a **generous free tier + paid ₹149–399/mo justified by features no one else has** — not a price war.

---

## 4. Do they have more funding? (yes — a lot)

Yoodli ~$60M · ELSA ~$60M · Speak ~$162M ($1B valn) · BoldVoice $27M · SpeakX $23M. **We are a bootstrapped solo build against venture-funded teams.** Implication: **we cannot win by out-spending or out-engineering the commodity (pace/filler/conversation).** Defensibility must be the *wedge*: prescribe-then-grade + emphasis-visualization + body-language mirror + Hinglish + game — and speed/focus on India that big global players won't prioritize.

---

## 5. Does the market even want it? (the biggest unknown)

- **Demand for "spoken English / pronunciation / interview prep" in India: PROVEN.** ~250M+ English learners; 17% CAGR; ELSA/SpeakX/Duolingo all monetize it.
- **Demand for "delivery/prosody/gesture coaching" as a category: UNVERIFIED.** No data found that Indians will pay for "optimize your pitch and gestures." They pay for *"speak English, fix my pronunciation, clear my interview."*
- **Retention cliff is structural:** ~95% of education apps churn by Day 30; even Duolingo reaches only ~28–30%. A measurement tool with no habit loop churns worse — which is *why* the Duolingo-style path matters, but also why the game has to be genuinely good.

**Reframe this forces:** Position Voxa as **"speak confident English + crack interviews"** (proven willingness-to-pay), with delivery analytics (pitch, pace, emphasis-viz, body-mirror) as the *differentiated how* — NOT as a "delivery coach" (unproven WTP).

---

## 6. Verdict — does it pass the test?

**It passes the "is there a gap" test. It does NOT yet pass the "proven demand + reliable-enough-to-grade" test.** A funded company would NOT build the full pipeline here — it would run three cheap tests first.

### Run these BEFORE the heavy build (in priority order)

1. **Accuracy benchmark (the technical gate — ~a weekend).** Collect 50–100 real Indian-accented clips. Have 2–3 humans rate pace/pitch/emphasis/clarity. Correlate against our pipeline. **Gate: PCC ≥ 0.7 → may grade that axis; below ~0.5 → show only.** This tells us exactly which axes can be scores vs visualizations — and de-risks the whole product.
2. **Landing-page smoke test (the demand gate — ~a day).** "Record 30s → get your delivery report" + an India-targeted ask-for-access. **Gate: ≥10–15% CTR from cold traffic.** Validates that Indians want *delivery* coaching, not just spoken English.
3. **Concierge MVP (the value gate — 1–2 weeks).** Manually coach 10 users with human-written feedback behind an AI-looking UI. **Gate: ≥40% say they'd be "very disappointed" without it + they return.**

### If the gates pass → build (with this reframe baked in)
- **Delivery mirror, not grader.** Pace/pause/pitch = scores. Emphasis + body = visual self-awareness, framed as "here's what you did," never "you were wrong."
- **Positioning = confident spoken English + interview prep** (proven WTP), delivery analytics as the wedge.
- **Hinglish sentence-formation + body-language mirror = the two most defensible, least-copied features.** Lead marketing with these.
- **Gamified path is non-negotiable** — it's the only proven antidote to the Day-30 churn cliff.
- Free stack keeps the price low enough to live under Duolingo/SpeakX with a fatter free tier.

---

## Honesty markers (what's NOT confirmed)
- Exact Whisper Indian-accent WER (JASA paper paywalled) — "2–12% gap, Indian among hardest" is directional, not primary-confirmed.
- India WTP for *delivery* coaching specifically — **no data found**; this is itself the #1 demand risk and the reason for test #2.
- Several INR prices (ELSA, Speak, BoldVoice) — not found with citation.
- Yoodli camera body-language, Orai/VirtualSpeech user counts — vendor/third-party self-reports, unverified.
- SpeakX install count blends legacy "Yellow Class" (kids) history under the same package.

*Sources archived in session research (competitive landscape ×2 + feasibility review). Re-verify SpeakX/ELSA/Duolingo numbers directly in-browser before using in any deck.*
