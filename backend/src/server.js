import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';

import authRouter from './routes/auth.js';
import topicsRouter from './routes/topics.js';
import sessionsRouter from './routes/sessions.js';
import analyzeRouter from './routes/analyze.js';
import ttsRouter from './routes/tts.js';
import mentorRouter from './routes/mentor.js';
import billingRouter from './routes/billing.js';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20mb' }));

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR), { fallthrough: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'voxa-backend', ts: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/billing', billingRouter);

app.use((err, _req, res, _next) => {
  console.error('[Voxa] error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voxa';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[Voxa] Mongo connected');
    app.listen(PORT, () => {
      console.log(`[Voxa] backend listening on http://localhost:${PORT}`);
      console.log(`[Voxa] uploads served from ${path.resolve(UPLOAD_DIR)}`);
    });
  })
  .catch((err) => {
    console.error('[Voxa] Mongo connection failed:', err.message);
    process.exit(1);
  });
