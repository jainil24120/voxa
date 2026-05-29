import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { topics, auth, mentor } from '../api.js';

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    topics.list().then((r) => setList(r.topics)).catch(() => {});
    auth.me().then((r) => setUser(r.user)).catch(() => {});
    mentor.list().then((r) => setMentors(r.clips)).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? list : list.filter((t) => t.category === filter);
  const categories = ['all', 'interview', 'storytelling', 'presentation', 'daily', 'public-speaking'];
  const readyMentors = mentors.filter((m) => m.processingStatus === 'ready');

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl">Pick a topic</h1>
          <p className="text-white/60 mt-2">
            {user?.subscription?.status === 'active'
              ? 'Unlimited practice — go.'
              : `Free sessions left: ${Math.max(0, (user?.freeSessionLimit || 1) - (user?.freeSessionsUsed || 0))}`}
          </p>
        </div>
        <Link to="/mentor" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
          + Upload mentor clip
        </Link>
      </div>

      {readyMentors.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-2xl mb-3">Your mentors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyMentors.map((m) => (
              <Link
                key={m._id}
                to={`/practice/mentor/${m._id}`}
                className="glass p-5 hover:border-accent/40 block"
              >
                <div className="text-xs uppercase tracking-wider text-accent2">mentor · {m.mediaType}</div>
                <div className="font-display text-xl mt-1">{m.label}</div>
                <div className="text-white/60 text-sm mt-1">
                  {m.voiceProfile?.avgWpm ? `${m.voiceProfile.avgWpm} WPM` : ''}
                  {m.gestureProfile?.signaturePosture && ` · ${m.gestureProfile.signaturePosture}`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl mb-3">Topic library</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === c ? 'bg-accent border-accent text-white' : 'border-white/10 text-white/70 hover:bg-white/5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Link
            key={t._id}
            to={`/practice/topic/${t._id}`}
            className="glass p-5 hover:border-accent/40 transition block"
          >
            <div className="text-xs uppercase tracking-wider text-accent mb-1">
              {t.category} · {t.level}
            </div>
            <div className="font-display text-xl mb-2">{t.title}</div>
            <div className="text-white/60 text-sm line-clamp-3">{t.text}</div>
          </Link>
        ))}
        {!filtered.length && (
          <div className="text-white/50 col-span-full text-center py-12">
            No topics yet. Seed the database: <code className="bg-white/10 px-2 py-1 rounded">cd backend && npm run seed</code>
          </div>
        )}
      </div>
    </div>
  );
}
