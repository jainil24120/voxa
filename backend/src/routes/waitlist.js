import { Router } from 'express';
import Waitlist from '../models/Waitlist.js';
import SmokeEvent from '../models/SmokeEvent.js';

const router = Router();

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Record a funnel event (visit / demo_start / demo_complete / cta_click / signup).
router.post('/event', async (req, res, next) => {
  try {
    const { type, sessionKey, source, meta } = req.body || {};
    const allowed = ['visit', 'demo_start', 'demo_complete', 'cta_click', 'signup'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid event type' });
    }
    await SmokeEvent.create({
      type,
      sessionKey: (sessionKey || '').slice(0, 64),
      source: (source || 'direct').slice(0, 80),
      meta: meta && typeof meta === 'object' ? meta : {},
      userAgent: (req.headers['user-agent'] || '').slice(0, 300),
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Join the waitlist. At least one contact method required.
router.post('/', async (req, res, next) => {
  try {
    const { email, phone, pricePick, goal, triedDemo, source, sessionKey } = req.body || {};
    if (!isEmail(email) && !(phone && String(phone).replace(/\D/g, '').length >= 8)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email or phone number.' });
    }

    const doc = {
      email: isEmail(email) ? email : undefined,
      phone: phone ? String(phone).trim() : undefined,
      pricePick: ['free_only', 'rs149', 'rs299', 'rs399'].includes(pricePick) ? pricePick : '',
      goal: (goal || '').slice(0, 280),
      triedDemo: !!triedDemo,
      source: (source || 'direct').slice(0, 80),
      userAgent: (req.headers['user-agent'] || '').slice(0, 300),
    };

    // Upsert on email so a repeat signup updates rather than 11000-errors.
    let entry;
    if (doc.email) {
      entry = await Waitlist.findOneAndUpdate(
        { email: doc.email },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      entry = await Waitlist.create(doc);
    }

    await SmokeEvent.create({
      type: 'signup',
      sessionKey: (sessionKey || '').slice(0, 64),
      source: doc.source,
      meta: { pricePick: doc.pricePick, triedDemo: doc.triedDemo },
      userAgent: doc.userAgent,
    });

    res.json({ success: true, id: entry._id });
  } catch (err) {
    if (err?.code === 11000) {
      return res.json({ success: true, duplicate: true });
    }
    next(err);
  }
});

// Admin metrics for the smoke test. Protected by a simple shared key so it
// isn't public. Pass ?key=... matching SMOKE_ADMIN_KEY.
router.get('/stats', async (req, res, next) => {
  try {
    const key = process.env.SMOKE_ADMIN_KEY;
    if (!key || req.query.key !== key) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [visitsAll, visitorsUnique, demoStarts, demoCompletes, ctaClicks, signupsEvents, waitlistCount] =
      await Promise.all([
        SmokeEvent.countDocuments({ type: 'visit' }),
        SmokeEvent.distinct('sessionKey', { type: 'visit', sessionKey: { $ne: '' } }).then((a) => a.length),
        SmokeEvent.countDocuments({ type: 'demo_start' }),
        SmokeEvent.countDocuments({ type: 'demo_complete' }),
        SmokeEvent.countDocuments({ type: 'cta_click' }),
        SmokeEvent.countDocuments({ type: 'signup' }),
        Waitlist.countDocuments({}),
      ]);

    const priceBreakdown = await Waitlist.aggregate([
      { $group: { _id: '$pricePick', count: { $sum: 1 } } },
    ]);

    const denom = visitorsUnique || visitsAll || 0;
    const pct = (n) => (denom ? +((n / denom) * 100).toFixed(1) : 0);

    res.json({
      success: true,
      funnel: {
        visits: visitsAll,
        uniqueVisitors: visitorsUnique,
        demoStarts,
        demoCompletes,
        ctaClicks,
        signups: signupsEvents,
        waitlistTotal: waitlistCount,
      },
      conversion: {
        // THE GATE: signup-per-unique-visitor. Target >= 10-15%.
        signupRatePct: pct(waitlistCount),
        demoStartRatePct: pct(demoStarts),
        demoCompleteRatePct: pct(demoCompletes),
      },
      priceBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
