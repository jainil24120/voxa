import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRouter from './routes/auth.js';
import topicsRouter from './routes/topics.js';
import sessionsRouter from './routes/sessions.js';
import analyzeRouter from './routes/analyze.js';
import ttsRouter from './routes/tts.js';
import mentorRouter from './routes/mentor.js';
import billingRouter from './routes/billing.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

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
    });
  })
  .catch((err) => {
    console.error('[Voxa] Mongo connection failed:', err.message);
    process.exit(1);
  });
