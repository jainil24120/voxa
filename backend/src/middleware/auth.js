import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Auth failed' });
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
