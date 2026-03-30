/* ============================================================
   Personal Assistant — Page Renderers (1)
   ============================================================ */

window.pageRenderers = window.pageRenderers || {};

// ---- DASHBOARD ----
window.pageRenderers.dashboard = async () => {
  const [tasks, events, notes] = await Promise.all([
    DataService.getTasks(),
    DataService.getEvents(),
    DataService.getNotes()
  ]);

  const pending = tasks.filter(t => t.status !== 'completed').length;
  const highPri = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  
  // Recent activity feed (mixing newest tasks)
  const recent = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);

  return `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Your workspace overview and recent activity.</p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="bento-grid">
      <div class="bento-card stat-card">
        <div class="stat-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">Pending Tasks</div>
      </div>
      <div class="bento-card stat-card">
        <div class="stat-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <div class="stat-value">${events.length}</div>
        <div class="stat-label">Total Events</div>
      </div>
      <div class="bento-card stat-card">
        <div class="stat-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <div class="stat-value">${notes.length}</div>
        <div class="stat-label">Total Notes</div>
      </div>
      <div class="bento-card stat-card">
        <div class="stat-icon" style="color:var(--status-red);"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <div class="stat-value">${highPri}</div>
        <div class="stat-label">High Priority</div>
      </div>
    </div>

    <div class="bento-grid bento-grid-2">
      <!-- Activity Feed -->
      <div class="bento-card">
        <h3 style="font-size:14px; margin-bottom:16px;">Recent Activity</h3>
        ${recent.length ? `
          <ul class="activity-list">
            ${recent.map(t => `
              <li class="activity-item ${t.status}">
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <div class="activity-title">${escapeHTML(t.title)}</div>
                  <div class="activity-sub">${t.status.replace('_', ' ')} • ${formatRelative(t.created_at)}</div>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : `<div class="empty-state">No recent activity</div>`}
      </div>

      <!-- Quick Actions -->
      <div class="bento-card">
        <h3 style="font-size:14px; margin-bottom:16px;">Quick Actions</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; height:100%;">
          <button class="quick-action-btn" onclick="openTaskModal()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Task
          </button>
          <button class="quick-action-btn" onclick="openEventModal()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Event
          </button>
          <button class="quick-action-btn" onclick="openNoteModal()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Note
          </button>
          <button class="quick-action-btn" onclick="window.location.hash='#/chat'">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat
          </button>
        </div>
      </div>
    </div>
  `;
};

// ---- TASKS ----
window.pageRenderers.tasks = async () => {
  const tasks = await DataService.getTasks();
  
  const pending = tasks.filter(t => t.status === 'pending');
  const inProg = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'completed');

  const renderCard = (t) => `
    <div class="task-card">
      <div class="task-title">${escapeHTML(t.title)}</div>
      ${t.description ? `<div class="task-desc">${escapeHTML(t.description)}</div>` : ''}
      <div class="task-meta">
        <span class="badge ${t.priority}">${t.priority.toUpperCase()}</span>
        ${t.due_date ? `<span style="color:var(--text-secondary)">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${formatDate(t.due_date)}
        </span>` : ''}
        ${t.status !== 'completed' ? `
          <button style="margin-left:auto; background:none; border:none; color:var(--text-secondary); cursor:pointer;" onclick="completeAction('${t._id}', this)" title="Mark Complete">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  return `
    <div class="page-header">
      <div>
        <h2>Tasks</h2>
        <p>Manage your action items.</p>
      </div>
      <button class="btn btn-primary" onclick="openTaskModal()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Task
      </button>
    </div>

    <div class="kanban-board">
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>PENDING</span>
          <span class="nav-badge">${pending.length}</span>
        </div>
        <div class="kanban-col-content">
          ${pending.length ? pending.map(renderCard).join('') : '<div class="empty-state">No pending tasks</div>'}
        </div>
      </div>
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>IN PROGRESS</span>
          <span class="nav-badge">${inProg.length}</span>
        </div>
        <div class="kanban-col-content">
          ${inProg.length ? inProg.map(renderCard).join('') : '<div class="empty-state">Nothing in progress</div>'}
        </div>
      </div>
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>COMPLETED</span>
          <span class="nav-badge">${done.length}</span>
        </div>
        <div class="kanban-col-content">
          ${done.length ? done.map(renderCard).join('') : '<div class="empty-state">No completed tasks</div>'}
        </div>
      </div>
    </div>
  `;
};

// ---- CALENDAR ----
window.pageRenderers.calendar = async () => {
  const events = await DataService.getEvents();
  const d = new Date();
  const currMonth = d.getMonth();
  const currYear = d.getFullYear();
  const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayStr = new Date(currYear, currMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  let daysHTML = '';
  for (let i = 0; i < firstDayStr; i++) {
    daysHTML += `<div class="cal-day empty"></div>`;
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = (i === d.getDate());
    const eventCount = events.filter(e => {
      if(!e.datetime_start) return false;
      const ed = new Date(e.datetime_start);
      return ed.getDate() === i && ed.getMonth() === currMonth && ed.getFullYear() === currYear;
    }).length;
    
    daysHTML += `
      <div class="cal-day ${isToday ? 'today' : ''}">
        ${i}
        ${eventCount > 0 ? `<div class="event-dot" title="${eventCount} events"></div>` : ''}
      </div>
    `;
  }

  const upcoming = events
    .filter(e => new Date(e.datetime_start) >= new Date().setHours(0,0,0,0))
    .sort((a,b) => new Date(a.datetime_start) - new Date(b.datetime_start))
    .slice(0, 5);

  return `
    <div class="page-header">
      <div>
        <h2>Calendar</h2>
        <p>Your schedule and upcoming events.</p>
      </div>
      <button class="btn btn-primary" onclick="openEventModal()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Event
      </button>
    </div>

    <div class="calendar-layout">
      <div class="calendar-main">
        <div class="cal-nav">
          <button class="btn" style="border:none">←</button>
          <h3 style="font-size:16px;">${monthNames[currMonth]} ${currYear}</h3>
          <button class="btn" style="border:none">→</button>
        </div>
        <div class="cal-grid">
          <div class="cal-header-row">
            <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>
          <div class="cal-days">${daysHTML}</div>
        </div>
      </div>
      <div class="calendar-sidebar">
        <div class="bento-card" style="height:100%">
          <h3 style="font-size:14px; margin-bottom:16px;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Upcoming
          </h3>
          ${upcoming.length ? upcoming.map(e => `
            <div style="padding:12px 0; border-bottom:1px solid var(--border-dim)">
              <div style="font-size:13px; font-weight:500">${escapeHTML(e.title)}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
                ${formatDate(e.datetime_start)} at ${formatTime(e.datetime_start)}
              </div>
            </div>
          `).join('') : '<div class="empty-state">No upcoming events</div>'}
        </div>
      </div>
    </div>
  `;
};
