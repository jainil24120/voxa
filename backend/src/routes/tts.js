import { Router } from 'express';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/synthesize', requireAuth, async (req, res, next) => {
  try {
    const { text, voice } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'text required' });

    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice || req.user.preferredCoachVoice || 'en-US-AriaNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const { audioStream } = tts.toStream(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    audioStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

router.get('/voices', (_req, res) => {
  res.json({
    success: true,
    voices: [
      { id: 'en-US-AriaNeural', name: 'Aria (US Female)', accent: 'American' },
      { id: 'en-US-GuyNeural', name: 'Guy (US Male)', accent: 'American' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', accent: 'British' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', accent: 'British' },
      { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian Female)', accent: 'Indian' },
      { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Indian Male)', accent: 'Indian' },
      { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)', accent: 'Australian' },
    ],
  });
});

export default router;
