const FILLER_PATTERNS = [
  'um', 'uh', 'er', 'ah', 'hmm', 'mhm',
  'like', 'you know', 'i mean', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'right',
  'so', 'well', 'okay',
];

export function detectFillers(transcript) {
  if (!transcript) return { count: 0, words: [] };
  const lower = transcript.toLowerCase();
  const found = [];

  for (const filler of FILLER_PATTERNS) {
    const re = new RegExp(`\\b${filler.replace(/ /g, '\\s+')}\\b`, 'g');
    const matches = lower.match(re);
    if (matches) {
      found.push(...matches.map((m) => m.trim()));
    }
  }
  return { count: found.length, words: found };
}

export function computeWpm(wordTimings) {
  if (!wordTimings?.length) return 0;
  const first = wordTimings[0].start;
  const last = wordTimings[wordTimings.length - 1].end;
  const seconds = Math.max(last - first, 0.001);
  const minutes = seconds / 60;
  return Math.round(wordTimings.length / minutes);
}

export function detectPauses(wordTimings, thresholdSec = 0.6) {
  if (!wordTimings?.length) return [];
  const pauses = [];
  for (let i = 1; i < wordTimings.length; i++) {
    const gap = wordTimings[i].start - wordTimings[i - 1].end;
    if (gap >= thresholdSec) {
      pauses.push({
        afterWord: wordTimings[i - 1].word,
        beforeWord: wordTimings[i].word,
        durationSec: gap,
      });
    }
  }
  return pauses;
}
