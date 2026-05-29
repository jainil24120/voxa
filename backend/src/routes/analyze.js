import { Router } from 'express';
import multer from 'multer';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.js';
import { detectFillers, computeWpm, detectPauses } from '../services/fillerDetector.js';
import { generateCoachingTips } from '../services/coachingTips.js';
import { transcribeBuffer } from '../services/whisper.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.post('/voice/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { transcript, wordTimings, audioStats } = req.body;
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const fillers = detectFillers(transcript || '');
    const wpm = computeWpm(wordTimings || []);
    const pauses = detectPauses(wordTimings || []);

    session.transcript = transcript || '';
    session.wordTimings = wordTimings || [];
    session.voiceMetrics = {
      wpm,
      avgPitchHz: audioStats?.avgPitchHz || 0,
      pitchVariance: audioStats?.pitchVariance || 0,
      avgVolumeDb: audioStats?.avgVolumeDb || 0,
      pauseCount: pauses.length,
      fillerCount: fillers.count,
      fillerWords: fillers.words,
      clarityScore: audioStats?.clarityScore || 0,
    };

    await session.save();
    res.json({ success: true, voiceMetrics: session.voiceMetrics, pauses });
  } catch (err) {
    next(err);
  }
});

// Server-side Whisper — for Firefox/Safari that lack Web Speech API.
// Accepts multipart audio blob, returns transcript + word timings.
router.post('/transcribe', requireAuth, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No audio uploaded' });
    const result = await transcribeBuffer(req.file.buffer, req.file.originalname || 'audio.webm');
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/gesture/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { keypointFrames, durationSec } = req.body;
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const metrics = scoreGestures(keypointFrames || [], durationSec || 1);
    session.gestureMetrics = metrics;
    await session.save();
    res.json({ success: true, gestureMetrics: metrics });
  } catch (err) {
    next(err);
  }
});

router.post('/feedback/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id })
      .populate('topicId')
      .populate('mentorClipId');
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const targetText =
      session.topicId?.text ||
      session.mentorClipId?.transcript ||
      '';

    const tips = await generateCoachingTips({
      targetText,
      transcript: session.transcript,
      voiceMetrics: session.voiceMetrics,
      gestureMetrics: session.gestureMetrics,
      mentorProfile: session.mentorClipId
        ? {
            avgWpm: session.mentorClipId.voiceProfile?.avgWpm,
            label: session.mentorClipId.label,
          }
        : null,
    });

    session.feedback = tips;
    await session.save();
    res.json({ success: true, feedback: tips, session });
  } catch (err) {
    next(err);
  }
});

function scoreGestures(frames, durationSec) {
  if (!frames.length) {
    return {
      gestureRate: 0,
      avgAmplitude: 0,
      openPalmRatio: 0,
      closedPostureSeconds: durationSec,
      handsInPocketsSeconds: 0,
      headTiltVariance: 0,
      score: 30,
    };
  }

  let motionEvents = 0;
  let totalAmplitude = 0;
  let openPalmFrames = 0;
  let closedFrames = 0;
  let prev = null;

  for (const frame of frames) {
    if (prev) {
      const dx =
        Math.abs((frame.leftWristX || 0) - (prev.leftWristX || 0)) +
        Math.abs((frame.rightWristX || 0) - (prev.rightWristX || 0));
      if (dx > 0.05) motionEvents += 1;
      totalAmplitude += dx;
    }
    if (frame.openPalm) openPalmFrames += 1;
    if (frame.armsCrossed) closedFrames += 1;
    prev = frame;
  }

  const minutes = Math.max(durationSec / 60, 0.01);
  return {
    gestureRate: Math.round(motionEvents / minutes),
    avgAmplitude: +(totalAmplitude / Math.max(frames.length, 1)).toFixed(3),
    openPalmRatio: +(openPalmFrames / frames.length).toFixed(3),
    closedPostureSeconds: +(closedFrames * (durationSec / frames.length)).toFixed(1),
    handsInPocketsSeconds: 0,
    headTiltVariance: 0,
    score: Math.min(100, 40 + motionEvents),
  };
}

export default router;
