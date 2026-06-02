import mongoose from 'mongoose';

// Smoke-test waitlist signup. The point of this collection is to measure DEMAND:
// how many visitors who land actually ask for the product, and which price they'd pick.
const waitlistSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    // Pricing smoke test (gate 4): which plan they'd choose.
    pricePick: { type: String, enum: ['free_only', 'rs149', 'rs299', 'rs399', ''], default: '' },
    // What they most want help with — qualitative demand signal.
    goal: { type: String, trim: true, default: '' },
    triedDemo: { type: Boolean, default: false },
    source: { type: String, default: 'direct' }, // utm_source / referrer
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

waitlistSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model('Waitlist', waitlistSchema);
