import { waitlist } from '../api.js';

// Stable anonymous per-browser id so we can count UNIQUE visitors, not page loads.
export function getSessionKey() {
  let k = localStorage.getItem('voxa_smoke_key');
  if (!k) {
    k = 'sk_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('voxa_smoke_key', k);
  }
  return k;
}

// utm_source / referrer for channel attribution in the smoke test.
export function getSource() {
  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source');
    if (utm) return utm.slice(0, 80);
    if (document.referrer) return new URL(document.referrer).hostname.slice(0, 80);
  } catch {
    /* ignore */
  }
  return 'direct';
}

export function track(type, meta = {}) {
  return waitlist.event(type, { sessionKey: getSessionKey(), source: getSource(), meta });
}

// Fire a visit event at most once per browser session (sessionStorage-scoped).
export function trackVisitOnce() {
  if (sessionStorage.getItem('voxa_smoke_visited')) return;
  sessionStorage.setItem('voxa_smoke_visited', '1');
  track('visit');
}
