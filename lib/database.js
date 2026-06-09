const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, ".data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "dev-pulse.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      session_type TEXT DEFAULT 'pomodoro',
      completed INTEGER DEFAULT 0,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      source TEXT DEFAULT 'local',
      source_id TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      repo TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      focus_minutes INTEGER DEFAULT 0,
      sessions_completed INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('pomodoro_duration', '25'),
      ('short_break_duration', '5'),
      ('long_break_duration', '15'),
      ('long_break_interval', '4'),
      ('daily_goal_minutes', '240'),
      ('github_token', ''),
      ('github_username', ''),
      ('theme', 'dark');
  `);

  // Migrations
  try { db.exec("ALTER TABLE focus_sessions ADD COLUMN tag TEXT DEFAULT ''"); } catch (e) {}
  try { db.exec("ALTER TABLE focus_sessions ADD COLUMN task_id INTEGER DEFAULT 0"); } catch (e) {}

  // Auto-close zombie sessions
  const zombies = db.prepare("SELECT id FROM focus_sessions WHERE ended_at IS NULL").all();
  if (zombies.length > 0) {
    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    db.prepare("UPDATE focus_sessions SET ended_at = ?, completed = 0, notes = 'Auto-closed: server restart' WHERE ended_at IS NULL").run(now);
    console.log(`[DB] Auto-closed ${zombies.length} zombie session(s)`);
  }

  console.log("[DB] Initialized at", DB_PATH);
}

// ---- Focus Sessions ----

function startFocusSession(type = "pomodoro", tag = "", taskId = 0) {
  const stmt = db.prepare(
    "INSERT INTO focus_sessions (started_at, session_type, tag, task_id) VALUES (datetime('now','localtime'), ?, ?, ?)"
  );
  const result = stmt.run(type, tag, taskId);
  return { id: result.lastInsertRowid };
}

function endFocusSession(id, completed = true, notes = "") {
  const stmt = db.prepare(`
    UPDATE focus_sessions
    SET ended_at = datetime('now','localtime'),
        duration_seconds = CAST((julianday('now','localtime') - julianday(started_at)) * 86400 AS INTEGER),
        completed = ?,
        notes = ?
    WHERE id = ?
  `);
  stmt.run(completed ? 1 : 0, notes, id);
  return getFocusSession(id);
}

function getFocusSession(id) {
  return db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(id);
}

function getTodaySessions() {
  return db.prepare(`
    SELECT * FROM focus_sessions
    WHERE date(started_at) = date('now','localtime')
    ORDER BY started_at DESC
  `).all();
}

function deleteFocusSession(id) {
  db.prepare("DELETE FROM focus_sessions WHERE id = ?").run(id);
}

function getFocusStats(days = 7) {
  return db.prepare(`
    SELECT
      date(started_at) as day,
      COUNT(*) as sessions,
      SUM(CASE WHEN completed = 1 THEN duration_seconds ELSE 0 END) / 60.0 as focus_minutes,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count
    FROM focus_sessions
    WHERE started_at >= datetime('now','localtime', '-' || ? || ' days')
    GROUP BY day
    ORDER BY day DESC
  `).all(days);
}

function getTodayFocusMinutes() {
  const row = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN completed = 1 THEN duration_seconds ELSE 0 END) / 60.0, 0) as minutes
    FROM focus_sessions
    WHERE date(started_at) = date('now','localtime')
  `).get();
  return Math.round(row.minutes);
}

function getTagStats(days = 30) {
  return db.prepare(`
    SELECT
      tag,
      SUM(duration_seconds) / 60.0 as total_minutes,
      COUNT(*) as session_count
    FROM focus_sessions
    WHERE started_at >= datetime('now','localtime', '-' || ? || ' days')
      AND tag != ''
      AND completed = 1
    GROUP BY tag
    ORDER BY total_minutes DESC
  `).all(days);
}

function getStreak() {
  const days = db.prepare(`
    SELECT DISTINCT date(started_at) as day FROM focus_sessions
    WHERE completed = 1
    ORDER BY day DESC
    LIMIT 100
  `).all().map(r => r.day);

  if (days.length === 0) return { current: 0, thisWeek: 0 };

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(checkDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    if (days.includes(expectedStr)) streak++;
    else break;
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1);
  const weekDays = days.filter(d => d >= weekStart.toISOString().split("T")[0]);

  return { current: streak, thisWeek: weekDays.length };
}

function getTodayTagStats() {
  return db.prepare(`
    SELECT tag, SUM(duration_seconds) / 60.0 as minutes, COUNT(*) as count
    FROM focus_sessions
    WHERE date(started_at) = date('now','localtime') AND tag != '' AND completed = 1
    GROUP BY tag ORDER BY minutes DESC
  `).all();
}

// ---- Tasks ----

function getTasks(filter = {}) {
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (filter.status) {
    sql += " AND status = ?";
    params.push(filter.status);
  }
  if (filter.priority) {
    sql += " AND priority = ?";
    params.push(filter.priority);
  }
  if (filter.source) {
    sql += " AND source = ?";
    params.push(filter.source);
  }

  sql += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, updated_at DESC";
  return db.prepare(sql).all(...params);
}

function createTask(task) {
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, priority, source, source_id, source_url, repo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    task.title,
    task.description || "",
    task.priority || "medium",
    task.source || "local",
    task.source_id || "",
    task.source_url || "",
    task.repo || ""
  );
  return { id: result.lastInsertRowid, ...task };
}

function updateTask(id, updates) {
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (["title", "description", "status", "priority"].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = datetime('now','localtime')");
  params.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
}

function deleteTask(id) {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

function getTaskStats() {
  const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get().count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get().count;
  const todo = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'").get().count;
  return { total, done, inProgress, todo };
}

// ---- Daily Summary ----

function getTodaySummary() {
  const summary = db.prepare("SELECT * FROM daily_summaries WHERE date = date('now','localtime')").get();
  if (summary) return summary;

  const focusMin = getTodayFocusMinutes();
  const sessions = db.prepare(
    "SELECT COUNT(*) as count FROM focus_sessions WHERE date(started_at) = date('now','localtime') AND completed = 1"
  ).get().count;
  const tasksDone = db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE date(updated_at) = date('now','localtime') AND status = 'done'"
  ).get().count;

  const stmt = db.prepare(
    "INSERT INTO daily_summaries (date, focus_minutes, sessions_completed, tasks_completed) VALUES (date('now','localtime'), ?, ?, ?)"
  );
  stmt.run(focusMin, sessions, tasksDone);

  return { date: new Date().toISOString().split("T")[0], focus_minutes: focusMin, sessions_completed: sessions, tasks_completed: tasksDone };
}

// ---- Settings ----

function getSetting(key, defaultValue = "") {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : defaultValue;
}

function setSetting(key, value) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(value));
}

function getAllSettings() {
  const rows = db.prepare("SELECT * FROM settings").all();
  const obj = {};
  rows.forEach(r => (obj[r.key] = r.value));
  return obj;
}

function close() {
  db.close();
}

module.exports = {
  init, close,
  startFocusSession, endFocusSession, getFocusSession,
  getTodaySessions, deleteFocusSession, getFocusStats,
  getTodayFocusMinutes, getTagStats, getStreak, getTodayTagStats,
  getTasks, createTask, updateTask, deleteTask, getTaskStats,
  getTodaySummary,
  getSetting, setSetting, getAllSettings,
};
