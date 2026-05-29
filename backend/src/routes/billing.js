import { Router } from 'express';
import Razorpay from 'razorpay';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PLANS = {
  monthly: { amount: 19900, currency: 'INR', period: 'monthly', label: 'Voxa Pro Monthly (199/mo)' },
  yearly: { amount: 199900, currency: 'INR', period: 'yearly', label: 'Voxa Pro Yearly (1999/yr)' },
};

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.get('/plans', (_req, res) => {
  res.json({ success: true, plans: PLANS });
});

router.post('/order', requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan' });

    const client = getClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Razorpay not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)',
      });
    }

    const order = await client.orders.create({
      amount: PLANS[plan].amount,
      currency: PLANS[plan].currency,
      receipt: `voxa_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), plan },
    });
    res.json({ success: true, order, plan: PLANS[plan] });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    // TODO: Verify razorpay_signature, set user.subscription = active, set currentPeriodEnd
    res.json({ success: true, message: 'Verification stub — implement signature check before launch' });
  } catch (err) {
    next(err);
  }
});

export default router;
