import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import MentorClip from '../models/MentorClip.js';
import { requireAuth } from '../middleware/auth.js';
import { processMentorClip } from '../services/mentorProcessor.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 100) * 1024 * 1024 },
});

const router = Router();

router.post('/upload', requireAuth, upload.single('clip'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'audio';

    const clip = await MentorClip.create({
      uploadedBy: req.user._id,
      sourceUrl: `/uploads/${req.file.filename}`,
      mediaType,
      label: req.body.label || req.file.originalname,
      processingStatus: 'uploaded',
    });

    // Fire-and-forget — frontend polls clip status while we transcribe + profile
    processMentorClip(clip._id).catch((err) =>
      console.error('[Voxa] mentor processor crashed:', err)
    );

    res.json({ success: true, clip });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const clips = await MentorClip.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-gestureProfile.keypointTimeline'); // skip heavy timeline in list view
    res.json({ success: true, clips });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const clip = await MentorClip.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!clip) return res.status(404).json({ success: false, error: 'Mentor clip not found' });
    res.json({ success: true, clip });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/save-gestures', requireAuth, async (req, res, next) => {
  try {
    const clip = await MentorClip.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!clip) return res.status(404).json({ success: false, error: 'Mentor clip not found' });

    const { gestureProfile } = req.body;
    if (gestureProfile) {
      clip.gestureProfile = { ...clip.gestureProfile?.toObject?.(), ...gestureProfile };
      await clip.save();
    }
    res.json({ success: true, clip });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const clip = await MentorClip.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!clip) return res.status(404).json({ success: false, error: 'Mentor clip not found' });

    const rel = clip.sourceUrl.replace(/^\/uploads\//, '');
    const abs = path.join(UPLOAD_DIR, rel);
    try { fs.unlinkSync(abs); } catch {}

    await clip.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
