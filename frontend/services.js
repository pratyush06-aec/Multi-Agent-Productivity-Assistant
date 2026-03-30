/* ============================================================
   Personal Assistant — API Service & Utilities
   ============================================================ */

const API_BASE = window.location.origin;

// ---- Mock Data ----
const MOCK = {
  tasks: [
    { _id: 'm1', title: 'Review project proposal', description: 'Go through the Q2 proposal and add comments', status: 'pending', priority: 'high', due_date: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString() },
    { _id: 'm2', title: 'Update dependencies', description: 'Run npm audit and update packages', status: 'pending', priority: 'medium', due_date: new Date(Date.now() + 172800000).toISOString(), created_at: new Date().toISOString() },
    { _id: 'm3', title: 'Write unit tests', description: 'Add tests for the new auth module', status: 'in_progress', priority: 'high', due_date: new Date(Date.now() + 259200000).toISOString(), created_at: new Date().toISOString() },
    { _id: 'm4', title: 'Fix login bug', description: 'Users report intermittent login failures', status: 'in_progress', priority: 'medium', due_date: null, created_at: new Date().toISOString() },
    { _id: 'm5', title: 'Deploy v2.0', description: 'Production deployment completed', status: 'completed', priority: 'high', due_date: new Date(Date.now() - 86400000).toISOString(), created_at: new Date().toISOString() },
    { _id: 'm6', title: 'Design new landing page', description: 'Create mockups for redesign', status: 'completed', priority: 'low', due_date: null, created_at: new Date().toISOString() },
  ],
  events: [
    { _id: 'e1', title: 'Team Standup', datetime_start: todayAt(9, 0), datetime_end: todayAt(9, 30), location: 'Zoom', created_at: new Date().toISOString() },
    { _id: 'e2', title: 'Product Review', datetime_start: todayAt(14, 0), datetime_end: todayAt(15, 0), location: 'Conference Room B', created_at: new Date().toISOString() },
    { _id: 'e3', title: 'Sprint Planning', datetime_start: tomorrowAt(10, 0), datetime_end: tomorrowAt(11, 30), location: 'Main Hall', created_at: new Date().toISOString() },
    { _id: 'e4', title: '1:1 with Manager', datetime_start: tomorrowAt(16, 0), datetime_end: tomorrowAt(16, 30), location: '', created_at: new Date().toISOString() },
  ],
  notes: [
    { _id: 'n1', content: 'Remember to set up CI/CD pipeline for the new microservice. Use GitHub Actions with Docker.', tags: ['devops', 'ci-cd'], created_at: new Date(Date.now() - 3600000).toISOString() },
    { _id: 'n2', content: 'Meeting notes: Client wants dark mode, accessibility improvements, and mobile-first design.', tags: ['meeting', 'design'], created_at: new Date(Date.now() - 7200000).toISOString() },
    { _id: 'n3', content: 'API rate limits: 1000 req/min for free tier, 10000 for premium. Need to implement throttling.', tags: ['api', 'backend'], created_at: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'n4', content: 'Book recommendations: Clean Code, Designing Data-Intensive Applications, The Pragmatic Programmer.', tags: ['books', 'learning'], created_at: new Date(Date.now() - 172800000).toISOString() },
  ]
};

function todayAt(h, m) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString();
}
function tomorrowAt(h, m) {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0); return d.toISOString();
}

// ---- Connection State ----
let isConnected = false;

async function checkConnection() {
  try {
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    isConnected = r.ok;
  } catch { isConnected = false; }
  updateConnectionUI();
  return isConnected;
}

function updateConnectionUI() {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  if (isConnected) {
    dot.classList.add('connected');
    txt.textContent = 'Backend connected';
  } else {
    dot.classList.remove('connected');
    txt.textContent = 'Using demo data';
  }
}

// ---- API Fetch Wrapper ----
async function api(method, path, body) {
  if (!isConnected) return null;
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${API_BASE}${path}`, opts);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('API error:', e);
    return null;
  }
}

// ---- Data Access (API with mock fallback) ----
// Helper: extract array data from API response, fall back to mock if empty/null
function extractList(response, mockList) {
  if (!response) return mockList;
  const data = response.data ?? response;
  if (Array.isArray(data) && data.length > 0) return data;
  return mockList;
}

const DataService = {
  async getTasks(status) {
    const r = await api('GET', status ? `/tasks?status=${status}` : '/tasks');
    return extractList(r, MOCK.tasks.filter(t => !status || t.status === status));
  },
  async createTask(data) {
    const r = await api('POST', '/tasks', data);
    if (r) return r;
    const t = { _id: 'mock_' + Date.now(), ...data, status: 'pending', created_at: new Date().toISOString() };
    MOCK.tasks.unshift(t);
    return { success: true, data: t };
  },
  async completeTask(id) {
    if (id.startsWith('m') || id.startsWith('mock_')) {
      const t = MOCK.tasks.find(x => x._id === id);
      if (t) t.status = 'completed';
      return { success: true };
    }
    const r = await api('POST', `/tasks/${id}/complete`);
    return r ?? { success: false };
  },
  async deleteTask(id) {
    if (id.startsWith('m') || id.startsWith('mock_')) {
      MOCK.tasks.splice(MOCK.tasks.findIndex(x => x._id === id), 1);
      return { success: true };
    }
    const r = await api('DELETE', `/tasks/${id}`);
    return r ?? { success: false };
  },
  async getEvents() {
    const r = await api('GET', '/events');
    return extractList(r, MOCK.events);
  },
  async createEvent(data) {
    const r = await api('POST', '/events', data);
    if (r) return r;
    const e = { _id: 'mock_' + Date.now(), ...data, created_at: new Date().toISOString() };
    MOCK.events.push(e);
    return { success: true, data: e };
  },
  async deleteEvent(id) {
    if (id.startsWith('e') || id.startsWith('mock_')) {
      MOCK.events.splice(MOCK.events.findIndex(x => x._id === id), 1);
      return { success: true };
    }
    const r = await api('DELETE', `/events/${id}`);
    return r ?? { success: false };
  },
  async getNotes() {
    const r = await api('GET', '/notes');
    return extractList(r, MOCK.notes);
  },
  async searchNotes(kw) {
    const r = await api('GET', `/notes/search?keyword=${encodeURIComponent(kw)}`);
    return extractList(r, MOCK.notes.filter(n => n.content.toLowerCase().includes(kw.toLowerCase())));
  },
  async createNote(data) {
    const r = await api('POST', '/notes', data);
    if (r) return r;
    const n = { _id: 'mock_' + Date.now(), ...data, created_at: new Date().toISOString() };
    MOCK.notes.unshift(n);
    return { success: true, data: n };
  },
  async deleteNote(id) {
    if (id.startsWith('n') || id.startsWith('mock_')) {
      MOCK.notes.splice(MOCK.notes.findIndex(x => x._id === id), 1);
      return { success: true };
    }
    const r = await api('DELETE', `/notes/${id}`);
    return r ?? { success: false };
  },
  async executeChat(query) {
    const r = await api('POST', '/execute', { query });
    if (r) return r;
    return { 
      success: true, 
      action: 'demo', 
      agent: 'coordinator', 
      message: `Demo mode: I understood "${query}". Connect the backend for real AI responses!`, 
      result: {},
      executed_actions: [
        { tool: "demo_action_parser", args: { input: query } }
      ]
    };
  }
};

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)">✕</button>`;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, 4000);
}

// ---- Modal ----
function openModal(title, bodyHTML, footerHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ---- Helpers ----
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelative(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
