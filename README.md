# Voxa (working name)

AI English communication coach. Karaoke-style practice with voice + hand gesture analysis. Upload any speaker (Steve Jobs / Modi / TED talk) and learn to mimic their style.

> **Brand name TBD** — `voxa.com` is taken by another AI product; final name will be picked before launch. Folder + repo will be renamed at that time.

## Core loop

1. Pick a topic, or upload a mentor video/audio
2. Karaoke screen: text scrolls + highlights word-by-word as you read aloud (with webcam on)
3. AI analyzes your **voice** (pace, pitch, volume, pauses, fillers) AND your **hand gestures + posture** (MediaPipe pose tracking)
4. AI plays back the ideal version — in the mentor's cloned voice if uploaded
5. Side-by-side feedback report: what to fix, where to stress, where to gesture, how to copy the mentor

## Tech (all free in MVP — no paid AI APIs)

| Layer | Tool |
|-------|------|
| Frontend | React + Vite |
| Backend | Node + Express |
| DB | MongoDB |
| TTS (AI voice) | Microsoft Edge TTS (free) |
| Voice cloning | Coqui XTTS-v2 (free, open source) |
| STT + word timings | Whisper (open source) |
| Voice features | Web Audio API + meyda (browser); librosa (Python optional) |
| Pose / gesture | MediaPipe Pose + Hands (browser, free) |
| Coaching text | Groq (free tier) |
| Payments | Razorpay subscriptions |

## Folder layout

```
Voxa/
├── frontend/        React + Vite app
├── backend/         Express + MongoDB API
└── README.md
```

## Pricing (planned)

- **Free:** 1 practice session
- **Paid:** mass-market India (~₹199-499/mo, ~₹1999/yr) — final pricing TBD

## Status

MVP scaffolding in progress (2026-05-29).
