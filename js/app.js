// ======================== STATE ========================
let tasks = JSON.parse(localStorage.getItem('blossom_tasks') || '[]');
let habits = JSON.parse(localStorage.getItem('blossom_habits') || JSON.stringify([
  { id: 1, name: 'Drink 8 glasses of water 💧', emoji: '💧', streak: 3, done: [false,true,true,false,true,false,false] },
  { id: 2, name: 'Morning skincare routine 🌸', emoji: '🌸', streak: 7, done: [true,true,true,true,true,true,false] },
  { id: 3, name: '30 min reading 📚', emoji: '📚', streak: 2, done: [false,false,true,true,false,false,false] },
  { id: 4, name: 'Stretch / yoga 🧘', emoji: '🧘', streak: 1, done: [false,false,false,false,true,false,false] },
]));
let weekData = JSON.parse(localStorage.getItem('blossom_week') || JSON.stringify([2,4,3,5,1,6,0]));
let currentFilter = 'all';
let searchQuery = '';
let currentView = 'tasks';
let editingTaskId = null;
let dailyGoal = parseInt(localStorage.getItem('blossom_goal') || '5');
let streak = parseInt(localStorage.getItem('blossom_streak') || '0');
let currentMood = localStorage.getItem('blossom_mood') || '';
let nightMode = false;
let autoTheme = true;

// Pomodoro
let pomRunning = false, pomInterval = null;
let pomSeconds = 25*60, pomSession = 1, pomIsBreak = false;
let focusRunning = false, focusInterval = null, focusSeconds = 25*60;

// Sounds (simulated)
let activeSounds = {};

const quotes = [
  { text: "You are capable of amazing things. Trust the process.", author: "— Your inner self" },
  { text: "One small positive thought in the morning can change your whole day.", author: "— Dalai Lama" },
  { text: "Progress, not perfection. Every step counts.", author: "— Blossom 🌸" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "— Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "— Mark Twain" },
  { text: "She believed she could, so she did.", author: "— R.S. Grey" },
  { text: "Be gentle with yourself. You are doing better than you think.", author: "— Blossom 🌸" },
  { text: "A little bit of progress each day adds up to big results.", author: "— Satya Nadellas" },
  { text: "Your future self is rooting for you right now.", author: "— Blossom 🌸" },
  { text: "Bloom where you are planted.", author: "— Mary Engelbreit" },
];
const motivations = [
  { msg: "You're doing amazing! 🌸", icon: "✨" },
  { msg: "One task at a time, you've got this 🩷", icon: "🌸" },
  { msg: "Future you will thank you 🌊", icon: "🌊" },
  { msg: "Progress is still progress 🐱", icon: "🐱" },
  { msg: "Keep going, you're closer than you think ✨", icon: "⭐" },
  { msg: "A little effort every day creates big results 🌼", icon: "🌼" },
  { msg: "You're a productivity queen 👑", icon: "👑" },
  { msg: "Every completed task is a win! 🎉", icon: "🎉" },
  { msg: "You're blooming beautifully 🌸", icon: "🌺" },
];

// ======================== INIT ========================
function init() {
  updateGreeting();
  updateThemeAuto();
  setInterval(updateThemeAuto, 60000);
  renderTasks();
  updateStats();
  renderHabits();
  renderStats();
  newQuote();
  initCanvas();
  updateGoalDisplay();
  restoreMood();

  // Pre-populate demo tasks if empty
  if (tasks.length === 0) {
    tasks = [
      { id: Date.now()+1, title: 'Morning journaling & gratitude 📓', cat: 'personal', pri: 'low', date: today(), done: false },
      { id: Date.now()+2, title: 'Finish the project proposal 💼', cat: 'work', pri: 'high', date: today(), done: false },
      { id: Date.now()+3, title: 'Drink 8 glasses of water 💧', cat: 'health', pri: 'med', date: today(), done: true },
      { id: Date.now()+4, title: 'Study Chapter 5 — Biology 🌱', cat: 'study', pri: 'med', date: today(), done: false },
      { id: Date.now()+5, title: 'Sketch ideas for art journal 🎨', cat: 'creative', pri: 'low', date: '', done: false },
    ];
    saveTasks();
    renderTasks();
    updateStats();
  }
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function saveTasks() { localStorage.setItem('blossom_tasks', JSON.stringify(tasks)); }
function saveHabits() { localStorage.setItem('blossom_habits', JSON.stringify(habits)); }

// ======================== THEME ========================
function updateThemeAuto() {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 20;
  if (isNight !== nightMode) {
    nightMode = isNight;
    document.body.classList.toggle('night-mode', isNight);
  }
}
function toggleTheme() {
  autoTheme = false;
  nightMode = !nightMode;
  document.body.classList.toggle('night-mode', nightMode);
}

// ======================== GREETING ========================
function updateGreeting() {
  const h = new Date().getHours();
  let greet = h < 12 ? 'Good morning, lovely 🌸' : h < 17 ? 'Good afternoon, sunshine ☀️' : h < 20 ? 'Good evening, gorgeous 🌙' : 'Good night, sweet one 🌟';
  document.getElementById('greetingMain').textContent = greet;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  document.getElementById('greetingSub').textContent = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

// ======================== NAVIGATION ========================
function setView(view) {
  currentView = view;
  ['tasks','habits','stats','relax'].forEach(v => {
    document.getElementById('viewTasks') && (document.getElementById('view'+v.charAt(0).toUpperCase()+v.slice(1)).style.display = 'none');
    document.getElementById('nav-'+v)?.classList.remove('active');
  });
  document.getElementById('view'+view.charAt(0).toUpperCase()+view.slice(1)).style.display = '';
  document.getElementById('nav-'+view).classList.add('active');
  if (view === 'stats') renderStats();
  if (view === 'relax') newQuote();
  // Mobile: close sidebar
  if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ======================== TASKS ========================
function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('#filterRow .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderTasks();
}
function filterTasks() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase();
  renderTasks();
}
function getFilteredTasks() {
  return tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery)) return false;
    if (currentFilter === 'pending') return !t.done;
    if (currentFilter === 'done') return t.done;
    if (currentFilter === 'high') return t.pri === 'high';
    if (['work','personal','health','study','creative','other'].includes(currentFilter)) return t.cat === currentFilter;
    return true;
  });
}
function renderTasks() {
  const list = document.getElementById('taskList');
  const filtered = getFilteredTasks();
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🌸</div><p>No tasks here yet. Add something lovely! ✨</p></div>`;
    return;
  }
  list.innerHTML = filtered.map((t, i) => `
    <div class="task-item ${t.done ? 'completed' : ''}" id="task-${t.id}" style="animation-delay:${i*0.05}s">
      <div class="task-check ${t.done ? 'done' : ''}" onclick="toggleTask(${t.id})">
        <span class="check-icon">✓</span>
      </div>
      <div class="task-content">
        <div class="task-title">${escHtml(t.title)}</div>
        <div class="task-meta">
          <span class="task-cat cat-${t.cat}">${catLabel(t.cat)}</span>
          <span class="priority-dot pri-${t.pri}" title="${t.pri} priority"></span>
          ${t.date ? `<span class="task-date">📅 ${formatDate(t.date)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn" onclick="editTask(${t.id})" title="Edit">✏️</button>
        <button class="task-action-btn del" onclick="deleteTask(${t.id})" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
  updateStats();
}
function catLabel(c) {
  return { personal:'🌸 Personal', work:'💼 Work', health:'🌿 Health', study:'📚 Study', creative:'🎨 Creative', other:'✨ Other' }[c] || c;
}
function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}`;
}
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTasks();
  renderTasks();
  updateStats();
  if (t.done) {
    spawnStars();
    setTimeout(() => showMotivation(), 300);
    // Update week data
    weekData[new Date().getDay()]++;
    localStorage.setItem('blossom_week', JSON.stringify(weekData));
  }
}
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  updateStats();
}
function openModal(id) {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'Add a Task';
  document.getElementById('taskTitleInput').value = '';
  document.getElementById('taskCatInput').value = 'personal';
  document.getElementById('taskPriInput').value = 'low';
  document.getElementById('taskDateInput').value = today();
  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskTitleInput').focus(), 350);
}
function editTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editingTaskId = id;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskTitleInput').value = t.title;
  document.getElementById('taskCatInput').value = t.cat;
  document.getElementById('taskPriInput').value = t.pri;
  document.getElementById('taskDateInput').value = t.date || '';
  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskTitleInput').focus(), 350);
}
function closeModal() { document.getElementById('taskModal').classList.remove('open'); }
function saveTask() {
  const title = document.getElementById('taskTitleInput').value.trim();
  if (!title) { document.getElementById('taskTitleInput').style.borderColor = '#FF8080'; setTimeout(() => document.getElementById('taskTitleInput').style.borderColor = '', 1200); return; }
  const cat = document.getElementById('taskCatInput').value;
  const pri = document.getElementById('taskPriInput').value;
  const date = document.getElementById('taskDateInput').value;
  if (editingTaskId) {
    const t = tasks.find(t => t.id === editingTaskId);
    if (t) { t.title = title; t.cat = cat; t.pri = pri; t.date = date; }
  } else {
    tasks.unshift({ id: Date.now(), title, cat, pri, date, done: false });
  }
  saveTasks();
  renderTasks();
  updateStats();
  closeModal();
  showToast(editingTaskId ? '✏️' : '🌸', editingTaskId ? 'Task updated beautifully!' : 'New task added! Keep it up ✨');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.getElementById('taskModal').addEventListener('click', e => { if (e.target === document.getElementById('taskModal')) closeModal(); });

// ======================== STATS ========================
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pending = total - done;
  const pct = total ? Math.round(done/total*100) : 0;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statStreak').textContent = streak;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('goalCompNum').textContent = done;
  updateGoalSlider();
}
function updateGoalDisplay() {
  document.getElementById('goalTargetNum').textContent = dailyGoal;
  const slider = document.getElementById('goalSlider');
  if (slider) slider.value = dailyGoal;
  updateGoalSlider();
}
function updateGoal(v) {
  dailyGoal = parseInt(v);
  localStorage.setItem('blossom_goal', dailyGoal);
  document.getElementById('goalTargetNum').textContent = dailyGoal;
  updateGoalSlider();
}
function updateGoalSlider() {
  const slider = document.getElementById('goalSlider');
  if (!slider) return;
  const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.setProperty('--prog', pct + '%');
}

function renderStats() {
  // Week chart
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const maxVal = Math.max(...weekData, 1);
  const chart = document.getElementById('weekChart');
  const labels = document.getElementById('weekLabels');
  if (!chart) return;
  chart.innerHTML = weekData.map((v, i) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
      <div style="background:linear-gradient(180deg,#FFB3D1,#C9B8FF);border-radius:6px 6px 0 0;width:100%;height:${Math.max(v/maxVal*70,4)}px;transition:height 0.5s;opacity:0.85"></div>
      <div style="font-size:0.68rem;color:var(--text-muted)">${v}</div>
    </div>
  `).join('');
  labels.innerHTML = days.map(d => `<span>${d}</span>`).join('');

  // Achievements
  const done = tasks.filter(t => t.done).length;
  const achievements = [
    { icon:'🌸', name:'First Bloom', desc:'Complete your first task', unlocked: done >= 1 },
    { icon:'🌿', name:'Growing Strong', desc:'Complete 5 tasks', unlocked: done >= 5 },
    { icon:'🌊', name:'Ocean Vibes', desc:'Complete 10 tasks', unlocked: done >= 10 },
    { icon:'⭐', name:'Star Collector', desc:'Maintain a 3-day streak', unlocked: streak >= 3 },
    { icon:'👑', name:'Productivity Queen', desc:'Complete 20 tasks', unlocked: done >= 20 },
  ];
  const aList = document.getElementById('achievementsList');
  if (aList) aList.innerHTML = achievements.map(a => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,214,232,0.2);opacity:${a.unlocked?1:0.4}">
      <span style="font-size:1.3rem">${a.icon}</span>
      <div>
        <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary)">${a.name}${a.unlocked?' ✓':''}</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${a.desc}</div>
      </div>
    </div>
  `).join('');

  // Category breakdown
  const cats = ['personal','work','health','study','creative','other'];
  const catCounts = cats.map(c => ({ cat: c, count: tasks.filter(t => t.cat === c).length })).filter(x => x.count > 0);
  const catDiv = document.getElementById('catBreakdown');
  if (catDiv) catDiv.innerHTML = catCounts.map(x => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span class="task-cat cat-${x.cat}" style="min-width:90px">${catLabel(x.cat)}</span>
      <div style="flex:1;background:rgba(200,180,200,0.2);border-radius:8px;height:8px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#FFB3D1,#A8DEFF);border-radius:8px;height:100%;width:${tasks.length?x.count/tasks.length*100:0}%;transition:width 0.6s"></div>
      </div>
      <span style="font-size:0.78rem;color:var(--text-muted);min-width:20px">${x.count}</span>
    </div>
  `).join('') || '<div style="color:var(--text-muted);font-size:0.88rem;text-align:center;padding:20px">Add tasks to see your breakdown 🌸</div>';
}

// ======================== HABITS ========================
function renderHabits() {
  const list = document.getElementById('habitList');
  if (!list) return;
  const days = ['S','M','T','W','T','F','S'];
  list.innerHTML = habits.map(h => `
    <div class="habit-item" onclick="toggleHabit(${h.id})">
      <span class="habit-check">${h.done[6] ? '✅' : '⬜'}</span>
      <div class="habit-name">${h.emoji} ${h.name}</div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
        <span class="habit-streak">🔥 ${h.streak} days</span>
        <div class="habit-dots">${h.done.map((d,i) => `<div class="habit-dot ${d?'done':''}" title="${days[i]}"></div>`).join('')}</div>
      </div>
    </div>
  `).join('');
}
function toggleHabit(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  h.done[6] = !h.done[6];
  h.streak = h.done[6] ? h.streak + 1 : Math.max(0, h.streak - 1);
  saveHabits();
  renderHabits();
  if (h.done[6]) showToast('🌿', `Habit completed! Keep it up 🌸`);
}
function addHabit() {
  const name = prompt('New habit name:');
  if (!name) return;
  habits.push({ id: Date.now(), name: name, emoji: '✨', streak: 0, done: [false,false,false,false,false,false,false] });
  saveHabits();
  renderHabits();
}

// ======================== MOOD ========================
function setMood(m) {
  currentMood = m;
  localStorage.setItem('blossom_mood', m);
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const moods = { '😊': 'Feeling happy today!', '🌸': 'Calm and at peace.', '😌': 'Peaceful vibes.', '😤': 'Focused and driven!', '😴': 'A little tired today.', '😢': 'It\'s okay to have hard days. 🌸', '✨': 'Energized and ready!' };
  document.getElementById('moodLabel').textContent = moods[m] || '';
  showToast(m, 'Mood logged! ' + (moods[m] || ''));
}
function restoreMood() {
  if (!currentMood) return;
  document.querySelectorAll('.mood-btn').forEach(b => { if (b.textContent === currentMood) b.classList.add('active'); });
}

// ======================== QUOTE ========================
let lastQuoteIdx = -1;
function newQuote() {
  let idx;
  do { idx = Math.floor(Math.random() * quotes.length); } while (idx === lastQuoteIdx);
  lastQuoteIdx = idx;
  const q = quotes[idx];
  const el = document.getElementById('quoteText');
  const au = document.getElementById('quoteAuthor');
  if (el) { el.style.opacity = '0'; setTimeout(() => { el.textContent = q.text; el.style.opacity = '1'; el.style.transition = 'opacity 0.5s'; }, 200); }
  if (au) au.textContent = q.author;
}

// ======================== TOAST ========================
function showToast(icon, msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 400); }, 3500);
}
function showMotivation() {
  const m = motivations[Math.floor(Math.random() * motivations.length)];
  showToast(m.icon, m.msg);
}

// ======================== STARS ========================
function spawnStars() {
  const emojis = ['✨','🌟','⭐','💫','🌸','🩷'];
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'star-particle';
      el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      el.style.left = (Math.random() * 80 + 10) + 'vw';
      el.style.top = (Math.random() * 60 + 20) + 'vh';
      el.style.animationDelay = (Math.random()*0.3) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 80);
  }
}

// ======================== POMODORO ========================
let pomPhases = [
  { label: 'FOCUS SESSION', time: 25*60 },
  { label: 'SHORT BREAK', time: 5*60 },
  { label: 'FOCUS SESSION', time: 25*60 },
  { label: 'SHORT BREAK', time: 5*60 },
  { label: 'FOCUS SESSION', time: 25*60 },
  { label: 'LONG BREAK', time: 15*60 },
];
let pomPhaseIdx = 0;

function togglePomodoro() {
  if (pomRunning) {
    clearInterval(pomInterval); pomRunning = false;
    document.getElementById('pomBtn').textContent = '▶ Start';
  } else {
    pomRunning = true;
    document.getElementById('pomBtn').textContent = '⏸ Pause';
    pomInterval = setInterval(() => {
      pomSeconds--;
      if (pomSeconds <= 0) {
        clearInterval(pomInterval); pomRunning = false;
        document.getElementById('pomBtn').textContent = '▶ Start';
        pomPhaseIdx = (pomPhaseIdx + 1) % pomPhases.length;
        pomSeconds = pomPhases[pomPhaseIdx].time;
        pomSession++;
        document.getElementById('pomCount').textContent = pomSession;
        document.getElementById('pomPhase').textContent = pomPhases[pomPhaseIdx].label;
        showToast('🍅', pomPhases[pomPhaseIdx].label === 'FOCUS SESSION' ? 'Break over! Time to focus 💪' : 'Session done! Take a break 🌸');
        updatePomDisplay();
        return;
      }
      updatePomDisplay();
    }, 1000);
  }
}
function resetPomodoro() {
  clearInterval(pomInterval); pomRunning = false;
  pomPhaseIdx = 0; pomSeconds = 25*60;
  document.getElementById('pomBtn').textContent = '▶ Start';
  document.getElementById('pomPhase').textContent = pomPhases[0].label;
  updatePomDisplay();
}
function skipPomodoro() {
  clearInterval(pomInterval); pomRunning = false;
  pomPhaseIdx = (pomPhaseIdx + 1) % pomPhases.length;
  pomSeconds = pomPhases[pomPhaseIdx].time;
  document.getElementById('pomBtn').textContent = '▶ Start';
  document.getElementById('pomPhase').textContent = pomPhases[pomPhaseIdx].label;
  updatePomDisplay();
}
function updatePomDisplay() {
  const m = String(Math.floor(pomSeconds/60)).padStart(2,'0');
  const s = String(pomSeconds%60).padStart(2,'0');
  document.getElementById('pomDisplay').textContent = `${m}:${s}`;
}

// ======================== FOCUS MODE ========================
function enterFocus() {
  document.getElementById('focusOverlay').classList.add('active');
  focusSeconds = 25*60; updateFocusDisplay();
  const pending = tasks.filter(t=>!t.done);
  document.getElementById('focusTaskLabel').textContent = pending.length > 0 ? `✨ "${pending[0].title}"` : 'Stay present. You\'ve got this 🌸';
}
function exitFocus() {
  clearInterval(focusInterval); focusRunning = false;
  document.getElementById('focusOverlay').classList.remove('active');
  document.getElementById('focusPlayBtn').textContent = '▶ Start';
}
function toggleFocusTimer() {
  if (focusRunning) {
    clearInterval(focusInterval); focusRunning = false;
    document.getElementById('focusPlayBtn').textContent = '▶ Start';
  } else {
    focusRunning = true;
    document.getElementById('focusPlayBtn').textContent = '⏸ Pause';
    focusInterval = setInterval(() => {
      focusSeconds--;
      if (focusSeconds <= 0) {
        clearInterval(focusInterval); focusRunning = false;
        document.getElementById('focusPlayBtn').textContent = '▶ Start';
        exitFocus();
        showToast('🎉', 'Focus session complete! Amazing work! 🌸');
      } else updateFocusDisplay();
    }, 1000);
  }
}
function resetFocusTimer() {
  clearInterval(focusInterval); focusRunning = false;
  focusSeconds = 25*60; updateFocusDisplay();
  document.getElementById('focusPlayBtn').textContent = '▶ Start';
}
function updateFocusDisplay() {
  const m = String(Math.floor(focusSeconds/60)).padStart(2,'0');
  const s = String(focusSeconds%60).padStart(2,'0');
  document.getElementById('focusTimerDisp').textContent = `${m}:${s}`;
}

// ======================== SOUNDS ========================
let audioCtx = null;
let soundNodes = {};
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function toggleSound(type) {
  if (activeSounds[type]) {
    if (soundNodes[type]) { soundNodes[type].stop?.(); delete soundNodes[type]; }
    activeSounds[type] = false;
    document.getElementById('btn-'+type).classList.remove('playing');
  } else {
    activeSounds[type] = true;
    document.getElementById('btn-'+type).classList.add('playing');
    playNoise(type);
  }
}
function playNoise(type) {
  try {
    const ctx = getAudioCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    if (type === 'ocean') { filter.type = 'lowpass'; filter.frequency.value = 400; gain.gain.value = 0.4; }
    else if (type === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 900; gain.gain.value = 0.25; }
    else if (type === 'cafe') { filter.type = 'bandpass'; filter.frequency.value = 1200; gain.gain.value = 0.12; }
    else { filter.type = 'lowpass'; filter.frequency.value = 600; gain.gain.value = 0.15; }
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    soundNodes[type] = src;
  } catch(e) { console.log('Audio context error:', e); }
}

// ======================== CANVAS BACKGROUND ========================
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, bubbles = [], particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  // Bubbles
  for (let i = 0; i < 18; i++) {
    bubbles.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*20+6, vx: (Math.random()-0.5)*0.3, vy: -Math.random()*0.5-0.2, a: Math.random()*0.12+0.04, phase: Math.random()*Math.PI*2 });
  }
  // Stars/particles
  for (let i = 0; i < 28; i++) {
    particles.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.5, a: Math.random()*0.3+0.1, phase: Math.random()*Math.PI*2, speed: Math.random()*0.02+0.01 });
  }
  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    const night = document.body.classList.contains('night-mode');
    // Bubbles
    bubbles.forEach(b => {
      b.x += b.vx + Math.sin(frame*0.01 + b.phase)*0.2;
      b.y += b.vy;
      if (b.y < -b.r*2) { b.y = H + b.r; b.x = Math.random()*W; }
      if (b.x < -b.r) b.x = W+b.r;
      if (b.x > W+b.r) b.x = -b.r;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.strokeStyle = night ? `rgba(150,100,180,${b.a})` : `rgba(255,182,220,${b.a})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = night ? `rgba(80,40,100,${b.a*0.3})` : `rgba(255,220,240,${b.a*0.3})`;
      ctx.fill();
    });
    // Particles
    particles.forEach(p => {
      p.phase += p.speed;
      const a = p.a * (0.6 + 0.4*Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(p.phase*0.7)*8, p.y + Math.cos(p.phase*0.5)*6, p.r, 0, Math.PI*2);
      ctx.fillStyle = night ? `rgba(180,140,220,${a})` : `rgba(255,180,210,${a})`;
      ctx.fill();
    });
    // Subtle wave at bottom
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = H - 40 + Math.sin(x*0.012 + frame*0.015)*18 + Math.sin(x*0.025 + frame*0.009)*10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = night ? 'rgba(30,20,60,0.12)' : 'rgba(200,235,255,0.1)';
    ctx.fill();
    requestAnimationFrame(animate);
  }
  animate();
}

// ======================== MOTIVATIONAL POPUPS (scheduled) ========================
function scheduleMotivations() {
  // Random motivation every 15-30 minutes
  const delay = (Math.random() * 15 + 15) * 60 * 1000;
  setTimeout(() => {
    showMotivation();
    scheduleMotivations();
  }, delay);
}
setTimeout(scheduleMotivations, 5000);

// ======================== LAUNCH ========================
init();