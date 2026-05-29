import { useEffect, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const recRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wordTimings, setWordTimings] = useState([]);
  const [listening, setListening] = useState(false);
  const startTsRef = useRef(0);
  const lastFinalIndexRef = useRef(0);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalChunk = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalChunk += text + ' ';
        else interim += text;
      }
      const stamp = (performance.now() - startTsRef.current) / 1000;

      if (finalChunk) {
        const newWords = finalChunk.trim().split(/\s+/).filter(Boolean);
        const timings = newWords.map((w, i) => ({
          word: w.toLowerCase().replace(/[^a-z']/g, ''),
          start: Math.max(0, stamp - (newWords.length - i) * 0.25),
          end: Math.max(0, stamp - (newWords.length - 1 - i) * 0.25),
        }));
        setWordTimings((prev) => [...prev, ...timings]);
        setTranscript((prev) => (prev + ' ' + finalChunk).trim());
        lastFinalIndexRef.current += newWords.length;
      }
      setTranscript((prev) => (prev + ' ' + interim).trim());
    };

    rec.onend = () => {
      if (recRef.current?.shouldRestart) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
      }
    };

    rec.onerror = (e) => console.warn('[Voxa] SpeechRecognition error', e.error);
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, []);

  function start() {
    if (!recRef.current) return;
    setTranscript('');
    setWordTimings([]);
    startTsRef.current = performance.now();
    recRef.current.shouldRestart = true;
    try { recRef.current.start(); setListening(true); } catch {}
  }

  function stop() {
    if (!recRef.current) return;
    recRef.current.shouldRestart = false;
    try { recRef.current.stop(); } catch {}
    setListening(false);
  }

  return { supported, transcript, wordTimings, listening, start, stop };
}
