import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api.js';

export default function Auth() {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'signup' ? auth.signup : auth.login;
      const res = await fn(form);
      localStorage.setItem('voxa_token', res.token);
      localStorage.setItem('voxa_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-20 max-w-md mx-auto">
      <div className="glass p-8">
        <h1 className="font-display text-3xl mb-2">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-white/60 mb-6 text-sm">
          {mode === 'signup' ? 'One free practice session, no card required.' : 'Sign in to continue.'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          )}
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

          {error && <div className="text-red-300 text-sm">{error}</div>}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="mt-4 text-sm text-white/60 hover:text-white"
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New to Voxa? Create an account'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-white/50 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-accent outline-none"
      />
    </label>
  );
}
