// ============ GitHub Module ============

async function refreshGitHub() {
  await Promise.all([loadIssues(), loadPRs(), loadNotifications(), loadEvents()]);
}

async function loadIssues() {
  const container = document.getElementById("github-issues");
  try {
    const data = await API.get("/api/github/issues");
    if (data.error) {
      container.innerHTML = `<div class="empty-state"><p>${data.error}</p></div>`;
      return;
    }
    if (data.issues.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>${t("github.no_issues")}</p></div>`;
      return;
    }
    container.innerHTML = data.issues
      .slice(0, 10)
      .map(
        (i) => `
      <div class="gh-item">
        <span class="gh-dot ${i.state}"></span>
        <div>
          <a href="${i.url}" target="_blank">${escapeHtml(i.title)}</a>
          <div class="gh-repo">${i.repo} #${i.number}</div>
          <div style="margin-top:2px">${i.labels.map((l) => `<span class="gh-label">${escapeHtml(l)}</span>`).join("")}</div>
        </div>
      </div>`
      )
      .join("");
  } catch {
    container.innerHTML = `<div class="empty-state"><p>${t("github.load_fail_issues")}</p></div>`;
  }
}

async function loadPRs() {
  const container = document.getElementById("github-pulls");
  try {
    const data = await API.get("/api/github/pulls");
    if (data.error) {
      container.innerHTML = `<div class="empty-state"><p>${data.error}</p></div>`;
      return;
    }
    if (data.pulls.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>${t("github.no_prs")}</p></div>`;
      return;
    }
    container.innerHTML = data.pulls
      .slice(0, 10)
      .map(
        (pr) => `
      <div class="gh-item">
        <span class="gh-dot ${pr.state}"></span>
        <div>
          <a href="${pr.url}" target="_blank">${escapeHtml(pr.title)}</a>
          <div class="gh-repo">${pr.repo} #${pr.number}</div>
        </div>
      </div>`
      )
      .join("");
  } catch {
    container.innerHTML = `<div class="empty-state"><p>${t("github.load_fail_prs")}</p></div>`;
  }
}

async function loadNotifications() {
  const container = document.getElementById("github-notifications");
  try {
    const data = await API.get("/api/github/notifications");
    if (data.error) {
      container.innerHTML = `<div class="empty-state"><p>${data.error}</p></div>`;
      return;
    }
    if (data.notifications.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>${t("github.no_notifications")}</p></div>`;
      return;
    }
    container.innerHTML = data.notifications
      .slice(0, 10)
      .map(
        (n) => `
      <div class="gh-item">
        <span class="gh-notif-icon">&#x1F514;</span>
        <div>
          <a href="${n.url}" target="_blank">${escapeHtml(n.title)}</a>
          <div class="gh-repo">${n.repo} · ${n.reason}</div>
        </div>
      </div>`
      )
      .join("");
  } catch {
    container.innerHTML = `<div class="empty-state"><p>${t("github.load_fail_notifs")}</p></div>`;
  }
}

async function loadEvents() {
  const container = document.getElementById("github-events");
  try {
    const data = await API.get("/api/github/events");
    if (data.error) {
      container.innerHTML = `<div class="empty-state"><p>${data.error}</p></div>`;
      return;
    }
    if (data.events.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>${t("github.no_events")}</p></div>`;
      return;
    }
    container.innerHTML = data.events
      .slice(0, 10)
      .map(
        (e) => `
      <div class="gh-item">
        <span class="gh-dot event"></span>
        <div>
          <div class="gh-event-text">${escapeHtml(e.payload)}</div>
          <div class="gh-repo">${e.repo} · ${timeAgo(e.created_at)}</div>
        </div>
      </div>`
      )
      .join("");
  } catch {
    container.innerHTML = `<div class="empty-state"><p>${t("github.load_fail_events")}</p></div>`;
  }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t("github.time_just_now");
  if (diff < 3600) return t("github.time_min_ago", { n: Math.floor(diff / 60) });
  if (diff < 86400) return t("github.time_hour_ago", { n: Math.floor(diff / 3600) });
  return t("github.time_day_ago", { n: Math.floor(diff / 86400) });
}
