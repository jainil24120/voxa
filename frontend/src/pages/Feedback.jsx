import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sessions } from '../api.js';

export default function Feedback() {
  const { sessionId } = useParams();
  const [s, setS] = useState(null);

  useEffect(() => {
    sessions.get(sessionId).then((r) => setS(r.session)).catch(() => {});
  }, [sessionId]);

  if (!s) return <div className="p-8 text-white/60">Loading feedback…</div>;

  const v = s.voiceMetrics || {};
  const g = s.gestureMetrics || {};
  const f = s.feedback || {};

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-accent">Practice report</div>
          <h1 className="font-display text-4xl mt-1">Your delivery</h1>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-white/50">Overall</div>
          <div className="font-display text-5xl text-coach">{f.overallScore ?? 0}<span className="text-white/40 text-2xl">/100</span></div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Metric label="Words/min" value={v.wpm ?? 0} />
        <Metric label="Filler words" value={v.fillerCount ?? 0} good={(v.fillerCount ?? 0) < 3} />
        <Metric label="Pauses" value={v.pauseCount ?? 0} />
        <Metric label="Gesture rate /min" value={g.gestureRate ?? 0} />
        <Metric label="Open posture" value={`${Math.round((g.openPalmRatio ?? 0) * 100)}%`} />
        <Metric label="Closed posture (s)" value={(g.closedPostureSeconds ?? 0).toFixed(1)} good={(g.closedPostureSeconds ?? 0) < 3} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <TipCard title="Voice" tips={f.voiceTips} accent="text-accent" />
        <TipCard title="Gestures" tips={f.gestureTips} accent="text-accent2" />
        <TipCard title="Vocabulary" tips={f.vocabularyTips} accent="text-coach" />
      </div>

      <div className="mt-10 flex gap-3">
        <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
          Try another topic
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value, good }) {
  return (
    <div className="glass p-5">
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-3xl mt-1 ${good === true ? 'text-coach' : good === false ? 'text-red-300' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function TipCard({ title, tips, accent }) {
  return (
    <div className="glass p-5">
      <div className={`text-xs uppercase tracking-wider ${accent}`}>{title}</div>
      <ul className="mt-3 space-y-2 text-white/80 text-sm">
        {(tips || []).map((t, i) => (
          <li key={i} className="flex gap-2"><span className="text-accent">•</span>{t}</li>
        ))}
      </ul>
    </div>
  );
}
