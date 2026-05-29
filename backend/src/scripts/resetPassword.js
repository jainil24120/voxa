import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Reset any user's password (admin / dev-only).
 *
 *   node src/scripts/resetPassword.js <email> <newPassword>
 */
async function run() {
  const [, , email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('usage: node src/scripts/resetPassword.js <email> <newPassword>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voxa');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`[Voxa] no user found with email ${email}`);
    await mongoose.disconnect();
    process.exit(2);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  console.log(`[Voxa] password reset for ${user.email}`);
  console.log(`[Voxa] isAdmin: ${user.isAdmin()}  canStartSession: ${user.canStartSession()}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
