/* ============================================================
   Personal Assistant — Notes, Chat & Action Handlers
   ============================================================ */

// ---- NOTES PAGE ----
async function renderNotes() {
  const notes = await DataService.getNotes();
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  return `<div class="page-enter">
    <div class="page-header">
      <div><h1 class="page-title">Notes</h1><p class="page-subtitle">Capture and organize your thoughts.</p></div>
      <button class="btn btn-primary" onclick="openAddNoteModal()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Note</button>
    </div>
    <div class="notes-toolbar">
      <input class="form-input search-input" type="text" placeholder="Search notes..." id="notes-search" oninput="handleNotesSearch(this.value)">
      <div class="tag-filters">
        <button class="tag-filter active" onclick="filterNotesByTag(null, this)">All</button>
        ${allTags.map(t => `<button class="tag-filter" onclick="filterNotesByTag('${escapeHTML(t)}', this)">${escapeHTML(t)}</button>`).join('')}
      </div>
    </div>
    <div class="notes-grid" id="notes-grid">
      ${notes.length ? notes.map((n, i) => noteCardHTML(n, i)).join('') : '<div class="empty-state" style="grid-column:1/-1"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div class="empty-state-title">No notes yet</div><div class="empty-state-text">Create your first note to get started!</div></div>'}
    </div>
  </div>`;
}

function noteCardHTML(n, i) {
  return `<div class="note-card" style="animation-delay:${(i || 0) * 0.05}s">
    <div class="note-content">${escapeHTML(n.content)}</div>
    <div class="note-footer">
      <div class="note-tags">${(n.tags || []).map(t => `<span class="tag tag-primary">${escapeHTML(t)}</span>`).join('')}</div>
      <span class="note-date">${formatRelative(n.created_at)}</span>
      <button class="note-delete-btn" onclick="handleDeleteNote('${n._id}')" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    </div>
  </div>`;
}

let notesSearchTimeout;
async function handleNotesSearch(query) {
  clearTimeout(notesSearchTimeout);
  notesSearchTimeout = setTimeout(async () => {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    const notes = query.trim() ? await DataService.searchNotes(query.trim()) : await DataService.getNotes();
    grid.innerHTML = notes.length ? notes.map((n, i) => noteCardHTML(n, i)).join('') : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-title">No matching notes</div><div class="empty-state-text">Try a different search term.</div></div>';
  }, 300);
}

async function filterNotesByTag(tag, btn) {
  document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  let notes = await DataService.getNotes();
  if (tag) notes = notes.filter(n => (n.tags || []).includes(tag));
  grid.innerHTML = notes.length ? notes.map((n, i) => noteCardHTML(n, i)).join('') : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-text">No notes with this tag.</div></div>';
}

// ---- CHAT PAGE ----
let chatMessages = [];

function renderChat() {
  const suggestions = [
    'Add a task to review the budget report',
    'What events do I have today?',
    'Save a note about project deadlines',
    'Show my high priority tasks',
    'Schedule a meeting tomorrow at 2pm',
  ];

  return `<div class="page-enter">
    <div class="page-header">
      <div><h1 class="page-title">AI Chat</h1><p class="page-subtitle">Talk to your assistant in natural language.</p></div>
    </div>
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        ${chatMessages.length === 0 ? `
          <div class="chat-welcome">
            <div class="chat-welcome-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h2>How can I help you?</h2>
            <p>I can manage your tasks, schedule events, take notes, and more. Just ask!</p>
            <div class="chat-suggestions">
              ${suggestions.map(s => `<button class="chat-suggestion" onclick="sendChatFromSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('')}
            </div>
          </div>` : chatMessages.map(m => chatBubbleHTML(m)).join('')}
      </div>
      <div class="chat-input-area">
        <input class="chat-input" type="text" id="chat-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter')sendChatMessage()">
        <button class="chat-send-btn" id="chat-send" onclick="sendChatMessage()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function chatBubbleHTML(m) {
  const isUser = m.role === 'user';
  return `<div class="chat-message ${m.role}">
    <div class="chat-avatar">${isUser ? 'You' : 'AI'}</div>
    <div class="chat-bubble">${isUser ? escapeHTML(m.text) : m.text}</div>
  </div>`;
}

function sendChatFromSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  chatMessages.push({ role: 'user', text });

  // Remove welcome if present, render user message
  const container = document.getElementById('chat-messages');
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  container.innerHTML += chatBubbleHTML({ role: 'user', text });

  // Show typing indicator
  container.innerHTML += '<div class="chat-message assistant" id="typing-msg"><div class="chat-avatar">AI</div><div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>';
  container.scrollTop = container.scrollHeight;

  // Call API
  const result = await DataService.executeChat(text);

  // Remove typing indicator
  const typing = document.getElementById('typing-msg');
  if (typing) typing.remove();

  // Format response
  let responseText = result.message || 'Something went wrong.';
  if (result.action && result.action !== 'demo' && result.action !== 'error' && result.action !== 'unknown') {
    responseText = `<span class="response-action">${result.action.replace(/_/g, ' ').toUpperCase()}</span><br>${responseText}`;
    if (result.result?.data && (Array.isArray(result.result.data) ? result.result.data.length > 0 : Object.keys(result.result.data).length > 0)) {
      responseText += `<div class="response-data">${JSON.stringify(result.result.data, null, 2)}</div>`;
    }
  }

  chatMessages.push({ role: 'assistant', text: responseText });
  container.innerHTML += chatBubbleHTML({ role: 'assistant', text: responseText });
  container.scrollTop = container.scrollHeight;
}

// ---- ACTION HANDLERS ----
async function handleCompleteTask(id) {
  await DataService.completeTask(id);
  showToast('Task completed!', 'success');
  loadPage('tasks');
}

async function handleDeleteTask(id) {
  await DataService.deleteTask(id);
  showToast('Task deleted', 'info');
  loadPage('tasks');
}

async function handleDeleteEvent(id) {
  await DataService.deleteEvent(id);
  showToast('Event deleted', 'info');
  loadPage('calendar');
}

async function handleDeleteNote(id) {
  await DataService.deleteNote(id);
  showToast('Note deleted', 'info');
  loadPage('notes');
}

// ---- MODAL FORMS ----
function openAddTaskModal() {
  openModal('New Task', `
    <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="task-title" placeholder="Enter task title" required></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="task-desc" placeholder="Optional description" rows="3"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="task-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
      <div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="task-due" type="date"></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitNewTask()">Create Task</button>`
  );
  setTimeout(() => document.getElementById('task-title')?.focus(), 200);
}

async function submitNewTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { showToast('Title is required', 'warning'); return; }
  const data = {
    title,
    description: document.getElementById('task-desc').value.trim(),
    priority: document.getElementById('task-priority').value,
    due_date: document.getElementById('task-due').value || null
  };
  await DataService.createTask(data);
  closeModal();
  showToast('Task created!', 'success');
  loadPage('tasks');
}

function openAddEventModal() {
  openModal('New Event', `
    <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="event-title" placeholder="Event title" required></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start</label><input class="form-input" id="event-start" type="datetime-local" required></div>
      <div class="form-group"><label class="form-label">End</label><input class="form-input" id="event-end" type="datetime-local"></div>
    </div>
    <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="event-location" placeholder="Optional location"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitNewEvent()">Create Event</button>`
  );
  setTimeout(() => document.getElementById('event-title')?.focus(), 200);
}

async function submitNewEvent() {
  const title = document.getElementById('event-title').value.trim();
  const start = document.getElementById('event-start').value;
  if (!title || !start) { showToast('Title and start time are required', 'warning'); return; }
  const data = {
    title,
    datetime_start: new Date(start).toISOString(),
    datetime_end: document.getElementById('event-end').value ? new Date(document.getElementById('event-end').value).toISOString() : null,
    location: document.getElementById('event-location').value.trim()
  };
  await DataService.createEvent(data);
  closeModal();
  showToast('Event created!', 'success');
  loadPage('calendar');
}

function openAddNoteModal() {
  openModal('New Note', `
    <div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="note-content" placeholder="Write your note..." rows="5" required></textarea></div>
    <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-input" id="note-tags" placeholder="e.g. work, ideas, meeting"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitNewNote()">Save Note</button>`
  );
  setTimeout(() => document.getElementById('note-content')?.focus(), 200);
}

async function submitNewNote() {
  const content = document.getElementById('note-content').value.trim();
  if (!content) { showToast('Content is required', 'warning'); return; }
  const tagsRaw = document.getElementById('note-tags').value.trim();
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  await DataService.createNote({ content, tags });
  closeModal();
  showToast('Note saved!', 'success');
  loadPage('notes');
}
