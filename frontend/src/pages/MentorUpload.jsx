import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentor } from '../api.js';
import MentorGestureExtractor from '../components/MentorGestureExtractor.jsx';

export default function MentorUpload() {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [clips, setClips] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    try {
      const r = await mentor.list();
      setClips(r.clips);
    } catch (e) { setError(e.message); }
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      await mentor.upload(file, label, setProgress);
      setFile(null); setLabel(''); setProgress(0);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this mentor clip?')) return;
    try {
      await mentor.remove(id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl mb-2">Upload a mentor</h1>
      <p className="text-white/60 mb-8">
        Drop a video or audio of a speaker you admire. Voxa transcribes them with Whisper, profiles their voice
        (pace, pauses), and — for videos — extracts their hand-gesture and posture style.
        Then you can karaoke-practice in their style.
      </p>

      <form onSubmit={submit} className="glass p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Label (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Steve Jobs Stanford 2005"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">File (audio or video, max 100MB)</label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white"
          />
        </div>
        {progress > 0 && progress < 100 && (
          <div className="text-xs text-white/60">Uploading… {progress}%</div>
        )}
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <button
          disabled={!file || uploading}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 font-semibold disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload + analyse'}
        </button>
      </form>

      <h2 className="font-display text-2xl mt-10 mb-3">Your mentors</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {clips.map((c) => (
          <MentorCard key={c._id} clip={c} onRemove={() => remove(c._id)} onChange={refresh} />
        ))}
        {!clips.length && <div className="text-white/50">No mentor clips yet. Upload one above.</div>}
      </div>
    </div>
  );
}

function MentorCard({ clip, onRemove, onChange }) {
  const status = clip.processingStatus;
  const wpm = clip.voiceProfile?.avgWpm;
  const hasGestures = (clip.gestureProfile?.avgGestureRate ?? 0) > 0 || clip.mediaType === 'audio';
  const ready = status === 'ready';

  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            {clip.mediaType} · <span className={ready ? 'text-coach' : status === 'failed' ? 'text-red-300' : 'text-accent'}>{status}</span>
          </div>
          <div className="font-display text-lg mt-1">{clip.label}</div>
          {wpm > 0 && <div className="text-sm text-white/60 mt-1">Avg pace: {wpm} WPM</div>}
          {clip.gestureProfile?.signaturePosture && hasGestures && (
            <div className="text-sm text-white/60">Posture: {clip.gestureProfile.signaturePosture} · Gesture rate {clip.gestureProfile.avgGestureRate}/min</div>
          )}
          {clip.transcript && (
            <div className="text-xs text-white/40 mt-2 line-clamp-2">"{clip.transcript.slice(0, 140)}…"</div>
          )}
          {status === 'failed' && (
            <div className="text-xs text-red-300 mt-1">{clip.processingError}</div>
          )}
          {ready && <MentorGestureExtractor clip={clip} onDone={onChange} />}
        </div>
        <button onClick={onRemove} className="text-xs text-white/40 hover:text-red-300">delete</button>
      </div>

      {ready && (
        <div className="mt-3 flex gap-2">
          <Link
            to={`/practice/mentor/${clip._id}`}
            className="text-sm px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white"
          >
            Practice in their style
          </Link>
        </div>
      )}
    </div>
  );
}
