import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export async function generateCoachingTips({ targetText, transcript, voiceMetrics, gestureMetrics }) {
  if (!groq) {
    return fallbackTips({ voiceMetrics, gestureMetrics });
  }

  const prompt = `
You are an English communication coach. Analyse the user's delivery and give 3 short, actionable tips.

Target text:
"${targetText}"

User transcript:
"${transcript}"

Voice metrics:
${JSON.stringify(voiceMetrics, null, 2)}

Gesture metrics:
${JSON.stringify(gestureMetrics, null, 2)}

Return JSON with this exact shape:
{
  "voiceTips": ["...", "...", "..."],
  "gestureTips": ["...", "...", "..."],
  "vocabularyTips": ["...", "...", "..."],
  "overallScore": 0-100
}

Tips must be specific (mention exact words or moments). Keep each tip under 20 words.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('[Voxa] Groq coaching failed:', err.message);
    return fallbackTips({ voiceMetrics, gestureMetrics });
  }
}

function fallbackTips({ voiceMetrics = {}, gestureMetrics = {} }) {
  const voiceTips = [];
  if (voiceMetrics.wpm && voiceMetrics.wpm < 110) voiceTips.push('Speed up a little — you sound under-energised.');
  if (voiceMetrics.wpm && voiceMetrics.wpm > 160) voiceTips.push('Slow down — give listeners time to follow.');
  if (voiceMetrics.fillerCount > 3) voiceTips.push(`Cut filler words (${voiceMetrics.fillerCount} detected).`);
  if (!voiceTips.length) voiceTips.push('Great pace and clarity. Add more pitch variation for impact.');

  const gestureTips = [];
  if (gestureMetrics.closedPostureSeconds > 5) gestureTips.push('Open your posture — uncross arms.');
  if (gestureMetrics.gestureRate < 5) gestureTips.push('Add hand gestures on key words.');
  if (!gestureTips.length) gestureTips.push('Gestures look natural. Try one big open-palm move on the main idea.');

  return {
    voiceTips,
    gestureTips,
    vocabularyTips: ['Use stronger verbs', 'Replace filler with a pause', 'Vary sentence length'],
    overallScore: 70,
  };
}
