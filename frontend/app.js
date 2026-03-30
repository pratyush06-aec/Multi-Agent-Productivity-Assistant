/* ============================================================
   Personal Assistant — Main App (Router & Initialization)
   Loads: services.js, pages.js, pages2.js
   ============================================================ */

// ---- SPA Router ----
let currentPage = 'dashboard';

const pageRenderers = {
  dashboard: renderDashboard,
  tasks: renderTasks,
  calendar: renderCalendar,
  notes: renderNotes,
  chat: renderChat,
};

async function loadPage(page) {
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Render
  const main = document.getElementById('main-content');
  const renderer = pageRenderers[page];
  if (renderer) {
    const html = await renderer();
    main.innerHTML = html;
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

function navigateTo(page) {
  window.location.hash = `#/${page}`;
}

// Hash router
function handleHashChange() {
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  const page = Object.keys(pageRenderers).includes(hash) ? hash : 'dashboard';
  loadPage(page);
}

// ---- Mobile sidebar ----
document.getElementById('mobile-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
});

document.getElementById('sidebar-overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
});

// ---- Nav click handlers ----
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', () => navigateTo(el.dataset.page));
});

// ---- Init ----
window.addEventListener('hashchange', handleHashChange);

(async function init() {
  await checkConnection();
  handleHashChange();

  // Periodic health check
  setInterval(async () => {
    await checkConnection();
  }, 30000);
})();
