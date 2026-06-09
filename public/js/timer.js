// ============ Pomodoro Timer ============

let timerState = {
  mode: "pomodoro",
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  intervalId: null,
  sessionId: null,
  tag: "",
  taskId: 0,
};

const timerDisplay = document.getElementById("timer-display");
const timerLabel = document.getElementById("timer-label");
const timerProgress = document.getElementById("timer-progress");
const btnStart = document.getElementById("btn-timer-start");
const btnPause = document.getElementById("btn-timer-pause");
const btnStop = document.getElementById("btn-timer-stop");

const MODE_KEYS = {
  pomodoro: "timer.pomodoro",
  deep_work: "timer.deep_work",
  short_break: "timer.short_break",
  long_break: "timer.long_break",
};

// ============ Audio Cue ============
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
  } catch (e) { /* Audio not supported */ }
}

// ============ Desktop Notifications ============
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function notify(titleKey, bodyKey, params = {}) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(t(titleKey, params), { body: t(bodyKey, params), icon: "⚡" });
}

document.addEventListener("click", () => requestNotificationPermission(), { once: true });

// ============ Keyboard Shortcuts ============
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    if (timerState.running) btnPause.click();
    else btnStart.click();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    if (timerState.running || timerState.sessionId) btnStop.click();
  }
});

// ============ Tag & Task Selectors ============
document.querySelectorAll(".tag-opt").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".tag-opt").forEach((t) => t.classList.remove("active"));
    el.classList.add("active");
    timerState.tag = el.dataset.tag;
  });
});

const taskSelect = document.getElementById("focus-task-select");
async function refreshTaskSelector() {
  if (!taskSelect) return;
  const data = await API.get("/api/tasks?status=todo");
  const tasks = data.tasks || [];
  taskSelect.innerHTML = '<option value="0">-- ' + t("tag.none") + ' --</option>';
  tasks.forEach(task => {
    taskSelect.innerHTML += `<option value="${task.id}">${escapeHtml(task.title.substring(0, 40))}</option>`;
  });
}

// ============ Timer Logic ============
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerState.remaining);
  timerLabel.textContent = t(MODE_KEYS[timerState.mode]);
  const circumference = 565.5;
  const progress = 1 - timerState.remaining / timerState.duration;
  timerProgress.setAttribute("stroke-dashoffset", circumference * (1 - progress));
  if (timerState.mode.includes("break")) timerProgress.classList.add("break");
  else timerProgress.classList.remove("break");
}

function setMode(mode, durationMinutes) {
  timerState.mode = mode;
  timerState.duration = durationMinutes * 60;
  timerState.remaining = timerState.duration;
  updateTimerDisplay();
}

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    setMode(btn.dataset.mode, parseInt(btn.dataset.duration));
  });
});

btnStart.addEventListener("click", async () => {
  if (timerState.running) return;
  requestNotificationPermission();
  refreshTaskSelector();

  const taskId = taskSelect ? parseInt(taskSelect.value) || 0 : 0;
  timerState.taskId = taskId;

  const session = await API.post("/api/focus/start", {
    type: timerState.mode,
    tag: timerState.tag,
    taskId: timerState.taskId,
  });
  timerState.sessionId = session.id;
  timerState.running = true;

  btnStart.disabled = true;
  btnPause.disabled = false;
  btnStop.disabled = false;
  document.getElementById("focus-badge").style.display = "inline";
  if (taskSelect) taskSelect.disabled = true;

  timerState.intervalId = setInterval(() => {
    timerState.remaining--;
    updateTimerDisplay();
    if (timerState.remaining <= 0) completeSession();
  }, 1000);
});

btnPause.addEventListener("click", () => {
  if (!timerState.running) return;
  clearInterval(timerState.intervalId);
  timerState.running = false;

  timerProgress.classList.add("paused");

  btnStart.disabled = false;
  btnStart.textContent = `▶ ${t("focus.resume")}`;
  btnPause.disabled = true;
});

btnStop.addEventListener("click", async () => {
  clearInterval(timerState.intervalId);
  timerState.running = false;
  if (timerState.sessionId) {
    await API.post("/api/focus/end", { id: timerState.sessionId, completed: false, notes: t("focus.stopped_early") });
  }
  resetTimer();
  refreshFocus();
});

async function completeSession() {
  clearInterval(timerState.intervalId);
  timerState.running = false;

  const note = prompt(t("focus.notes_prompt") || "What did you work on?", "");
  const notes = note ? note.trim() : "";

  if (timerState.sessionId) {
    await API.post("/api/focus/end", { id: timerState.sessionId, completed: true, notes });
  }

  const modeName = t(MODE_KEYS[timerState.mode]);
  const minutes = Math.round(timerState.duration / 60);
  showToast(t("focus.completed_toast", { mode: modeName }));
  playChime();
  resetTimer();
  refreshFocus();
  refreshDashboard();

  if (timerState.mode.includes("break")) {
    notify("notif.break_title", "notif.break_body");
  } else {
    notify("notif.completed_title", "notif.completed_body", { mode: modeName, minutes });
  }

  document.title = t("title.focus_done");
  setTimeout(() => (document.title = t("title.default")), 3000);
}

function resetTimer() {
  timerState.remaining = timerState.duration;
  timerState.sessionId = null;
  timerState.taskId = 0;
  btnStart.textContent = `▶ ${t("focus.start")}`;
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnStop.disabled = true;
  document.getElementById("focus-badge").style.display = "none";
  if (taskSelect) taskSelect.disabled = false;

  timerProgress.classList.remove("paused");

  updateTimerDisplay();
}

// ============ Session List ============

let sessionViewMode = "list";

async function refreshFocus() {
  const data = await API.get("/api/focus/today");
  const container = document.getElementById("session-list");
  let toggleBtn = document.getElementById("session-view-toggle");

  if (!toggleBtn) {
    const header = container.parentElement.querySelector(".section-label");
    if (header) {
      toggleBtn = document.createElement("button");
      toggleBtn.id = "session-view-toggle";
      toggleBtn.className = "btn";
      toggleBtn.style.cssText = "padding:1px 6px;font-size:.6rem;margin-left:auto;border-color:transparent;color:var(--text-tertiary)";
      toggleBtn.textContent = sessionViewMode === "timeline" ? "List" : "Timeline";
      toggleBtn.addEventListener("click", () => {
        sessionViewMode = sessionViewMode === "list" ? "timeline" : "list";
        toggleBtn.textContent = sessionViewMode === "timeline" ? "List" : "Timeline";
        refreshFocus();
      });
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.appendChild(toggleBtn);
    }
  } else {
    toggleBtn.textContent = sessionViewMode === "timeline" ? "List" : "Timeline";
  }

  if (data.sessions.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${t("focus.no_sessions")}</p></div>`;
    return;
  }

  if (sessionViewMode === "timeline") {
    renderSessionTimeline(data.sessions, container);
  } else {
    renderSessionList(data.sessions, container);
  }
}

function renderSessionList(sessions, container) {
  container.innerHTML = sessions.map((s) => `
    <div class="session-row">
      <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">
        <span class="session-dot ${s.session_type}"></span>
        <span style="white-space:nowrap">${t(MODE_KEYS[s.session_type]) || s.session_type}</span>
        ${s.tag ? `<span class="session-tag">${t("tag." + s.tag) || s.tag}</span>` : ""}
        ${s.notes ? `<span style="font-size:var(--fs-xs);color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px">${escapeHtml(s.notes)}</span>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span style="color:var(--text-tertiary);font-size:var(--fs-xs);white-space:nowrap">
          ${s.ended_at ? (s.completed ? `${Math.round(s.duration_seconds / 60)}m OK` : `${Math.round(s.duration_seconds / 60)}m x`) : `<span class="pulse">● ${t("focus.ongoing")}</span>`}
        </span>
        <button class="btn" style="padding:1px 5px;font-size:.6rem;border-color:transparent;color:var(--text-disabled)" onclick="event.stopPropagation();deleteSession(${s.id})" title="Delete">&times;</button>
      </div>
    </div>`).join("");
}

function renderSessionTimeline(sessions, container) {
  const startOfDay = (s) => {
    const d = new Date(s.started_at);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };

  container.innerHTML = `<div class="timeline">` + sessions.map((s) => `
    <div class="timeline-item">
      <span class="timeline-dot${s.session_type.includes("break") ? " break" : ""} ${s.session_type}"></span>
      <span class="timeline-time">${startOfDay(s)}</span>
      <span class="timeline-mode">${t(MODE_KEYS[s.session_type]) || s.session_type}</span>
      ${s.ended_at ? `<span class="timeline-duration">${Math.round(s.duration_seconds / 60)}m ${s.completed ? "OK" : "x"}</span>` : `<span class="pulse">● ${t("focus.ongoing")}</span>`}
      ${s.tag ? `<span class="timeline-tag">${t("tag." + s.tag) || s.tag}</span>` : ""}
      ${s.notes ? `<div class="timeline-notes">${escapeHtml(s.notes)}</div>` : ""}
      <button class="btn" style="padding:0 4px;font-size:.55rem;border-color:transparent;color:var(--text-disabled);margin-left:var(--sp-2)" onclick="event.stopPropagation();deleteSession(${s.id})" title="Delete">&times;</button>
    </div>`).join("") + `</div>`;
}

async function deleteSession(id) {
  await API.del(`/api/focus/${id}`);
  refreshFocus();
  refreshDashboard();
}

updateTimerDisplay();
refreshFocus();
