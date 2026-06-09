// ============ Settings Module ============

let settingsModified = false;

function markSettingsModified() {
  if (settingsModified) return;
  settingsModified = true;
  const indicator = document.getElementById("settings-save-indicator");
  if (indicator) {
    indicator.textContent = "Unsaved changes";
    indicator.style.display = "block";
  }
}

async function refreshSettings() {
  const data = await API.get("/api/settings");
  document.getElementById("github-token").value = data.github_token_masked || "";
  document.getElementById("daily-goal").value = data.daily_goal_minutes || "240";
  document.getElementById("pomodoro-dur").value = data.pomodoro_duration || "25";

  const statusDiv = document.getElementById("github-status");
  if (data.github_username) {
    statusDiv.innerHTML = `<span style="color:var(--green)">${t("settings.connected")} <strong>${escapeHtml(data.github_username)}</strong></span>`;
  }

  updateLangPills();
  updateThemePills();
  settingsModified = false;
}

function updateLangPills() {
  const btnZh = document.getElementById("btn-lang-zh");
  const btnEn = document.getElementById("btn-lang-en");
  if (!btnZh || !btnEn) return;
  btnZh.classList.toggle("active", I18N.current === "zh");
  btnEn.classList.toggle("active", I18N.current === "en");
}

function updateThemePills() {
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const btnDark = document.getElementById("btn-theme-dark");
  const btnLight = document.getElementById("btn-theme-light");
  if (!btnDark || !btnLight) return;
  btnDark.classList.toggle("active", theme === "dark");
  btnLight.classList.toggle("active", theme === "light");
}

function setTheme(theme, showToastMsg = false) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dev-pulse-theme", theme);
  updateThemePills();
  if (showToastMsg) {
    showToast(theme === "light" ? "Switched to light theme" : "Switched to dark theme");
  }
}

// Load saved theme on startup
(function loadTheme() {
  const saved = localStorage.getItem("dev-pulse-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
})();

// Language toggle
document.getElementById("btn-lang-zh").addEventListener("click", () => {
  I18N.setLang("zh");
  updateLangPills();
  updateGreeting();
  updateDate();
  refreshDashboard();
  refreshFocus();
  refreshTasks();
  refreshSettings();
  updateTimerDisplay();
  showToast("Switched to Chinese");
});

document.getElementById("btn-lang-en").addEventListener("click", () => {
  I18N.setLang("en");
  updateLangPills();
  updateGreeting();
  updateDate();
  refreshDashboard();
  refreshFocus();
  refreshTasks();
  refreshSettings();
  updateTimerDisplay();
  showToast("Switched to English");
});

// Verify GitHub token
document.getElementById("btn-github-verify").addEventListener("click", async () => {
  const token = document.getElementById("github-token").value.trim();
  if (!token) {
    showToast(t("settings.need_token"));
    return;
  }

  await API.put("/api/settings", { github_token: token });

  const result = await API.get("/api/github/verify");
  const statusDiv = document.getElementById("github-status");

  if (result.valid) {
    statusDiv.innerHTML = `<span style="color:var(--green)">${t("settings.connected")} <strong>${escapeHtml(result.username)}</strong></span>`;
    showToast(t("settings.github_ok"));
  } else {
    statusDiv.innerHTML = `<span style="color:var(--red)">${t("settings.token_invalid")}</span>`;
    showToast(t("settings.github_bad"));
  }
});

// Save settings
document.getElementById("btn-save-settings").addEventListener("click", async () => {
  const settings = {
    daily_goal_minutes: document.getElementById("daily-goal").value,
    pomodoro_duration: document.getElementById("pomodoro-dur").value,
  };

  const token = document.getElementById("github-token").value.trim();
  if (token && token !== "..." && token.length > 6) {
    settings.github_token = token;
  }

  await API.put("/api/settings", settings);

  const indicator = document.getElementById("settings-save-indicator");
  if (indicator) {
    indicator.textContent = "Saved";
    indicator.className = "settings-save-indicator saved";
    setTimeout(() => { indicator.style.display = "none"; }, 2500);
  }

  settingsModified = false;
  showToast(t("settings.saved"));
});

// Detect unsaved changes
["daily-goal", "pomodoro-dur", "github-token"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", markSettingsModified);
    el.addEventListener("change", markSettingsModified);
  }
});

// Theme toggle buttons
const btnThemeDark = document.getElementById("btn-theme-dark");
const btnThemeLight = document.getElementById("btn-theme-light");
if (btnThemeDark) btnThemeDark.addEventListener("click", () => setTheme("dark", true));
if (btnThemeLight) btnThemeLight.addEventListener("click", () => setTheme("light", true));
