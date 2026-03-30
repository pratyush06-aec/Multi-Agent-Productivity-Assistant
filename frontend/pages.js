/* ============================================================
   Personal Assistant — Page Renderers (Dashboard, Tasks, Calendar)
   ============================================================ */

// ---- DASHBOARD ----
async function renderDashboard() {
  const tasks = await DataService.getTasks();
  const events = await DataService.getEvents();
  const notes = await DataService.getNotes();

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const todayEvents = events.filter(e => {
    const d = new Date(e.datetime_start);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const badge = document.getElementById('tasks-badge');
  if (pending > 0) { badge.style.display = ''; badge.textContent = pending; } else { badge.style.display = 'none'; }

  return `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome back! Here's your productivity overview.</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="glass-card stat-card" style="animation-delay:0.05s">
          <div class="stat-icon tasks-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-value">${pending}</div>
          <div class="stat-label">Pending Tasks</div>
        </div>
        <div class="glass-card stat-card" style="animation-delay:0.1s">
          <div class="stat-icon events-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-value">${todayEvents.length}</div>
          <div class="stat-label">Today's Events</div>
        </div>
        <div class="glass-card stat-card" style="animation-delay:0.15s">
          <div class="stat-icon notes-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="stat-value">${notes.length}</div>
          <div class="stat-label">Total Notes</div>
        </div>
        <div class="glass-card stat-card" style="animation-delay:0.2s">
          <div class="stat-icon priority-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-value">${highPriority}</div>
          <div class="stat-label">High Priority</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="glass-card" style="animation-delay:0.25s">
          <div class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Recent Activity
          </div>
          <ul class="activity-list">
            ${tasks.slice(0, 5).map(t => `
              <li class="activity-item">
                <span class="activity-dot" style="background:${t.status === 'completed' ? 'var(--color-success)' : t.priority === 'high' ? 'var(--color-danger)' : 'var(--accent-primary)'}"></span>
                <div>
                  <div class="activity-text"><strong>${escapeHTML(t.title)}</strong> — ${t.status.replace('_', ' ')}</div>
                  <div class="activity-time">${formatRelative(t.created_at)}</div>
                </div>
              </li>`).join('')}
            ${tasks.length === 0 ? '<li class="activity-item"><div class="activity-text">No recent activity</div></li>' : ''}
          </ul>
        </div>
        <div class="glass-card" style="animation-delay:0.3s">
          <div class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Quick Actions
          </div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="navigateTo('tasks');setTimeout(()=>openAddTaskModal(),300)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Task
            </button>
            <button class="quick-action-btn" onclick="navigateTo('calendar');setTimeout(()=>openAddEventModal(),300)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
              New Event
            </button>
            <button class="quick-action-btn" onclick="navigateTo('notes');setTimeout(()=>openAddNoteModal(),300)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
              New Note
            </button>
            <button class="quick-action-btn" onclick="navigateTo('chat')">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              AI Chat
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

// ---- TASKS ----
async function renderTasks() {
  const tasks = await DataService.getTasks();
  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');

  function taskCard(t) {
    const prClass = t.priority === 'high' ? 'priority-high' : t.priority === 'medium' ? 'priority-medium' : 'priority-low';
    return `<div class="task-card" id="task-${t._id}">
      <div class="task-card-title">${escapeHTML(t.title)}</div>
      ${t.description ? `<div class="task-card-desc">${escapeHTML(t.description)}</div>` : ''}
      <div class="task-card-footer">
        <div class="task-card-meta">
          <span class="tag ${prClass}">${t.priority}</span>
          ${t.due_date ? `<span class="task-due"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${formatDate(t.due_date)}</span>` : ''}
        </div>
        <div class="task-actions">
          ${t.status !== 'completed' ? `<button class="task-action-btn complete-btn" title="Complete" onclick="handleCompleteTask('${t._id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>` : ''}
          <button class="task-action-btn delete-btn" title="Delete" onclick="handleDeleteTask('${t._id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </div>
    </div>`;
  }

  return `<div class="page-enter">
    <div class="page-header">
      <div><h1 class="page-title">Tasks</h1><p class="page-subtitle">Manage your tasks across different stages.</p></div>
      <button class="btn btn-primary" onclick="openAddTaskModal()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task</button>
    </div>
    <div class="kanban-board">
      <div class="kanban-column">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color:var(--color-warning)">⏳ Pending</span>
          <span class="kanban-column-count">${pending.length}</span>
        </div>
        <div class="kanban-cards">${pending.length ? pending.map(taskCard).join('') : '<div class="empty-state"><div class="empty-state-text">No pending tasks</div></div>'}</div>
      </div>
      <div class="kanban-column">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color:var(--accent-primary)">🔄 In Progress</span>
          <span class="kanban-column-count">${inProgress.length}</span>
        </div>
        <div class="kanban-cards">${inProgress.length ? inProgress.map(taskCard).join('') : '<div class="empty-state"><div class="empty-state-text">No tasks in progress</div></div>'}</div>
      </div>
      <div class="kanban-column">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color:var(--color-success)">✅ Completed</span>
          <span class="kanban-column-count">${completed.length}</span>
        </div>
        <div class="kanban-cards">${completed.length ? completed.map(taskCard).join('') : '<div class="empty-state"><div class="empty-state-text">No completed tasks</div></div>'}</div>
      </div>
    </div>
  </div>`;
}

// ---- CALENDAR ----
let calendarDate = new Date();

async function renderCalendar() {
  const events = await DataService.getEvents();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const monthName = calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Build grid cells
  let cells = '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(d => { cells += `<div class="calendar-day-header">${d}</div>`; });

  // Previous month padding
  const prevMonth = new Date(year, month, 0);
  for (let i = startPad - 1; i >= 0; i--) {
    cells += `<div class="calendar-day other-month"><span class="day-number">${prevMonth.getDate() - i}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dayEvents = events.filter(e => {
      const ed = new Date(e.datetime_start);
      return ed.getDate() === d && ed.getMonth() === month && ed.getFullYear() === year;
    });
    cells += `<div class="calendar-day${isToday ? ' today' : ''}">
      <span class="day-number">${d}</span>
      ${dayEvents.slice(0, 2).map(e => `<div class="day-event">${escapeHTML(e.title)}</div>`).join('')}
      ${dayEvents.length > 2 ? `<div class="day-event" style="opacity:0.6">+${dayEvents.length - 2} more</div>` : ''}
    </div>`;
  }

  // Next month padding
  const totalCells = startPad + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells += `<div class="calendar-day other-month"><span class="day-number">${i}</span></div>`;
  }

  // Upcoming events sidebar
  const upcoming = events.filter(e => new Date(e.datetime_start) >= new Date()).sort((a, b) => new Date(a.datetime_start) - new Date(b.datetime_start)).slice(0, 6);

  return `<div class="page-enter">
    <div class="page-header">
      <div><h1 class="page-title">Calendar</h1><p class="page-subtitle">View and manage your schedule.</p></div>
      <button class="btn btn-primary" onclick="openAddEventModal()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Event</button>
    </div>
    <div class="calendar-layout">
      <div>
        <div class="calendar-nav">
          <button class="btn btn-ghost btn-sm" onclick="changeMonth(-1)">← Prev</button>
          <span class="calendar-month-title">${monthName}</span>
          <button class="btn btn-ghost btn-sm" onclick="changeMonth(1)">Next →</button>
        </div>
        <div class="calendar-grid">${cells}</div>
      </div>
      <div class="events-sidebar glass-card">
        <div class="section-title"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Upcoming Events</div>
        <div class="event-list">
          ${upcoming.length ? upcoming.map(e => {
            const dt = new Date(e.datetime_start);
            const h = dt.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const min = String(dt.getMinutes()).padStart(2, '0');
            return `<div class="event-item"><div class="event-time-block"><span class="event-time-hour">${h12}:${min}</span><span class="event-time-ampm">${ampm}</span></div><div class="event-details"><div class="event-title">${escapeHTML(e.title)}</div><div class="event-location">${e.location ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHTML(e.location)}` : `<span style="color:var(--text-muted)">${formatDate(e.datetime_start)}</span>`}</div></div><button class="event-delete-btn" onclick="handleDeleteEvent('${e._id}')" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`;
          }).join('') : '<div class="empty-state"><div class="empty-state-text">No upcoming events</div></div>'}
        </div>
      </div>
    </div>
  </div>`;
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  loadPage('calendar');
}
