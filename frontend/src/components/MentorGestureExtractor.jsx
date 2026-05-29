import { useState } from 'react';
import { useVideoPoseExtractor } from '../hooks/useVideoPoseExtractor.js';
import { mentor as mentorApi } from '../api.js';

/**
 * Background gesture extractor for a mentor clip.
 * Mounts only when:
 *   - clip is processingStatus === 'ready'
 *   - clip is a video
 *   - gestureProfile.keypointTimeline is empty
 *
 * Plays the mentor video silently in the background, runs MediaPipe Pose on
 * each frame, and PUTs the summary to the backend when done.
 */
export default function MentorGestureExtractor({ clip, onDone }) {
  const [started, setStarted] = useState(false);

  const needs =
    clip.processingStatus === 'ready' &&
    clip.mediaType === 'video' &&
    (!clip.gestureProfile?.keypointTimeline ||
      clip.gestureProfile.keypointTimeline.length === 0);

  const ext = useVideoPoseExtractor({
    videoUrl: needs && started ? clip.sourceUrl : null,
    enabled: needs && started,
    onComplete: async (profile) => {
      try {
        await mentorApi.saveGestures(clip._id, profile);
        onDone?.();
      } catch (err) {
        console.error('[Voxa] saveGestures failed', err);
      }
    },
  });

  if (!needs) return null;

  if (!started) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="mt-2 text-xs px-2 py-1 rounded bg-accent/20 hover:bg-accent/40 text-accent"
      >
        Extract gesture style
      </button>
    );
  }

  return (
    <div className="mt-2 text-xs text-white/60">
      Extracting gestures… {ext.progress}% ({ext.status})
      {ext.error && <span className="text-red-300"> · {ext.error}</span>}
    </div>
  );
}
