import { Router } from 'express';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/start', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.canStartSession()) {
      return res.status(402).json({
        success: false,
        error: 'Free trial exhausted',
        upgradeRequired: true,
      });
    }
    const { topicId, mentorClipId } = req.body;
    const session = await Session.create({
      userId: req.user._id,
      topicId: topicId || null,
      mentorClipId: mentorClipId || null,
    });

    if (req.user.subscription.status !== 'active') {
      req.user.freeSessionsUsed += 1;
      await req.user.save();
    }

    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const s = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!s) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session: s });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

export default router;
