import fs from 'node:fs';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Transcribe an audio file via Groq's free Whisper API.
 * Returns { transcript, wordTimings: [{word, start, end}], language, duration }.
 */
export async function transcribeFile(filePath, { language = 'en' } = {}) {
  if (!groq) throw new Error('GROQ_API_KEY not configured');
  if (!fs.existsSync(filePath)) throw new Error(`Audio file not found: ${filePath}`);

  const res = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
    language,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  const words = (res.words || []).map((w) => ({
    word: (w.word || '').trim().toLowerCase().replace(/[^a-z']/g, ''),
    start: w.start,
    end: w.end,
  })).filter((w) => w.word);

  return {
    transcript: res.text || '',
    wordTimings: words,
    language: res.language || language,
    duration: res.duration || 0,
  };
}

/**
 * Transcribe a Buffer (e.g. an uploaded webm blob from the browser).
 * Writes to a temp file because the Groq SDK wants a stream.
 */
export async function transcribeBuffer(buffer, filename = 'audio.webm', opts = {}) {
  const tmpPath = `./uploads/_tmp_${Date.now()}_${filename}`;
  fs.writeFileSync(tmpPath, buffer);
  try {
    return await transcribeFile(tmpPath, opts);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}
