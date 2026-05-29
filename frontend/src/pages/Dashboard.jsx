import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { topics, auth } from '../api.js';

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    topics.list().then((r) => setList(r.topics)).catch(() => {});
    auth.me().then((r) => setUser(r.user)).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? list : list.filter((t) => t.category === filter);
  const categories = ['all', 'interview', 'storytelling', 'presentation', 'daily', 'public-speaking'];

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
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
            to={`/practice/${t._id}`}
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
            No topics yet. Seed the database: <code className="bg-white/10 px-2 py-1 rounded">node src/seed/topics.js</code>
          </div>
        )}
      </div>
    </div>
  );
}
