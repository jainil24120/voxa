import mongoose from 'mongoose';

// Lightweight funnel events for the smoke test. Lets us compute the real
// conversion gate: visits -> demo_start -> demo_complete -> cta_click -> signup.
const smokeEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['visit', 'demo_start', 'demo_complete', 'cta_click', 'signup'],
    },
    sessionKey: { type: String, default: '' }, // anonymous per-browser id to dedupe visitors
    source: { type: String, default: 'direct' },
    meta: { type: Object, default: {} }, // e.g. { wpm, fillerCount } from the demo
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

smokeEventSchema.index({ type: 1, createdAt: -1 });
smokeEventSchema.index({ sessionKey: 1 });

export default mongoose.model('SmokeEvent', smokeEventSchema);
