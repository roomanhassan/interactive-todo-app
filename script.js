// ============================================================
//  TO-DO LIST — script.js
// ============================================================

// ---------- State ----------
let tasks = JSON.parse(localStorage.getItem('todo-tasks')) || [];
let currentFilter = 'all';

// ---------- DOM References ----------
const taskInput    = document.getElementById('taskInput');
const addBtn       = document.getElementById('addBtn');
const taskList     = document.getElementById('taskList');
const emptyState   = document.getElementById('emptyState');
const cardFooter   = document.getElementById('cardFooter');
const pendingCount = document.getElementById('pendingCount');
const taskStats    = document.getElementById('taskStats');
const charCount    = document.getElementById('charCount');
const clearBtn     = document.getElementById('clearCompleted');
const themeToggle  = document.getElementById('themeToggle');
const toggleIcon   = document.getElementById('toggleIcon');
const toggleLabel  = document.getElementById('toggleLabel');
const filterBtns   = document.querySelectorAll('.filter-btn');

// ============================================================
//  THEME
// ============================================================
const savedTheme = localStorage.getItem('todo-theme') || 'light';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('todo-theme', theme);
  if (theme === 'dark') {
    toggleIcon.textContent  = '☀️';
    toggleLabel.textContent = 'Light Mode';
  } else {
    toggleIcon.textContent  = '🌙';
    toggleLabel.textContent = 'Dark Mode';
  }
}

// ============================================================
//  ADD TASK
// ============================================================
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

taskInput.addEventListener('input', () => {
  const len = taskInput.value.length;
  charCount.textContent = `${len} / 120`;
  charCount.style.color = len >= 100
    ? 'var(--danger)'
    : 'var(--text-secondary)';
});

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    return;
  }

  const task = {
    id:        Date.now(),
    text:      text,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks();
  taskInput.value = '';
  charCount.textContent = '0 / 120';
  charCount.style.color = 'var(--text-secondary)';
  renderTasks();
  taskInput.focus();
}

// ============================================================
//  RENDER
// ============================================================
function renderTasks() {
  const filtered = getFilteredTasks();

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    cardFooter.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    filtered.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  updateStats();
}

function getFilteredTasks() {
  if (currentFilter === 'active')    return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t =>  t.completed);
  return tasks;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label', 'Mark task complete');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Text
  const span = document.createElement('span');
  span.className   = 'task-text';
  span.textContent = task.text;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn edit-btn';
  editBtn.innerHTML = '✏️';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.addEventListener('click', () => startEdit(li, task));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete-btn';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.addEventListener('click', () => deleteTask(li, task.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(actions);

  return li;
}

// ============================================================
//  TOGGLE COMPLETE
// ============================================================
function toggleTask(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks();
  renderTasks();
}

// ============================================================
//  DELETE TASK
// ============================================================
function deleteTask(li, id) {
  li.classList.add('removing');
  li.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }, { once: true });
}

// ============================================================
//  EDIT TASK
// ============================================================
function startEdit(li, task) {
  const span = li.querySelector('.task-text');

  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'task-edit-input';
  input.value     = task.text;
  input.maxLength = 120;

  span.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      tasks = tasks.map(t =>
        t.id === task.id ? { ...t, text: newText } : t
      );
      saveTasks();
    }
    renderTasks();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') renderTasks();
  });

  input.addEventListener('blur', commit);
}

// ============================================================
//  CLEAR COMPLETED
// ============================================================
clearBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
});

// ============================================================
//  FILTERS
// ============================================================
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ============================================================
//  STATS
// ============================================================
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending   = total - completed;

  taskStats.textContent   = `${total} task${total !== 1 ? 's' : ''}`;
  pendingCount.textContent = `${pending} left`;
}

// ============================================================
//  PERSIST
// ============================================================
function saveTasks() {
  localStorage.setItem('todo-tasks', JSON.stringify(tasks));
}

// ============================================================
//  INIT
// ============================================================
renderTasks();
