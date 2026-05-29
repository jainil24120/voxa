import { useEffect, useRef, useState } from 'react';

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [stats, setStats] = useState({ avgVolumeDb: 0 });
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeSamplesRef = useRef([]);

  async function start() {
    setAudioBlob(null);
    volumeSamplesRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      if (!analyserRef.current) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const db = 20 * Math.log10(Math.max(rms, 0.0001));
      volumeSamplesRef.current.push(db);
      if (recording) requestAnimationFrame(loop);
    };

    const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      const avg = volumeSamplesRef.current.reduce((a, b) => a + b, 0) / Math.max(volumeSamplesRef.current.length, 1);
      setStats({ avgVolumeDb: Math.round(avg) });
    };
    rec.start();
    mediaRecRef.current = rec;
    setRecording(true);
    requestAnimationFrame(loop);
  }

  function stop() {
    try { mediaRecRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    analyserRef.current = null;
    setRecording(false);
  }

  useEffect(() => () => stop(), []);

  return { recording, audioBlob, stats, start, stop };
}
