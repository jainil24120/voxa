import { useEffect, useState } from 'react';
import { mentor } from '../api.js';

export default function MentorUpload() {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [clips, setClips] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { refresh(); }, []);
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
    try {
      await mentor.upload(file, label);
      setFile(null); setLabel('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl mb-2">Upload a mentor</h1>
      <p className="text-white/60 mb-8">
        Drop a video or audio of a speaker you admire. Voxa will extract their voice style and hand-gesture style,
        then coach you to deliver like them.
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
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">File (audio or video)</label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white"
          />
        </div>
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <button
          disabled={!file || uploading}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 font-semibold disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <h2 className="font-display text-2xl mt-10 mb-3">Your mentors</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {clips.map((c) => (
          <div key={c._id} className="glass p-4">
            <div className="text-xs uppercase tracking-wider text-white/50">{c.mediaType} · {c.processingStatus}</div>
            <div className="font-display text-lg mt-1">{c.label}</div>
          </div>
        ))}
        {!clips.length && <div className="text-white/50">No mentor clips yet.</div>}
      </div>
    </div>
  );
}
