/* =====================================================
   SMART CALENDAR & TIME MANAGER — script.js
   Modules: Calendar, Alarm, Countdown Timer, Stopwatch
   ===================================================== */

'use strict';

/* ── INDIAN HOLIDAYS (fixed dates; approximated for moveable feasts) ── */
const INDIAN_HOLIDAYS = {
  '01-26': 'Republic Day',
  '03-25': 'Holi',        // approximate
  '03-29': 'Good Friday', // approximate
  '04-14': 'Ambedkar Jayanti',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '10-12': 'Dussehra',    // approximate
  '10-31': 'Diwali',      // approximate
  '12-25': 'Christmas',
};

/* ── AUDIO HELPERS ── */
function createBeepAudio() {
  // Returns an AudioContext-based beep via oscillator (no file needed)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  return {
    play(loop = false) {
      this.stop();
      this._running = true;
      const play1 = () => {
        if (!this._running) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        if (loop) this._timer = setTimeout(play1, 1000);
      };
      play1();
    },
    stop() {
      this._running = false;
      clearTimeout(this._timer);
    }
  };
}

const alarmBeep = createBeepAudio();
const notifBeep = createBeepAudio();

/* ══════════════════════════════════════
   MODULE: CALENDAR
   ══════════════════════════════════════ */
const Calendar = (() => {

  let currentDate = new Date();
  let selectedDate = null;
  let showHolidays = true;
  let editingEventId = null;

  // ── Load / Save events ──
  function loadEvents() {
    return JSON.parse(localStorage.getItem('chrono_events') || '[]');
  }
  function saveEvents(events) {
    localStorage.setItem('chrono_events', JSON.stringify(events));
  }

  // ── Date key: YYYY-MM-DD ──
  function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  function holidayKey(m, d) {
    return `${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  // ── Render calendar grid ──
  function render() {
    const grid = document.getElementById('calGrid');
    const label = document.getElementById('monthLabel');
    const events = loadEvents();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    label.textContent = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    grid.innerHTML = '';

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      grid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'cal-day';

      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      if (isToday) el.classList.add('today');

      const key = dateKey(year, month, day);
      if (selectedDate === key) el.classList.add('selected');

      // Holiday check
      const hKey = holidayKey(month, day);
      const holidayName = INDIAN_HOLIDAYS[hKey];
      if (holidayName && showHolidays) {
        el.classList.add('holiday');
        el.title = holidayName;
        const hl = document.createElement('div');
        hl.className = 'holiday-label';
        hl.textContent = holidayName;
        el.appendChild(hl);
      }

      const dayNum = document.createElement('div');
      dayNum.className = 'day-num';
      dayNum.textContent = day;
      el.insertBefore(dayNum, el.firstChild);

      // Event dots
      const dayEvents = events.filter(e => e.date === key);
      if (dayEvents.length) {
        const dots = document.createElement('div');
        dots.className = 'day-dots';
        dayEvents.slice(0, 4).forEach(ev => {
          const dot = document.createElement('div');
          dot.className = 'event-dot';
          dot.style.background = ev.color || 'var(--primary)';
          dots.appendChild(dot);
        });
        el.appendChild(dots);
      }

      el.addEventListener('click', () => selectDate(key, day));
      grid.appendChild(el);
    }

    renderStats(year, month, events);
  }

  function selectDate(key, day) {
    selectedDate = key;
    render();
    const parts = key.split('-');
    const display = new Date(+parts[0], +parts[1]-1, +parts[2]).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('sidePanelDate').textContent = display;
    document.getElementById('evDate').value = key;
    renderEventsList();
  }

  // ── Events list (side panel) ──
  function renderEventsList() {
    const list = document.getElementById('eventsList');
    if (!selectedDate) return;
    const events = loadEvents().filter(e => e.date === selectedDate);
    list.innerHTML = '';
    if (!events.length) {
      list.innerHTML = '<p class="empty-state">No events on this date.</p>';
      return;
    }
    events.forEach(ev => list.appendChild(buildEventCard(ev)));
  }

  function buildEventCard(ev) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.style.borderLeftColor = ev.color || 'var(--primary)';

    const catLabels = { work: '💼 Work', personal: '🏠 Personal', birthday: '🎂 Birthday', other: '📌 Other' };

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="event-card-title">${escHtml(ev.title)}</span>
        <span class="event-category-badge">${catLabels[ev.category] || '📌 Other'}</span>
      </div>
      ${ev.time ? `<div class="event-card-time">⏰ ${ev.time}</div>` : ''}
      ${ev.description ? `<div class="event-card-desc">${escHtml(ev.description)}</div>` : ''}
      ${ev.recurring !== 'none' ? `<div class="event-card-time">🔁 ${ev.recurring}</div>` : ''}
      <div class="event-card-actions">
        <button class="event-action-btn edit-btn">✏️ Edit</button>
        <button class="event-action-btn delete delete-btn">🗑 Delete</button>
      </div>
    `;
    card.querySelector('.edit-btn').addEventListener('click', () => openModal(ev));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteEvent(ev.id));
    return card;
  }

  // ── Modal ──
  function openModal(ev = null) {
    editingEventId = ev ? ev.id : null;
    document.getElementById('modalTitle').textContent = ev ? 'Edit Event' : 'Add Event';
    document.getElementById('evTitle').value = ev ? ev.title : '';
    document.getElementById('evDescription').value = ev ? ev.description : '';
    document.getElementById('evDate').value = ev ? ev.date : (selectedDate || '');
    document.getElementById('evTime').value = ev ? ev.time : '';
    document.getElementById('evCategory').value = ev ? ev.category : 'work';
    document.getElementById('evColor').value = ev ? ev.color : '#2563eb';
    document.getElementById('evRecurring').value = ev ? ev.recurring : 'none';
    document.getElementById('modalOverlay').hidden = false;
  }

  function closeModal() {
    document.getElementById('modalOverlay').hidden = true;
    editingEventId = null;
  }

  function saveEventFromModal() {
    const title = document.getElementById('evTitle').value.trim();
    const date = document.getElementById('evDate').value;
    if (!title || !date) { alert('Title and Date are required.'); return; }

    const events = loadEvents();
    const newEv = {
      id: editingEventId || Date.now().toString(),
      title,
      description: document.getElementById('evDescription').value.trim(),
      date,
      time: document.getElementById('evTime').value,
      category: document.getElementById('evCategory').value,
      color: document.getElementById('evColor').value,
      recurring: document.getElementById('evRecurring').value,
    };

    if (editingEventId) {
      const idx = events.findIndex(e => e.id === editingEventId);
      if (idx !== -1) events[idx] = newEv;
    } else {
      events.push(newEv);
    }
    saveEvents(events);
    closeModal();
    render();
    if (selectedDate === date) renderEventsList();
    scheduleNotification(newEv);
  }

  function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    const events = loadEvents().filter(e => e.id !== id);
    saveEvents(events);
    render();
    renderEventsList();
  }

  // ── Notifications ──
  function scheduleNotification(ev) {
    if (!ev.time || !ev.date) return;
    const dt = new Date(`${ev.date}T${ev.time}`);
    const diff = dt - Date.now();
    if (diff <= 0) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification(`📅 ${ev.title}`, { body: ev.description || ev.date });
        notifBeep.play(false);
      }, diff);
    }
  }

  function rescheduleAll() {
    loadEvents().forEach(scheduleNotification);
  }

  // ── Search ──
  function handleSearch(query) {
    const sr = document.getElementById('searchResults');
    const el = document.getElementById('eventsList');
    if (!query) { sr.hidden = true; el.style.display = ''; return; }
    sr.hidden = false;
    el.style.display = 'none';
    const q = query.toLowerCase();
    const results = loadEvents().filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
    sr.innerHTML = `<p class="empty-state" style="margin-bottom:8px">🔍 ${results.length} result(s)</p>`;
    if (results.length) results.forEach(e => sr.appendChild(buildEventCard(e)));
  }

  // ── Export / Import ──
  function exportEvents() {
    const data = JSON.stringify(loadEvents(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'chrono_events.json' });
    a.click();
  }

  function importEvents(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error();
        const existing = loadEvents();
        const merged = [...existing, ...data.filter(d => !existing.find(ex => ex.id === d.id))];
        saveEvents(merged);
        render(); renderEventsList();
        alert(`Imported ${data.length} events.`);
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  }

  // ── Stats ──
  function renderStats(year, month, events) {
    const stats = document.getElementById('calStats');
    const monthEvents = events.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const cats = {};
    monthEvents.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
    const catStr = Object.entries(cats).map(([k, v]) => `${k}: <span>${v}</span>`).join(' · ');
    stats.innerHTML = `
      <div class="stat-chip">Events this month: <span>${monthEvents.length}</span></div>
      ${catStr ? `<div class="stat-chip">${catStr}</div>` : ''}
    `;
  }

  // ── Notification check loop (every 30s) ──
  function startNotifLoop() {
    setInterval(() => {
      const now = new Date();
      const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
      const timeStr = now.toTimeString().slice(0, 5);
      loadEvents().forEach(ev => {
        if (ev.date === todayKey && ev.time === timeStr) {
          notifBeep.play(false);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`📅 ${ev.title}`, { body: ev.description || '' });
          }
        }
      });
    }, 30000);
  }

  function init() {
    if ('Notification' in window) Notification.requestPermission();

    document.getElementById('prevMonth').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1); render();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1); render();
    });
    document.getElementById('addEventBtn').addEventListener('click', () => openModal());
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', saveEventFromModal);
    document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

    document.getElementById('searchInput').addEventListener('input', e => handleSearch(e.target.value));
    document.getElementById('exportBtn').addEventListener('click', exportEvents);
    document.getElementById('importFile').addEventListener('change', e => {
      if (e.target.files[0]) importEvents(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('holidayToggle').addEventListener('click', () => {
      showHolidays = !showHolidays;
      render();
    });
    document.getElementById('printBtn').addEventListener('click', () => window.print());

    render();
    rescheduleAll();
    startNotifLoop();
  }

  return { init };
})();

/* ══════════════════════════════════════
   MODULE: ALARM
   ══════════════════════════════════════ */
const AlarmClock = (() => {

  let ringingId = null;
  let clockInterval = null;

  function loadAlarms() { return JSON.parse(localStorage.getItem('chrono_alarms') || '[]'); }
  function saveAlarms(a) { localStorage.setItem('chrono_alarms', JSON.stringify(a)); }

  function startClock() {
    clockInterval = setInterval(() => {
      const now = new Date();
      document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('en-IN', { hour12: false });

      // Check alarms
      const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      if (s !== 0) return;
      const alarms = loadAlarms();
      alarms.forEach(al => {
        if (!al.enabled) return;
        if (al.hour === h && al.minute === m) {
          triggerAlarm(al);
        }
      });
    }, 1000);
  }

  function triggerAlarm(al) {
    ringingId = al.id;
    document.getElementById('alarmPopupLabel').textContent = al.label || 'Alarm!';
    document.getElementById('alarmOverlay').hidden = false;
    alarmBeep.play(true);
    // Highlight in list
    document.querySelectorAll('.alarm-item').forEach(el => {
      if (el.dataset.id === String(al.id)) el.classList.add('ringing');
    });
  }

  function stopAlarm() {
    alarmBeep.stop();
    document.getElementById('alarmOverlay').hidden = true;
    document.querySelectorAll('.alarm-item').forEach(el => el.classList.remove('ringing'));
    ringingId = null;
  }

  function snooze() {
    stopAlarm();
    // Re-trigger in 5 minutes
    setTimeout(() => {
      const al = loadAlarms().find(a => a.id === ringingId);
      if (al) triggerAlarm(al);
    }, 5 * 60 * 1000);
  }

  function setAlarm() {
    const h = parseInt(document.getElementById('alarmHour').value);
    const m = parseInt(document.getElementById('alarmMinute').value);
    const label = document.getElementById('alarmLabel').value.trim() || 'Alarm';
    if (isNaN(h) || isNaN(m)) { alert('Enter valid hour and minute.'); return; }

    const alarms = loadAlarms();
    alarms.push({ id: Date.now(), hour: h, minute: m, label, enabled: true });
    saveAlarms(alarms);
    renderAlarms();
  }

  function deleteAlarm(id) {
    saveAlarms(loadAlarms().filter(a => a.id !== id));
    renderAlarms();
  }

  function toggleAlarm(id, enabled) {
    const alarms = loadAlarms();
    const idx = alarms.findIndex(a => a.id === id);
    if (idx !== -1) { alarms[idx].enabled = enabled; saveAlarms(alarms); }
  }

  function renderAlarms() {
    const list = document.getElementById('alarmsList');
    const alarms = loadAlarms();
    list.innerHTML = '';
    if (!alarms.length) { list.innerHTML = '<p class="empty-state">No alarms set.</p>'; return; }
    alarms.forEach(al => {
      const pad = n => String(n).padStart(2, '0');
      const item = document.createElement('div');
      item.className = 'alarm-item';
      item.dataset.id = al.id;
      item.innerHTML = `
        <div>
          <div class="alarm-item-time">${pad(al.hour)}:${pad(al.minute)}</div>
          <div class="alarm-item-label">${escHtml(al.label)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <label class="alarm-toggle">
            <input type="checkbox" ${al.enabled ? 'checked' : ''} data-id="${al.id}" />
            <span class="alarm-toggle-slider"></span>
          </label>
          <button class="event-action-btn delete del-al">🗑</button>
        </div>
      `;
      item.querySelector('.del-al').addEventListener('click', () => deleteAlarm(al.id));
      item.querySelector('input[type=checkbox]').addEventListener('change', e => toggleAlarm(al.id, e.target.checked));
      list.appendChild(item);
    });
  }

  function init() {
    document.getElementById('setAlarmBtn').addEventListener('click', setAlarm);
    document.getElementById('stopAlarmBtn').addEventListener('click', stopAlarm);
    document.getElementById('snoozeBtn').addEventListener('click', snooze);
    startClock();
    renderAlarms();
  }

  return { init };
})();

/* ══════════════════════════════════════
   MODULE: COUNTDOWN TIMER
   ══════════════════════════════════════ */
const CountdownTimer = (() => {
  let totalSeconds = 0;
  let remaining = 0;
  let interval = null;
  let running = false;

  function fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
  }

  function updateDisplay() {
    document.getElementById('timerDisplay').textContent = fmt(remaining);
    const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 100;
    document.getElementById('timerProgress').style.width = pct + '%';
    document.getElementById('timerPct').textContent = Math.round(pct) + '%';
    const display = document.getElementById('timerDisplay');
    if (remaining <= 10 && remaining > 0 && running) display.classList.add('urgent');
    else display.classList.remove('urgent');
  }

  function start() {
    if (!running) {
      if (remaining === 0) {
        const h = parseInt(document.getElementById('timerHours').value) || 0;
        const m = parseInt(document.getElementById('timerMinutes').value) || 0;
        const s = parseInt(document.getElementById('timerSeconds').value) || 0;
        totalSeconds = h * 3600 + m * 60 + s;
        remaining = totalSeconds;
        if (!remaining) { alert('Set a time first.'); return; }
      }
      running = true;
      document.getElementById('timerInputs').hidden = true;
      document.getElementById('timerDisplay').hidden = false;
      document.getElementById('timerStartBtn').textContent = '▶ Running';
      document.getElementById('timerStartBtn').disabled = true;
      document.getElementById('timerPauseBtn').disabled = false;
      interval = setInterval(() => {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
          clearInterval(interval);
          running = false;
          document.getElementById('timerDisplay').classList.remove('urgent');
          notifBeep.play(false);
          alert('⏱ Timer finished!');
          reset();
        }
      }, 1000);
      updateDisplay();
    }
  }

  function pause() {
    if (running) {
      clearInterval(interval);
      running = false;
      document.getElementById('timerPauseBtn').textContent = '▶ Resume';
      document.getElementById('timerStartBtn').disabled = false;
      document.getElementById('timerStartBtn').textContent = '▶ Resume';
    } else {
      start();
      document.getElementById('timerPauseBtn').textContent = '⏸ Pause';
    }
  }

  function reset() {
    clearInterval(interval);
    running = false;
    remaining = 0; totalSeconds = 0;
    document.getElementById('timerDisplay').hidden = true;
    document.getElementById('timerInputs').hidden = false;
    document.getElementById('timerStartBtn').disabled = false;
    document.getElementById('timerStartBtn').textContent = '▶ Start';
    document.getElementById('timerPauseBtn').textContent = '⏸ Pause';
    document.getElementById('timerPauseBtn').disabled = true;
    document.getElementById('timerProgress').style.width = '100%';
    document.getElementById('timerPct').textContent = '100%';
  }

  function init() {
    document.getElementById('timerStartBtn').addEventListener('click', start);
    document.getElementById('timerPauseBtn').addEventListener('click', pause);
    document.getElementById('timerResetBtn').addEventListener('click', reset);
  }

  return { init };
})();

/* ══════════════════════════════════════
   MODULE: STOPWATCH
   ══════════════════════════════════════ */
const Stopwatch = (() => {
  let startTime = 0;
  let elapsed = 0;
  let interval = null;
  let running = false;
  let laps = [];

  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  function tick() {
    elapsed = Date.now() - startTime;
    document.getElementById('swDisplay').textContent = fmt(elapsed);
  }

  function start() {
    if (!running) {
      startTime = Date.now() - elapsed;
      interval = setInterval(tick, 50);
      running = true;
      document.getElementById('swStartBtn').textContent = '⏸ Pause';
      document.getElementById('swLapBtn').disabled = false;
    } else {
      clearInterval(interval);
      running = false;
      document.getElementById('swStartBtn').textContent = '▶ Resume';
    }
  }

  function lap() {
    if (!running) return;
    laps.push(elapsed);
    renderLaps();
  }

  function reset() {
    clearInterval(interval);
    running = false; elapsed = 0; laps = [];
    document.getElementById('swDisplay').textContent = '00:00:00.00';
    document.getElementById('swStartBtn').textContent = '▶ Start';
    document.getElementById('swLapBtn').disabled = true;
    renderLaps();
  }

  function renderLaps() {
    const container = document.getElementById('lapsContainer');
    container.innerHTML = '';
    if (!laps.length) { container.innerHTML = '<p class="empty-state">No laps recorded.</p>'; return; }

    // Compute fastest/slowest intervals
    const intervals = laps.map((t, i) => i === 0 ? t : t - laps[i-1]);
    const minI = intervals.indexOf(Math.min(...intervals));
    const maxI = intervals.indexOf(Math.max(...intervals));

    laps.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'lap-item';
      if (i === minI && laps.length > 1) item.classList.add('fastest');
      if (i === maxI && laps.length > 1) item.classList.add('slowest');
      const split = i === 0 ? t : t - laps[i-1];
      item.innerHTML = `<span class="lap-num">Lap ${i + 1}</span><span class="lap-time">${fmt(t)}</span><span style="color:var(--text-muted);font-size:11px">+${fmt(split)}</span>`;
      container.appendChild(item);
    });
  }

  function exportLaps() {
    if (!laps.length) { alert('No laps to export.'); return; }
    const text = laps.map((t, i) => {
      const split = i === 0 ? t : t - laps[i-1];
      return `Lap ${i + 1}: ${fmt(t)} (+${fmt(split)})`;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'laps.txt' });
    a.click();
  }

  function init() {
    document.getElementById('swStartBtn').addEventListener('click', start);
    document.getElementById('swLapBtn').addEventListener('click', lap);
    document.getElementById('swResetBtn').addEventListener('click', reset);
    document.getElementById('swExportBtn').addEventListener('click', exportLaps);
  }

  return { init };
})();

/* ══════════════════════════════════════
   LIVE CLOCK (header subtitle)
   ══════════════════════════════════════ */
function startLiveClock() {
  function update() {
    const now = new Date();
    document.getElementById('liveClock').textContent = now.toLocaleString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }
  update();
  setInterval(update, 1000);
}

/* ══════════════════════════════════════
   TAB NAVIGATION
   ══════════════════════════════════════ */
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

/* ══════════════════════════════════════
   DARK MODE
   ══════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('chrono_theme') || 'light';
  applyTheme(saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('chrono_theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ══════════════════════════════════════
   UTILITY
   ══════════════════════════════════════ */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  startLiveClock();
  Calendar.init();
  AlarmClock.init();
  CountdownTimer.init();
  Stopwatch.init();
});