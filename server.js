const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./lib/database");
const GitHubAPI = require("./lib/github");

// Initialize database
db.init();

const app = express();
const PORT = process.env.PORT || 3855;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============ Focus Sessions ============

app.post("/api/focus/start", (req, res) => {
  const { type = "pomodoro", tag = "", taskId = 0 } = req.body;
  const session = db.startFocusSession(type, tag, taskId);
  res.json(session);
});

app.post("/api/focus/end", (req, res) => {
  const { id, completed = true, notes = "" } = req.body;
  const session = db.endFocusSession(id, completed, notes);
  res.json(session);
});

app.get("/api/focus/today", (req, res) => {
  const sessions = db.getTodaySessions();
  const minutes = db.getTodayFocusMinutes();
  const goal = parseInt(db.getSetting("daily_goal_minutes", "240"));
  res.json({ sessions, focusMinutes: minutes, goalMinutes: goal, progress: Math.min(100, Math.round((minutes / goal) * 100)) });
});

app.get("/api/focus/stats", (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const stats = db.getFocusStats(days);
  res.json(stats);
});

app.get("/api/focus/active", (req, res) => {
  const sessions = db.getTodaySessions();
  const active = sessions.find(s => !s.ended_at);
  res.json({ active: active || null });
});

app.delete("/api/focus/:id", (req, res) => {
  db.deleteFocusSession(parseInt(req.params.id));
  res.json({ success: true });
});

// ============ Tasks ============

app.get("/api/tasks", (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.source) filter.source = req.query.source;
  const tasks = db.getTasks(filter);
  const stats = db.getTaskStats();
  res.json({ tasks, stats });
});

app.post("/api/tasks", (req, res) => {
  const task = db.createTask(req.body);
  res.json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const task = db.updateTask(parseInt(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  db.deleteTask(parseInt(req.params.id));
  res.json({ success: true });
});

// ============ Daily Summary ============

app.get("/api/summary/today", (req, res) => {
  const summary = db.getTodaySummary();
  res.json(summary);
});

// ============ Settings ============

app.get("/api/settings", (req, res) => {
  const settings = db.getAllSettings();
  // Don't expose full token
  const token = settings.github_token || "";
  settings.github_token_masked = token ? token.substring(0, 6) + "..." : "";
  delete settings.github_token;
  res.json(settings);
});

app.put("/api/settings", (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    db.setSetting(key, value);
  }
  res.json({ success: true });
});

// ============ GitHub Integration ============

app.get("/api/github/verify", async (req, res) => {
  const token = db.getSetting("github_token", "");
  const gh = new GitHubAPI(token);
  const result = await gh.verifyToken();
  if (result.valid) {
    db.setSetting("github_username", result.username);
  }
  res.json(result);
});

app.get("/api/github/issues", async (req, res) => {
  try {
    const token = db.getSetting("github_token", "");
    const username = db.getSetting("github_username", "");
    if (!token || !username) return res.json({ issues: [], error: "GitHub not configured. Add your token in Settings." });

    const gh = new GitHubAPI(token);
    const issues = await gh.getIssues(username);
    res.json({ issues });
  } catch (err) {
    res.json({ issues: [], error: err.message });
  }
});

app.get("/api/github/pulls", async (req, res) => {
  try {
    const token = db.getSetting("github_token", "");
    const username = db.getSetting("github_username", "");
    if (!token || !username) return res.json({ pulls: [], error: "GitHub not configured." });

    const gh = new GitHubAPI(token);
    const pulls = await gh.getPullRequests(username);
    res.json({ pulls });
  } catch (err) {
    res.json({ pulls: [], error: err.message });
  }
});

app.get("/api/github/notifications", async (req, res) => {
  try {
    const token = db.getSetting("github_token", "");
    if (!token) return res.json({ notifications: [], error: "GitHub not configured." });

    const gh = new GitHubAPI(token);
    const notifications = await gh.getNotifications();
    res.json({ notifications });
  } catch (err) {
    res.json({ notifications: [], error: err.message });
  }
});

app.get("/api/github/events", async (req, res) => {
  try {
    const token = db.getSetting("github_token", "");
    const username = db.getSetting("github_username", "");
    if (!token || !username) return res.json({ events: [], error: "GitHub not configured." });

    const gh = new GitHubAPI(token);
    const events = await gh.getEvents(username);
    res.json({ events });
  } catch (err) {
    res.json({ events: [], error: err.message });
  }
});

// ============ Dashboard aggregation ============

app.get("/api/dashboard", async (req, res) => {
  const focusData = {
    sessions: db.getTodaySessions(),
    focusMinutes: db.getTodayFocusMinutes(),
    goalMinutes: parseInt(db.getSetting("daily_goal_minutes", "240")),
  };
  focusData.progress = Math.min(100, Math.round((focusData.focusMinutes / focusData.goalMinutes) * 100));

  const taskStats = db.getTaskStats();
  const summary = db.getTodaySummary();

  res.json({
    focus: focusData,
    tasks: taskStats,
    summary,
    streak: db.getStreak(),
    tagStats: db.getTodayTagStats(),
  });
});

// ============ Weekly Report ============

app.get("/api/report/weekly", (req, res) => {
  const stats = db.getFocusStats(7);
  const tasks = db.getTasks({ status: "done" }).filter(t => {
    const d = new Date(t.updated_at);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return d > weekAgo;
  });
  const totalFocus = stats.reduce((s, d) => s + d.focus_minutes, 0);
  const totalSessions = stats.reduce((s, d) => s + d.completed_count, 0);

  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const dateStr = d => d.toISOString().split("T")[0];

  let md = `# Dev-Pulse Weekly Report\n`;
  md += `**${dateStr(weekAgo)} → ${dateStr(now)}**\n\n`;
  md += `## Focus\n- Total: **${Math.round(totalFocus)} min** (${Math.round(totalFocus / 60)}h)\n`;
  md += `- Sessions completed: **${totalSessions}**\n`;
  if (stats.length > 0) {
    md += `- Best day: **${stats.reduce((a,b) => a.focus_minutes > b.focus_minutes ? a : b).day}**\n\n`;
  }
  md += `## Daily Breakdown\n`;
  stats.forEach(s => {
    md += `- ${s.day}: ${Math.round(s.focus_minutes)}m (${s.completed_count} sessions)\n`;
  });
  md += `\n## Tasks Completed (${tasks.length})\n`;
  tasks.slice(0, 20).forEach(t => {
    md += `- [${t.priority}] ${t.title}\n`;
  });
  if (tasks.length > 20) md += `- ... and ${tasks.length - 20} more\n`;
  md += `\n---\n_Generated by Dev-Pulse on ${now.toLocaleString()}_\n`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="dev-pulse-weekly-${dateStr(now)}.md"`);
  res.send(md);
});

// ============ Enhanced Daily Summary ============

app.get("/api/summary/today/detailed", (req, res) => {
  const sessions = db.getTodaySessions();
  const completedSessions = sessions.filter(s => s.completed);
  const taskStats = db.getTaskStats();
  const focusMin = db.getTodayFocusMinutes();

  const tagBreakdown = {};
  sessions.forEach(s => {
    if (s.tag && s.completed) {
      tagBreakdown[s.tag] = (tagBreakdown[s.tag] || 0) + s.duration_seconds;
    }
  });

  const topTags = Object.entries(tagBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, sec]) => ({ tag, minutes: Math.round(sec / 60) }));

  const message = focusMin === 0
    ? "No focus sessions yet today. Start a timer to begin tracking."
    : `**${focusMin} min** focused · **${completedSessions.length}** sessions · **${taskStats.done}** tasks done` +
      (topTags.length > 0 ? ` · Top: ${topTags.map(t => t.tag + " " + t.minutes + "m").join(", ")}` : "");

  res.json({
    focusMinutes: focusMin,
    sessionsDone: completedSessions.length,
    tasksDone: taskStats.done,
    tasksTodo: taskStats.todo + taskStats.inProgress,
    topTags,
    message,
  });
});

// ============ Start ============

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   ⚡ Dev-Pulse v1.0.0                    ║
  ║   Developer Productivity Dashboard      ║
  ║   http://localhost:${PORT}                 ║
  ╚══════════════════════════════════════════╝
  `);
});
