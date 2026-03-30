/* ============================================================
   Personal Assistant — Page Renderers (2)
   ============================================================ */

window.pageRenderers = window.pageRenderers || {};

// ---- NOTES ----
window.pageRenderers.notes = async () => {
  const notes = await DataService.getNotes();
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].filter(Boolean);

  return `
    <div class="page-header">
      <div>
        <h2>Notes</h2>
        <p>Your personal knowledge base.</p>
      </div>
      <button class="btn btn-primary" onclick="openNoteModal()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        New Note
      </button>
    </div>

    <div class="notes-toolbar">
      <div style="position:relative; flex:1">
        <svg fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="position:absolute; left:12px; top:10px; color:var(--text-tertiary)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="note-search" class="search-input" placeholder="Search notes..." style="padding-left:36px">
      </div>
      <select id="note-filter" class="search-input" style="flex:none; width:140px;">
        <option value="">All Tags</option>
        ${allTags.map(tag => `<option value="${escapeHTML(tag)}">${escapeHTML(tag)}</option>`).join('')}
      </select>
    </div>

    <div class="notes-grid" id="notes-grid">
      ${renderNotesList(notes)}
    </div>
  `;
};

function renderNotesList(notes) {
  if (!notes.length) return `<div class="empty-state" style="grid-column: 1 / -1">No notes found</div>`;
  return notes.map(n => `
    <div class="note-card">
      <div class="note-content">${escapeHTML(n.content)}</div>
      <div class="note-footer">
        <div class="note-tags">
          ${(n.tags || []).map(tag => `<span class="tag">${escapeHTML(tag.toUpperCase())}</span>`).join('')}
        </div>
        <div class="note-date">${formatRelative(n.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// Note search event delegation
document.addEventListener('input', async (e) => {
  if (e.target.id === 'note-search') {
    const val = e.target.value;
    const notes = val ? await DataService.searchNotes(val) : await DataService.getNotes();
    document.getElementById('notes-grid').innerHTML = renderNotesList(notes);
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'note-filter') {
    const val = e.target.value;
    const notes = await DataService.getNotes();
    const filtered = val ? notes.filter(n => (n.tags || []).includes(val)) : notes;
    document.getElementById('notes-grid').innerHTML = renderNotesList(filtered);
  }
});

// ---- AI CHAT (MCP STYLE) ----
let chatHistory = [];

window.pageRenderers.chat = async () => {
  return `
    <div class="page-header" style="margin-bottom: 24px;">
      <div>
        <h2>Terminal</h2>
        <p>MCP Agentic Natural Language Interface.</p>
      </div>
      <button class="btn" onclick="chatHistory=[]; document.getElementById('chat-log').innerHTML='<div class=\\'empty-state\\' style=\\'margin:auto\\'>Waiting for input...</div>';">Clear</button>
    </div>

    <div class="chat-container">
      <div class="chat-log" id="chat-log">
        ${chatHistory.length ? chatHistory.map(renderChatMessage).join('') : `<div class="empty-state" style="margin:auto">Waiting for input...</div>`}
      </div>
      
      <form class="chat-input-area" id="chat-form">
        <input type="text" id="chat-input" class="chat-input" placeholder="Try 'Add a task to review the budget' or 'What events do I have?'" autocomplete="off" required>
        <button type="submit" class="chat-submit" id="chat-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  `;
};

function renderChatMessage(msg) {
  let actionsHtml = '';
  
  // Render Executed Actions Traces (MCP Style)
  if (msg.executed_actions && msg.executed_actions.length > 0) {
    actionsHtml = msg.executed_actions.map(act => {
      const argsStr = JSON.stringify(act.args);
      return `<div class="tool-trace">System.<span class="tool-name">${escapeHTML(act.tool)}</span>(<span class="tool-args">${escapeHTML(argsStr)}</span>);</div>`;
    }).join('');
  }

  return `
    <div class="chat-msg msg-${msg.sender}">
      <div class="msg-avatar">${msg.sender === 'user' ? 'YOU' : 'AI'}</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${actionsHtml}
        <div class="msg-bubble">${escapeHTML(msg.text)}</div>
      </div>
    </div>
  `;
}

document.addEventListener('submit', async (e) => {
  if (e.target.id === 'chat-form') {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    const log = document.getElementById('chat-log');
    
    // Clear init state if needed
    if(chatHistory.length === 0) log.innerHTML = '';
    
    // Add User Message
    const userMsg = { sender: 'user', text };
    chatHistory.push(userMsg);
    log.insertAdjacentHTML('beforeend', renderChatMessage(userMsg));
    
    // Typing indicator
    const typingId = 'typing-' + Date.now();
    log.insertAdjacentHTML('beforeend', `
      <div class="chat-msg msg-ai" id="${typingId}">
        <div class="msg-avatar">AI</div>
        <div class="msg-bubble" style="opacity:0.5; font-style:italic;">Processing...</div>
      </div>
    `);
    log.scrollTop = log.scrollHeight;
    
    // Fetch from Agent
    const res = await DataService.executeChat(text);
    document.getElementById(typingId).remove();
    
    // Store AI Response with Tool Actions
    const aiMsg = { 
      sender: 'ai', 
      text: res ? res.message : 'Error communicating with agent.', 
      executed_actions: res ? res.executed_actions : []
    };
    
    chatHistory.push(aiMsg);
    log.insertAdjacentHTML('beforeend', renderChatMessage(aiMsg));
    log.scrollTop = log.scrollHeight;
  }
});

// ---- MODAL / FORMS ----
window.openTaskModal = () => {
  openModal('New Task', `
    <form id="task-form">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="t-title" class="form-control" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="t-desc" class="form-control" rows="2"></textarea>
      </div>
      <div style="display:flex; gap:16px;">
        <div class="form-group" style="flex:1">
          <label>Priority</label>
          <select id="t-pri" class="form-control">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label>Due Date</label>
          <input type="date" id="t-date" class="form-control">
        </div>
      </div>
    </form>
  `, 
  `<button class="btn" style="border:none" onclick="closeModal()">Cancel</button>
   <button class="btn btn-primary" onclick="submitTask()">Save Task</button>`);
};

window.submitTask = async () => {
  const t = document.getElementById('t-title').value;
  if (!t) return;
  const res = await DataService.createTask({
    title: t,
    description: document.getElementById('t-desc').value,
    priority: document.getElementById('t-pri').value,
    due_date: document.getElementById('t-date').value ? new Date(document.getElementById('t-date').value).toISOString() : null
  });
  if (res && res.success) {
    showToast('Task created', 'success');
    closeModal();
    if(window.location.hash === '#/tasks') window.pageRenderers.tasks().then(r => document.getElementById('main-content').innerHTML = r);
  } else showToast('Failed to create task', 'error');
};

window.openEventModal = () => {
  openModal('New Event', `
    <form id="evt-form">
      <div class="form-group"><label>Title</label><input type="text" id="e-title" class="form-control" required></div>
      <div class="form-group"><label>Start Time</label><input type="datetime-local" id="e-start" class="form-control" required></div>
      <div class="form-group"><label>End Time</label><input type="datetime-local" id="e-end" class="form-control"></div>
      <div class="form-group"><label>Location</label><input type="text" id="e-loc" class="form-control"></div>
    </form>
  `, `<button class="btn" style="border:none" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitEvent()">Save Event</button>`);
};

window.submitEvent = async () => {
  const t = document.getElementById('e-title').value;
  const s = document.getElementById('e-start').value;
  if (!t || !s) return;
  const res = await DataService.createEvent({
    title: t,
    datetime_start: new Date(s).toISOString(),
    datetime_end: document.getElementById('e-end').value ? new Date(document.getElementById('e-end').value).toISOString() : null,
    location: document.getElementById('e-loc').value
  });
  if (res && res.success) {
    showToast('Event scheduled', 'success');
    closeModal();
    if(window.location.hash === '#/calendar') window.pageRenderers.calendar().then(r => document.getElementById('main-content').innerHTML = r);
  } else showToast('Scheduling failed', 'error');
};

window.openNoteModal = () => {
  openModal('New Note', `
    <form id="note-form">
      <div class="form-group"><label>Content</label><textarea id="n-content" class="form-control" rows="4" required></textarea></div>
      <div class="form-group"><label>Tags (comma separated)</label><input type="text" id="n-tags" class="form-control" placeholder="idea, project, meeting"></div>
    </form>
  `, `<button class="btn" style="border:none" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitNote()">Save Note</button>`);
};

window.submitNote = async () => {
  const c = document.getElementById('n-content').value;
  if (!c) return;
  const tg = document.getElementById('n-tags').value;
  const tags = tg ? tg.split(',').map(x=>x.trim()).filter(Boolean) : [];
  const res = await DataService.createNote({ content: c, tags });
  if (res && res.success) {
    showToast('Note saved', 'success');
    closeModal();
    if(window.location.hash === '#/notes') window.pageRenderers.notes().then(r => document.getElementById('main-content').innerHTML = r);
  } else showToast('Failed to save note', 'error');
};

window.completeAction = async (id, btn) => {
  btn.style.opacity = '0.5';
  const res = await DataService.completeTask(id);
  if (res && res.success) {
    showToast('Task completed', 'success');
    if(window.location.hash === '#/tasks') window.pageRenderers.tasks().then(r => document.getElementById('main-content').innerHTML = r);
  } else {
    btn.style.opacity = '1';
    showToast('Could not complete task', 'error');
  }
};
