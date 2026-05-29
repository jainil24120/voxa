import { useEffect, useRef, useState } from 'react';

export function usePoseTracker(videoRef, canvasRef, { enabled }) {
  const [frames, setFrames] = useState([]);
  const framesRef = useRef([]);
  const startedRef = useRef(false);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (startedRef.current) return;
    let cancelled = false;

    (async () => {
      const [{ Pose, POSE_CONNECTIONS }, drawingUtils, { Camera }] = await Promise.all([
        import('@mediapipe/pose'),
        import('@mediapipe/drawing_utils'),
        import('@mediapipe/camera_utils'),
      ]);
      if (cancelled) return;

      const pose = new Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = results.image.width;
        canvas.height = results.image.height;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawingUtils.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: 'rgba(124,92,255,0.8)', lineWidth: 3,
          });
          drawingUtils.drawLandmarks(ctx, results.poseLandmarks, {
            color: '#ff7ab6', lineWidth: 1, radius: 3,
          });

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

          const frame = {
            ts: performance.now(),
            leftWristX: leftWrist?.x ?? 0,
            leftWristY: leftWrist?.y ?? 0,
            rightWristX: rightWrist?.x ?? 0,
            rightWristY: rightWrist?.y ?? 0,
            noseX: nose?.x ?? 0,
            noseY: nose?.y ?? 0,
            armsCrossed: !!armsCrossed,
            openPalm: !!handsAboveShoulders,
          };
          framesRef.current.push(frame);
          if (framesRef.current.length % 10 === 0) {
            setFrames([...framesRef.current]);
          }
        }
        ctx.restore();
      });

      poseRef.current = pose;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current) await poseRef.current.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });
        camera.start();
        cameraRef.current = camera;
        startedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
      try { cameraRef.current?.stop(); } catch {}
      try { poseRef.current?.close(); } catch {}
      startedRef.current = false;
    };
  }, [enabled, videoRef, canvasRef]);

  function reset() {
    framesRef.current = [];
    setFrames([]);
  }

  return { frames, reset };
}
