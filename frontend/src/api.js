import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voxa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const auth = {
  signup: (data) => api.post('/auth/signup', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const topics = {
  list: (params) => api.get('/topics', { params }).then((r) => r.data),
  get: (id) => api.get(`/topics/${id}`).then((r) => r.data),
};

export const sessions = {
  start: (data) => api.post('/sessions/start', data).then((r) => r.data),
  get: (id) => api.get(`/sessions/${id}`).then((r) => r.data),
  list: () => api.get('/sessions').then((r) => r.data),
};

export const analyze = {
  voice: (sessionId, payload) =>
    api.post(`/analyze/voice/${sessionId}`, payload).then((r) => r.data),
  gesture: (sessionId, payload) =>
    api.post(`/analyze/gesture/${sessionId}`, payload).then((r) => r.data),
  feedback: (sessionId) =>
    api.post(`/analyze/feedback/${sessionId}`).then((r) => r.data),
};

export const tts = {
  voices: () => api.get('/tts/voices').then((r) => r.data),
  synthesize: (text, voice) =>
    api
      .post('/tts/synthesize', { text, voice }, { responseType: 'blob' })
      .then((r) => URL.createObjectURL(r.data)),
};

export const mentor = {
  upload: (file, label) => {
    const fd = new FormData();
    fd.append('clip', file);
    if (label) fd.append('label', label);
    return api
      .post('/mentor/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  list: () => api.get('/mentor').then((r) => r.data),
  get: (id) => api.get(`/mentor/${id}`).then((r) => r.data),
};
