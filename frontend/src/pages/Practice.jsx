import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { topics, sessions, analyze, tts } from '../api.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { usePoseTracker } from '../hooks/usePoseTracker.js';

export default function Practice() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [session, setSession] = useState(null);
  const [coachAudioUrl, setCoachAudioUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const startTsRef = useRef(0);

  const speech = useSpeechRecognition();
  const audio = useAudioRecorder();
  const pose = usePoseTracker(videoRef, canvasRef, { enabled: !!session });

  useEffect(() => {
    topics.get(topicId).then((r) => setTopic(r.topic)).catch((e) => setError(e.message));
  }, [topicId]);

  const targetWords = useMemo(() => {
    if (!topic?.text) return [];
    return topic.text.split(/\s+/).map((w, i) => ({
      raw: w,
      key: i,
      norm: w.toLowerCase().replace(/[^a-z']/g, ''),
      isStress: topic.targetStyle?.stressWords?.some((s) => w.toLowerCase().includes(s.toLowerCase())),
    }));
  }, [topic]);

  const matchIndex = useMemo(() => {
    if (!speech.wordTimings.length) return -1;
    const said = speech.wordTimings.map((w) => w.word);
    let cursor = 0;
    for (const w of said) {
      while (cursor < targetWords.length && targetWords[cursor].norm !== w) cursor++;
      if (cursor < targetWords.length) cursor++;
    }
    return cursor - 1;
  }, [speech.wordTimings, targetWords]);

  async function startPractice() {
    setError('');
    try {
      const res = await sessions.start({ topicId });
      setSession(res.session);
      startTsRef.current = performance.now();
      await audio.start();
      speech.start();
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        navigate('/pricing');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    }
  }

  async function playCoachVoice() {
    if (!topic) return;
    const url = await tts.synthesize(topic.text);
    setCoachAudioUrl(url);
  }

  async function finishPractice() {
    speech.stop();
    audio.stop();
    setSubmitting(true);
    try {
      const durationSec = (performance.now() - startTsRef.current) / 1000;

      await analyze.voice(session._id, {
        transcript: speech.transcript,
        wordTimings: speech.wordTimings,
        audioStats: { avgVolumeDb: audio.stats.avgVolumeDb, avgPitchHz: 0, pitchVariance: 0, clarityScore: 0 },
      });

      await analyze.gesture(session._id, {
        keypointFrames: pose.frames,
        durationSec,
      });

      await analyze.feedback(session._id);
      navigate(`/feedback/${session._id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="p-8 text-red-300">{error}</div>;
  if (!topic) return <div className="p-8 text-white/60">Loading…</div>;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-accent">{topic.category} · {topic.level}</div>
          <h1 className="font-display text-3xl mt-1">{topic.title}</h1>
          <div className="text-white/50 text-sm mt-1">
            Target pace: {topic.targetStyle?.wpmMin}-{topic.targetStyle?.wpmMax} WPM · Tone: {topic.targetStyle?.tone}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={playCoachVoice} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
            ▶ Hear ideal version
          </button>
          {!session ? (
            <button onClick={startPractice} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 font-semibold">
              Start practice
            </button>
          ) : (
            <button
              onClick={finishPractice}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-coach hover:bg-coach/90 font-semibold text-ink disabled:opacity-50"
            >
              {submitting ? 'Analysing…' : 'Finish & see feedback'}
            </button>
          )}
        </div>
      </div>

      {coachAudioUrl && (
        <audio src={coachAudioUrl} controls autoPlay className="w-full mb-4" />
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass p-6 leading-loose text-lg">
          {targetWords.map((w, i) => {
            let state = '';
            if (i < matchIndex) state = 'said';
            else if (i === matchIndex + 1) state = 'active';
            else if (matchIndex >= 0 && i <= matchIndex - 1 && !speech.wordTimings.find((t) => t.word === w.norm))
              state = 'missed';
            return (
              <span key={w.key} className={`karaoke-word ${state} ${w.isStress ? 'stress' : ''}`}>
                {w.raw}
              </span>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="glass p-3">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Your camera</div>
            <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden">
              <video ref={videoRef} className="hidden" muted playsInline />
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              {!session && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                  Camera + pose tracking starts when you press Start
                </div>
              )}
            </div>
          </div>

          <div className="glass p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Live stats</div>
            <ul className="space-y-1.5 text-white/80">
              <li>Mic: {audio.recording ? '● recording' : 'idle'}</li>
              <li>Speech: {speech.listening ? '● listening' : 'idle'}{!speech.supported && ' (use Chrome/Edge)'}</li>
              <li>Words said: {speech.wordTimings.length}</li>
              <li>Pose frames: {pose.frames.length}</li>
              <li>Avg volume: {audio.stats.avgVolumeDb} dB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
