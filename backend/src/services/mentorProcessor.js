import path from 'node:path';
import fs from 'node:fs';
import MentorClip from '../models/MentorClip.js';
import { extractAudio, probe } from './ffmpeg.js';
import { transcribeFile } from './whisper.js';
import { detectPauses, computeWpm } from './fillerDetector.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Process a freshly uploaded mentor clip:
 *  1. Resolve absolute path
 *  2. Extract audio (if video)
 *  3. Transcribe via Groq Whisper -> word timings
 *  4. Build voiceProfile (avg WPM, pitch range placeholder, duration)
 *  5. Build minimal gestureProfile (real keypoint extraction happens lazily
 *     in the browser when a user practices with this mentor — MediaPipe runs
 *     against the playing <video> tag client-side)
 *  6. Mark processingStatus = 'ready'
 *
 * Designed to be called fire-and-forget from the upload route.
 */
export async function processMentorClip(clipId) {
  const clip = await MentorClip.findById(clipId);
  if (!clip) return;

  try {
    clip.processingStatus = 'processing';
    await clip.save();

    const rel = clip.sourceUrl.replace(/^\/uploads\//, '');
    const sourcePath = path.join(UPLOAD_DIR, rel);
    if (!fs.existsSync(sourcePath)) throw new Error(`Source missing: ${sourcePath}`);

    let audioPath = sourcePath;
    if (clip.mediaType === 'video' || /\.(mp4|mov|mkv|webm|avi)$/i.test(sourcePath)) {
      audioPath = await extractAudio(sourcePath, UPLOAD_DIR);
    }

    let durationSec = 0;
    try {
      const meta = await probe(sourcePath);
      durationSec = Number(meta?.format?.duration) || 0;
    } catch {}

    const stt = await transcribeFile(audioPath);
    const avgWpm = computeWpm(stt.wordTimings);
    const pauses = detectPauses(stt.wordTimings);

    clip.transcript = stt.transcript;
    clip.wordTimings = stt.wordTimings.map((w) => ({ ...w, stressLevel: 0 }));
    clip.voiceProfile = {
      avgWpm,
      pitchRangeHz: { min: 0, max: 0 },
      avgVolumeDb: 0,
      voiceCloneId: null,
    };
    clip.gestureProfile = {
      avgGestureRate: 0,
      avgAmplitude: 0,
      openPalmRatio: 0,
      signaturePosture: '',
      keypointTimeline: [],
    };
    clip.processingStatus = 'ready';
    clip.processingError = null;
    await clip.save();

    if (audioPath !== sourcePath && audioPath.endsWith('.audio.mp3')) {
      try { fs.unlinkSync(audioPath); } catch {}
    }

    console.log(`[Voxa] mentor clip ${clipId} ready — ${stt.wordTimings.length} words, ${avgWpm} WPM, ~${Math.round(durationSec)}s`);
  } catch (err) {
    console.error(`[Voxa] mentor processing failed for ${clipId}:`, err.message);
    clip.processingStatus = 'failed';
    clip.processingError = err.message;
    await clip.save();
  }
}
