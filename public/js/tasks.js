// ============ Tasks Module ============

let currentFilter = "todo";
const modal = document.getElementById("task-modal");

function showModal() { modal.classList.remove("hidden"); }
function hideModal() { modal.classList.add("hidden"); }

document.getElementById("btn-add-task").addEventListener("click", () => {
  showModal();
  document.getElementById("new-task-title").focus();
});

document.getElementById("btn-cancel-task").addEventListener("click", () => {
  hideModal();
  document.getElementById("new-task-title").value = "";
  document.getElementById("new-task-desc").value = "";
});

document.getElementById("btn-save-task").addEventListener("click", async () => {
  const title = document.getElementById("new-task-title").value.trim();
  if (!title) return;

  await API.post("/api/tasks", {
    title,
    description: document.getElementById("new-task-desc").value.trim(),
    priority: document.getElementById("new-task-priority").value,
  });

  hideModal();
  document.getElementById("new-task-title").value = "";
  document.getElementById("new-task-desc").value = "";
  showToast(t("tasks.created"));
  refreshTasks();
  refreshDashboard();
});

document.getElementById("new-task-title").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-save-task").click();
  if (e.key === "Escape") document.getElementById("btn-cancel-task").click();
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) hideModal();
});

document.querySelectorAll("#page-tasks .btn[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#page-tasks .btn[data-filter]").forEach((b) => (b.style.background = ""));
    btn.style.background = "var(--accent-bg)";
    currentFilter = btn.dataset.filter;
    refreshTasks();
  });
});

async function toggleTask(id) {
  const tasks = (await API.get("/api/tasks")).tasks;
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newStatus = task.status === "done" ? "todo" : "done";
  await API.put(`/api/tasks/${id}`, { status: newStatus });
  refreshTasks();
  refreshDashboard();
}

async function refreshTasks() {
  const filterParam = currentFilter === "all" ? "" : `?status=${currentFilter}`;
  const data = await API.get(`/api/tasks${filterParam}`);
  const container = document.getElementById("task-list");

  if (data.tasks.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${t("tasks.empty_view")}</p></div>`;
    return;
  }

  const priorityLabels = {
    low: t("tasks.priority.low"),
    medium: t("tasks.priority.medium"),
    high: t("tasks.priority.high"),
    urgent: t("tasks.priority.urgent"),
  };

  container.innerHTML = data.tasks
    .map(
      (t) => `
    <div class="task-item">
      <div class="task-checkbox ${t.status === "done" ? "checked" : ""}" data-id="${t.id}" onclick="toggleTask(${t.id})">
        ${t.status === "done" ? "OK" : ""}
      </div>
      <div class="task-content" style="flex:1">
        <div class="task-title ${t.status === "done" ? "done" : ""}">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span class="task-priority ${t.priority}">${priorityLabels[t.priority] || t.priority}</span>
          ${t.source !== "local" ? `<span class="task-source">${t.repo}#${t.source_id}</span>` : ""}
          ${t.description ? `<span class="task-source">${escapeHtml(t.description.substring(0, 60))}</span>` : ""}
        </div>
      </div>
      <div style="display:flex;gap:4px">
        ${t.status !== "done" ? `<button class="btn" style="font-size:0.7em;padding:3px 8px" onclick="startTask(${t.id})">
          ${t.status === "in_progress" ? "Pause" : "Start"}
        </button>` : ""}
        <button class="btn" style="font-size:0.7em;padding:3px 8px;color:var(--red)" onclick="deleteTask(${t.id})">&times;</button>
      </div>
    </div>`
    )
    .join("");
}

async function startTask(id) {
  const tasks = (await API.get("/api/tasks")).tasks;
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const newStatus = task.status === "in_progress" ? "todo" : "in_progress";
  await API.put(`/api/tasks/${id}`, { status: newStatus });
  refreshTasks();
}

async function deleteTask(id) {
  await API.del(`/api/tasks/${id}`);
  showToast(t("tasks.deleted"));
  refreshTasks();
  refreshDashboard();
}
