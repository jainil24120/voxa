import { useEffect, useRef, useState } from 'react';
import { waitlist } from '../api.js';
import { track, trackVisitOnce, getSessionKey, getSource } from '../lib/smoke.js';

const READ_PROMPT =
  "Good morning everyone. Today I want to tell you why I'm the right person for this role.";
const RECORD_SECONDS = 30;
const FILLERS = ['um', 'uh', 'er', 'like', 'you know', 'actually', 'basically', 'matlab', 'haan'];

export default function SmokeLanding() {
  const [phase, setPhase] = useState('idle'); // idle | recording | result
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS);
  const [level, setLevel] = useState(0); // live mic level 0..1
  const [liveWords, setLiveWords] = useState(0);
  const [report, setReport] = useState(null);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(0);
  const timerRef = useRef(null);
  const recogRef = useRef(null);
  const transcriptRef = useRef('');
  const volSamplesRef = useRef([]);
  const startTsRef = useRef(0);

  useEffect(() => {
    trackVisitOnce();
  }, []);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    try { recogRef.current?.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
  }

  async function startDemo() {
    setReport(null);
    transcriptRef.current = '';
    volSamplesRef.current = [];
    setLiveWords(0);
    track('demo_start');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        volSamplesRef.current.push(rms);
        setLevel(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      // Optional live transcript via Web Speech API (Chrome/Edge). Graceful if absent.
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.lang = 'en-IN';
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e) => {
          let finalT = '';
          for (let i = 0; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalT += e.results[i][0].transcript + ' ';
          }
          if (finalT) transcriptRef.current = finalT;
          const interim = Array.from(e.results).map((x) => x[0].transcript).join(' ');
          setLiveWords(interim.trim().split(/\s+/).filter(Boolean).length);
        };
        r.onerror = () => {};
        try { r.start(); } catch {}
        recogRef.current = r;
      }

      startTsRef.current = performance.now();
      setSecondsLeft(RECORD_SECONDS);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            finishDemo();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      alert('We need mic access for the live demo. You can still join the waitlist below.');
      setPhase('idle');
    }
  }

  function finishDemo() {
    const durationSec = Math.max((performance.now() - startTsRef.current) / 1000, 1);
    cleanup();

    const transcript = transcriptRef.current.trim();
    const words = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
    const wpm = words ? Math.round(words / (durationSec / 60)) : 0;

    const lower = ' ' + transcript.toLowerCase() + ' ';
    let fillerCount = 0;
    for (const f of FILLERS) {
      const re = new RegExp(`\\b${f.replace(/ /g, '\\s+')}\\b`, 'g');
      fillerCount += (lower.match(re) || []).length;
    }

    const vols = volSamplesRef.current;
    const avgVol = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
    const projection = Math.max(5, Math.min(100, Math.round(avgVol * 320)));

    const paceLabel =
      wpm === 0 ? 'add a transcript-capable browser for pace' :
      wpm < 110 ? 'a little slow — add energy' :
      wpm > 170 ? 'rushed — slow down on key lines' : 'good conversational pace';

    setReport({ durationSec: Math.round(durationSec), words, wpm, fillerCount, projection, paceLabel });
    track('demo_complete', { wpm, fillerCount, words, projection });
    setPhase('result');
  }

  return (
    <div className="smoke">
      <Hero phase={phase} secondsLeft={secondsLeft} level={level} liveWords={liveWords}
        report={report} onStart={startDemo} onStop={finishDemo} />
      <Problem />
      <Waitlist triedDemo={phase === 'result'} />
      <Footer />
    </div>
  );
}

function Hero({ phase, secondsLeft, level, liveWords, report, onStart, onStop }) {
  return (
    <section className="px-5 pt-16 pb-12 max-w-5xl mx-auto text-center">
      <p className="text-accent text-xs sm:text-sm tracking-[0.2em] uppercase mb-4">
        Built for India · Speak English with confidence
      </p>
      <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight">
        Crack the interview.<br />
        <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
          Sound like you mean it.
        </span>
      </h1>
      <p className="mt-5 text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
        An AI coach that listens to <em>how</em> you speak — your pace, pauses, pitch, the words you
        stress, even your body language — and shows you exactly what to fix, sentence by sentence.
        Plus fixes your Hinglish into clean, natural English.
      </p>

      <div className="mt-8 glass p-5 sm:p-7 max-w-xl mx-auto text-left">
        {phase === 'idle' && (
          <>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Try it now · 30 seconds</div>
            <p className="text-white/85 text-lg leading-relaxed">Read this out loud:</p>
            <p className="mt-2 text-xl sm:text-2xl font-display text-white">&ldquo;{READ_PROMPT}&rdquo;</p>
            <button onClick={onStart}
              className="mt-5 w-full py-3.5 rounded-xl bg-accent hover:bg-accent/90 font-semibold text-white text-lg">
              🎤 Record &amp; get my report
            </button>
            <p className="mt-2 text-center text-white/40 text-xs">Your audio never leaves your device in this demo.</p>
          </>
        )}

        {phase === 'recording' && (
          <div className="text-center">
            <div className="text-5xl font-display tabular-nums">{secondsLeft}s</div>
            <div className="mt-4 flex items-end justify-center gap-1 h-16">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="w-2 rounded-full bg-accent transition-all duration-75"
                  style={{ height: `${10 + Math.max(0, level * 64 - Math.abs(i - 4) * 6)}px` }} />
              ))}
            </div>
            <div className="mt-3 text-white/60 text-sm">Listening… {liveWords > 0 && `${liveWords} words`}</div>
            <button onClick={onStop}
              className="mt-4 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
              Stop &amp; see report
            </button>
          </div>
        )}

        {phase === 'result' && report && <TeaserReport report={report} />}
      </div>
    </section>
  );
}

function TeaserReport({ report }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-coach mb-3">Your snapshot</div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Voice projection" value={`${report.projection}`} suffix="/100" />
        <Stat label="Pace" value={report.wpm ? report.wpm : '—'} suffix={report.wpm ? ' wpm' : ''} />
        <Stat label="Filler words" value={report.fillerCount} good={report.fillerCount < 3} />
      </div>
      <p className="mt-2 text-white/55 text-sm">{report.paceLabel}.</p>

      <div className="mt-5 text-xs uppercase tracking-wider text-white/45 mb-2">
        Unlocked at launch — your full delivery report
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <LockedCard title="Pitch &amp; tonality" hint="where you sound flat or unsure" />
        <LockedCard title="Word emphasis" hint="the words you should stress" />
        <LockedCard title="Body language" hint="posture, gestures, eye contact" />
        <LockedCard title="Hinglish → English" hint="cleaner sentence formation" />
      </div>

      <a href="#waitlist"
        onClick={() => track('cta_click', { from: 'teaser' })}
        className="mt-5 block text-center w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent2 font-semibold text-white text-lg">
        Unlock my full report at launch →
      </a>
    </div>
  );
}

function Stat({ label, value, suffix = '', good }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
      <div className={`font-display text-2xl sm:text-3xl ${good === true ? 'text-coach' : good === false ? 'text-red-300' : 'text-white'}`}>
        {value}<span className="text-white/40 text-sm">{suffix}</span>
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wide text-white/45 mt-1">{label}</div>
    </div>
  );
}

function LockedCard({ title, hint }) {
  return (
    <div className="relative rounded-xl bg-white/5 border border-white/10 p-3 overflow-hidden">
      <div className="blur-[3px] select-none">
        <div className="font-display text-xl text-white" dangerouslySetInnerHTML={{ __html: title }} />
        <div className="text-xs text-white/50 mt-1">{hint}</div>
        <div className="mt-2 h-1.5 rounded bg-accent/40 w-3/4" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-2xl">🔒</div>
    </div>
  );
}

function Problem() {
  const items = [
    { t: 'You know English. You freeze when it matters.', b: 'Interviews, meetings, presentations — the words are there, but you sound nervous, flat, or rushed.' },
    { t: 'Nobody tells you what to actually fix.', b: 'Voxa points to the exact word to stress, where to pause, when to lift your pitch — sentence by sentence.' },
    { t: 'Learn by doing, like a game.', b: 'Short daily levels. Streaks. You can hear and see yourself getting better — not just memorising rules.' },
  ];
  return (
    <section className="px-5 py-12 max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.t} className="glass p-6">
          <h3 className="font-display text-xl mb-2">{it.t}</h3>
          <p className="text-white/65 leading-relaxed text-sm">{it.b}</p>
        </div>
      ))}
    </section>
  );
}

function Waitlist({ triedDemo }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pricePick, setPricePick] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setStatus('sending');
    try {
      await waitlist.join({
        email, phone, pricePick, goal, triedDemo,
        source: getSource(), sessionKey: getSessionKey(),
      });
      setStatus('done');
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Something went wrong. Try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <section id="waitlist" className="px-5 py-16 max-w-xl mx-auto text-center">
        <div className="glass p-8">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="font-display text-3xl">You&rsquo;re on the list.</h2>
          <p className="text-white/65 mt-2">
            We&rsquo;ll email you the moment Voxa opens. Want a friend to get in too? Share this page.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="px-5 py-16 max-w-xl mx-auto">
      <div className="glass p-7">
        <h2 className="font-display text-3xl text-center">Get early access</h2>
        <p className="text-white/60 text-center mt-2 text-sm">
          We&rsquo;re onboarding the first users now. Join free — no spam.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent outline-none" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number (optional)" autoComplete="tel"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent outline-none" />

          <div>
            <div className="text-xs uppercase tracking-wider text-white/45 mb-2">If it helped you, what would you pay?</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['free_only', 'Only if free'],
                ['rs149', '₹149 / mo'],
                ['rs299', '₹299 / mo'],
                ['rs399', '₹399 / mo'],
              ].map(([val, label]) => (
                <button type="button" key={val} onClick={() => setPricePick(val)}
                  className={`py-2.5 rounded-xl border text-sm transition ${
                    pricePick === val ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <input value={goal} onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to get better at? (optional)"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent outline-none text-sm" />

          {err && <p className="text-red-300 text-sm">{err}</p>}

          <button type="submit" disabled={status === 'sending'}
            onClick={() => track('cta_click', { from: 'form' })}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent2 font-semibold text-white text-lg disabled:opacity-50">
            {status === 'sending' ? 'Joining…' : 'Join the waitlist'}
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-5 py-10 text-center text-white/35 text-sm">
      Voxa · AI English communication coach · Made in India 🇮🇳
    </footer>
  );
}
