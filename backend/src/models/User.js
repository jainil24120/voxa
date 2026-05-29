import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    freeSessionsUsed: { type: Number, default: 0 },
    freeSessionLimit: { type: Number, default: 1 },

    subscription: {
      status: { type: String, enum: ['none', 'active', 'expired', 'cancelled'], default: 'none' },
      plan: { type: String, enum: [null, 'monthly', 'yearly'], default: null },
      razorpaySubscriptionId: { type: String, default: null },
      currentPeriodEnd: { type: Date, default: null },
    },

    preferredCoachVoice: { type: String, default: 'en-US-AriaNeural' },
  },
  { timestamps: true }
);

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

userSchema.methods.isAdmin = function () {
  return adminEmails().includes((this.email || '').toLowerCase());
};

userSchema.methods.canStartSession = function () {
  if (this.isAdmin()) return true;
  if (this.subscription.status === 'active') return true;
  return this.freeSessionsUsed < this.freeSessionLimit;
};

export default mongoose.model('User', userSchema);
