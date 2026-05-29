import { useEffect, useRef, useState } from 'react';

/**
 * Runs MediaPipe Pose over a hidden <video> playing a mentor clip.
 * Accumulates a keypoint timeline + summary stats, calls onComplete when done.
 */
export function useVideoPoseExtractor({ videoUrl, enabled, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle|loading|extracting|done|error
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const poseRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled || !videoUrl) return;
    let cancelled = false;
    framesRef.current = [];
    setProgress(0);
    setStatus('loading');

    (async () => {
      try {
        const [{ Pose }] = await Promise.all([import('@mediapipe/pose')]);
        if (cancelled) return;

        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        videoRef.current = video;

        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 0, // fast — we're processing offline frames
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (!results.poseLandmarks) return;
          const lm = results.poseLandmarks;
          const leftWrist = lm[15], rightWrist = lm[16];
          const leftShoulder = lm[11], rightShoulder = lm[12];
          const leftElbow = lm[13], rightElbow = lm[14];
          const nose = lm[0];

          const armsCrossed =
            leftWrist && rightWrist && leftShoulder && rightShoulder &&
            ((leftWrist.x > rightShoulder.x && rightWrist.x < leftShoulder.x) ||
              (leftWrist.x > rightShoulder.x && leftWrist.y > leftElbow.y && rightWrist.y > rightElbow.y));

          const handsAboveShoulders =
            (leftWrist && leftShoulder && leftWrist.y < leftShoulder.y) ||
            (rightWrist && rightShoulder && rightWrist.y < rightShoulder.y);

          framesRef.current.push({
            ts: video.currentTime,
            leftWristX: leftWrist?.x ?? 0,
            leftWristY: leftWrist?.y ?? 0,
            rightWristX: rightWrist?.x ?? 0,
            rightWristY: rightWrist?.y ?? 0,
            noseX: nose?.x ?? 0,
            noseY: nose?.y ?? 0,
            armsCrossed: !!armsCrossed,
            openPalm: !!handsAboveShoulders,
          });
        });
        poseRef.current = pose;

        await new Promise((resolve, reject) => {
          video.addEventListener('loadedmetadata', resolve, { once: true });
          video.addEventListener('error', () => reject(new Error('Video load failed')), { once: true });
        });
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const total = video.duration || 1;
        setStatus('extracting');
        await video.play();

        const tick = async () => {
          if (cancelled || video.ended || video.paused) return finish();
          const t = video.currentTime;
          setProgress(Math.min(100, Math.round((t / total) * 100)));
          try { await pose.send({ image: video }); } catch {}
          // Sample at ~10fps regardless of native rate
          rafRef.current = window.setTimeout(tick, 100);
        };
        tick();

        async function finish() {
          if (status === 'done') return;
          window.clearTimeout(rafRef.current);
          try { video.pause(); } catch {}
          const frames = framesRef.current;
          const profile = summarise(frames, total);
          setStatus('done');
          setProgress(100);
          onComplete?.(profile, frames);
        }

        video.addEventListener('ended', finish, { once: true });
      } catch (err) {
        if (cancelled) return;
        console.error('[Voxa] mentor pose extraction failed:', err);
        setError(err.message);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(rafRef.current);
      try { poseRef.current?.close(); } catch {}
      try { videoRef.current?.pause(); } catch {}
    };
  }, [enabled, videoUrl]);

  return { status, progress, error, framesCount: framesRef.current.length };
}

function summarise(frames, durationSec) {
  if (!frames.length) {
    return {
      avgGestureRate: 0,
      avgAmplitude: 0,
      openPalmRatio: 0,
      signaturePosture: 'still',
      keypointTimeline: [],
    };
  }
  let motionEvents = 0;
  let totalAmplitude = 0;
  let openPalmFrames = 0;
  let closedFrames = 0;
  let prev = null;
  for (const f of frames) {
    if (prev) {
      const dx = Math.abs(f.leftWristX - prev.leftWristX) + Math.abs(f.rightWristX - prev.rightWristX);
      if (dx > 0.05) motionEvents += 1;
      totalAmplitude += dx;
    }
    if (f.openPalm) openPalmFrames += 1;
    if (f.armsCrossed) closedFrames += 1;
    prev = f;
  }
  const minutes = Math.max(durationSec / 60, 0.01);
  const openRatio = openPalmFrames / frames.length;
  let signature = 'balanced';
  if (openRatio > 0.4) signature = 'open-expansive';
  else if (closedFrames / frames.length > 0.3) signature = 'closed-reserved';
  else if (motionEvents / minutes > 30) signature = 'energetic';

  // Down-sample timeline to keep document size sane (max ~600 frames)
  const stride = Math.max(1, Math.floor(frames.length / 600));
  const timeline = frames
    .filter((_, i) => i % stride === 0)
    .map((f) => ({ ts: f.ts, keypoints: { lWx: f.leftWristX, lWy: f.leftWristY, rWx: f.rightWristX, rWy: f.rightWristY } }));

  return {
    avgGestureRate: Math.round(motionEvents / minutes),
    avgAmplitude: +(totalAmplitude / frames.length).toFixed(3),
    openPalmRatio: +openRatio.toFixed(3),
    signaturePosture: signature,
    keypointTimeline: timeline,
  };
}
