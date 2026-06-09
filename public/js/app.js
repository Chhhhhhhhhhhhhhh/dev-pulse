// ============ App Core: Navigation & Dashboard ============

const API = {
  async get(url) {
    const res = await fetch(url);
    return res.json();
  },
  async post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async put(url, body) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async del(url) {
    await fetch(url, { method: "DELETE" });
  },
};

// Toast
function showToast(msg, duration = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), duration);
}

// Navigation
document.querySelectorAll(".topnav-link").forEach((link) => {
  link.addEventListener("click", () => {
    const page = link.dataset.page;
    const current = document.querySelector(".page.active");
    const next = document.getElementById(`page-${page}`);
    if (!next || current === next) return;

    // Switch pages
    if (current) current.classList.remove("active");
    next.classList.add("active");

    // Update nav active state
    document.querySelectorAll(".topnav-link").forEach((l) => l.classList.remove("active"));
    link.classList.add("active");

    // Refresh target page
    if (page === "dashboard") refreshDashboard();
    if (page === "focus") refreshFocus();
    if (page === "tasks") refreshTasks();
    if (page === "github") refreshGitHub();
    if (page === "settings") refreshSettings();
  });
});

// Greeting
function updateGreeting() {
  const h = new Date().getHours();
  const key = h < 12 ? "greeting.morning" : h < 18 ? "greeting.afternoon" : "greeting.evening";
  document.getElementById("greeting").textContent = t(key);
}

function updateDate() {
  const now = new Date();
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.getElementById("current-date").textContent = now.toLocaleDateString(
    I18N.current === "zh" ? "zh-CN" : "en-US", opts
  );
}

// ============ Dashboard ============

async function refreshDashboard() {
  const data = await API.get("/api/dashboard");

  // Focus ring
  const focus = data.focus;
  animateValue("focus-minutes", focus.focusMinutes);
  animateValue("sessions-done", focus.sessions.length);
  animateValue("goal-percent", focus.progress + "%");

  const circle = document.getElementById("focus-circle");
  const circumference = 477.5;
  const offset = circumference - (focus.progress / 100) * circumference;
  circle.setAttribute("stroke-dashoffset", offset);

  // Topnav right stats
  const tnFocus = document.getElementById("tn-focus");
  const tnTasks = document.getElementById("tn-tasks");
  const tnSessions = document.getElementById("tn-sessions");
  const tasks = data.tasks;
  if (tnFocus) tnFocus.textContent = focus.focusMinutes + "m";
  if (tnTasks) tnTasks.textContent = tasks.todo + tasks.inProgress;
  if (tnSessions) tnSessions.textContent = focus.sessions.length;

  // Daily summary message
  try {
    const detailed = await API.get("/api/summary/today/detailed");
    const msgDiv = document.getElementById("daily-summary-msg");
    if (msgDiv && detailed.message) {
      msgDiv.innerHTML = detailed.message;
      msgDiv.style.display = "block";
    }
  } catch (e) {}

  // Streak
  try {
    const streak = data.streak;
    const sEl = document.getElementById("streak-info");
    if (sEl && streak) {
      sEl.textContent = `🔥 ${streak.current} days · ${streak.thisWeek}/7 this week`;
    }
  } catch (e) {}

  // Tag stats
  try {
    const tagStats = data.tagStats;
    const donutEl = document.getElementById("tag-donut");
    if (tagStats && tagStats.length > 0) {
      renderTagPills(tagStats);
      renderTagDonut(tagStats);
    } else if (donutEl) {
      donutEl.innerHTML = "";
    }
  } catch (e) {}

  // Task badge in nav
  animateValue("tasks-completed", tasks.done);
  document.getElementById("task-badge").textContent = tasks.todo + tasks.inProgress;
  document.getElementById("task-badge").style.display =
    tasks.todo + tasks.inProgress > 0 ? "inline-flex" : "none";

  // Priority tasks for dashboard
  const taskData = await API.get("/api/tasks?status=todo");
  const container = document.getElementById("dashboard-tasks");
  if (taskData.tasks.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${t("dashboard.all_clear")}</p></div>`;
  } else {
    const priorityLabels = {
      low: t("tasks.priority.low"),
      medium: t("tasks.priority.medium"),
      high: t("tasks.priority.high"),
      urgent: t("tasks.priority.urgent"),
    };
    container.innerHTML = taskData.tasks
      .slice(0, 5)
      .map(
        (task) => `
      <div class="task-item">
        <div class="task-checkbox" data-id="${task.id}" onclick="toggleTask(${task.id})"></div>
        <div class="task-content">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="task-priority ${task.priority}">${priorityLabels[task.priority] || task.priority}</span>
          </div>
        </div>
      </div>`
      )
      .join("");
  }

  // Weekly chart
  const stats = await API.get("/api/focus/stats?days=7");
  const chartDiv = document.getElementById("weekly-chart");
  if (stats.length === 0 || stats.every((s) => s.focus_minutes === 0)) {
    chartDiv.innerHTML = `<div class="empty-state"><p>${t("dashboard.no_stats")}</p></div>`;
  } else {
    const maxMin = Math.max(...stats.map((s) => s.focus_minutes), 1);
    const today = new Date().toISOString().split("T")[0];
    chartDiv.innerHTML = stats
      .slice()
      .reverse()
      .map((s) => {
        const isToday = s.day === today;
        const barPct = (s.focus_minutes / maxMin) * 100;
        return `
      <div class="chart-row">
        <div class="day">${formatDay(s.day)}</div>
        <div class="bar-track">
          <div class="bar-fill${isToday ? " today" : ""}" style="width:${barPct}%"></div>
        </div>
        <div class="bar-val">${Math.round(s.focus_minutes)}m</div>
      </div>`;
      })
      .join("");
  }
}

// Count-up animation
function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const isPct = typeof target === "string" && target.endsWith("%");
  const targetNum = isPct ? parseInt(target) : parseInt(target);
  if (isNaN(targetNum)) { el.textContent = target; return; }

  const currentText = el.textContent;
  const currentNum = isPct ? parseInt(currentText) : parseInt(currentText);
  if (currentNum === targetNum && currentText === String(target)) return;

  const duration = 500;
  const startTime = performance.now();
  const startVal = isNaN(currentNum) ? 0 : currentNum;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(startVal + (targetNum - startVal) * eased);
    el.textContent = isPct ? current + "%" : String(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(step);
}

// Tag pills
function renderTagPills(tagStats) {
  const pillEl = document.getElementById("tag-pills");
  if (!pillEl) return;
  pillEl.innerHTML = tagStats.slice(0, 4).map(tag =>
    `<span class="tag-badge">${t("tag." + tag.tag) || tag.tag} ${Math.round(tag.minutes)}m</span>`
  ).join("");
}

// Tag donut chart
const TAG_COLORS = ["var(--accent)", "var(--purple)", "var(--amber)", "var(--green)", "var(--red)"];
function renderTagDonut(tagStats) {
  const donutEl = document.getElementById("tag-donut");
  if (!donutEl || !tagStats || tagStats.length === 0) {
    if (donutEl) donutEl.innerHTML = "";
    return;
  }
  const top5 = tagStats.slice(0, 5);
  const total = top5.reduce((s, tag) => s + tag.minutes, 0);
  if (total === 0) { donutEl.innerHTML = ""; return; }

  const cx = 36, cy = 36, r = 28, sw = 8;
  let cumulative = 0;
  let paths = "";
  let legend = "";

  top5.forEach((tag, i) => {
    const pct = tag.minutes / total;
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += tag.minutes;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    paths += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${TAG_COLORS[i]}" stroke-width="${sw}" stroke-linecap="round"/>`;

    legend += `<div class="tag-donut-row"><span class="tag-donut-swatch" style="background:${TAG_COLORS[i]}"></span><span class="tag-donut-label">${t("tag." + tag.tag) || tag.tag}</span><span class="tag-donut-val">${Math.round(tag.minutes)}m</span></div>`;
  });

  donutEl.innerHTML = `
    <svg class="tag-donut-svg" width="72" height="72" viewBox="0 0 72 72">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-hairline)" stroke-width="${sw}"/>
      ${paths}
    </svg>
    <div class="tag-donut-legend">${legend}</div>`;
}

// Onboarding
function checkOnboarding() {
  const dismissed = localStorage.getItem("dev-pulse-onboarded");
  if (dismissed) return;

  const banner = document.createElement("div");
  banner.className = "onboarding-banner";
  banner.id = "onboarding-banner";
  banner.innerHTML = `
    <div>
      <h3>Welcome to Dev-Pulse</h3>
      <p>Track deep work, manage tasks, and sync GitHub — all from one dashboard.</p>
      <button class="btn primary" onclick="startOnboarding()">Start a focus session</button>
    </div>
    <button class="onboarding-dismiss" onclick="dismissOnboarding()" title="Dismiss">&times;</button>`;

  const dashPage = document.getElementById("page-dashboard");
  const hero = dashPage?.querySelector(".hero");
  if (hero) hero.insertAdjacentElement("afterend", banner);
}

function startOnboarding() {
  dismissOnboarding();
  document.querySelector('[data-page="focus"]')?.click();
}

function dismissOnboarding() {
  localStorage.setItem("dev-pulse-onboarded", "1");
  const banner = document.getElementById("onboarding-banner");
  if (banner) banner.remove();
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  const daysEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysZH = ["日", "一", "二", "三", "四", "五", "六"];
  return I18N.current === "zh" ? daysZH[d.getDay()] : daysEN[d.getDay()];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Check active focus session
async function checkActiveFocus() {
  const data = await API.get("/api/focus/active");
  const badge = document.getElementById("focus-badge");
  if (badge) badge.style.display = data.active ? "inline-flex" : "none";
}

// Weekly report download
const btnWeekly = document.getElementById("btn-weekly-report");
if (btnWeekly) {
  btnWeekly.addEventListener("click", () => {
    window.open("/api/report/weekly", "_blank");
    showToast(t("report.downloaded"));
  });
}

// Init
updateGreeting();
updateDate();
refreshDashboard();
checkActiveFocus();
checkOnboarding();

// Auto-refresh dashboard every 30s when visible
setInterval(() => {
  if (!document.hidden) {
    const dashPage = document.getElementById("page-dashboard");
    if (dashPage && dashPage.classList.contains("active")) {
      refreshDashboard();
    }
  }
}, 30000);

// Refresh focus badge every 5s
setInterval(() => {
  checkActiveFocus();
}, 5000);
