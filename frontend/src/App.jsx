import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Practice from './pages/Practice.jsx';
import Feedback from './pages/Feedback.jsx';
import MentorUpload from './pages/MentorUpload.jsx';
import Pricing from './pages/Pricing.jsx';

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('voxa_token');

  function logout() {
    localStorage.removeItem('voxa_token');
    localStorage.removeItem('voxa_user');
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/" className="font-display text-2xl tracking-tight">
          <span className="text-white">Vox</span>
          <span className="text-accent">a</span>
        </Link>
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
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice/:topicId" element={<Practice />} />
          <Route path="/feedback/:sessionId" element={<Feedback />} />
          <Route path="/mentor" element={<MentorUpload />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </div>
  );
}
