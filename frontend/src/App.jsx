import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import SmokeLanding from './pages/SmokeLanding.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Practice from './pages/Practice.jsx';
import Feedback from './pages/Feedback.jsx';
import MentorUpload from './pages/MentorUpload.jsx';
import Pricing from './pages/Pricing.jsx';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('voxa_token');

  // The smoke-test landing (/) is the public validation page — show a minimal,
  // distraction-free header (logo only), no links into the half-built app.
  const isSmoke = location.pathname === '/';

  function logout() {
    localStorage.removeItem('voxa_token');
    localStorage.removeItem('voxa_user');
    navigate('/app');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/" className="font-display text-2xl tracking-tight">
          <span className="text-white">Vox</span>
          <span className="text-accent">a</span>
        </Link>
        {isSmoke ? (
          <span className="text-xs text-white/40 uppercase tracking-wider">Early access</span>
        ) : (
        <nav className="flex gap-4 items-center text-sm text-white/70">
          {token ? (
            <>
              <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link to="/mentor" className="hover:text-white">Upload mentor</Link>
              <Link to="/pricing" className="hover:text-white">Pricing</Link>
              <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing" className="hover:text-white">Pricing</Link>
              <Link to="/auth" className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white">
                Sign in
              </Link>
            </>
          )}
        </nav>
        )}
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SmokeLanding />} />
          <Route path="/app" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice/topic/:topicId" element={<Practice mode="topic" />} />
          <Route path="/practice/mentor/:mentorId" element={<Practice mode="mentor" />} />
          {/* Back-compat */}
          <Route path="/practice/:topicId" element={<Practice mode="topic" />} />
          <Route path="/feedback/:sessionId" element={<Feedback />} />
          <Route path="/mentor" element={<MentorUpload />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </div>
  );
}
