// ============ i18n Language System ============

const I18N = {
  current: "en",

  strings: {
    "nav.dashboard":              { en: "Dashboard",              zh: "仪表盘" },
    "nav.focus":                  { en: "Focus",                  zh: "专注" },
    "nav.tasks":                  { en: "Tasks",                  zh: "任务" },
    "nav.github":                 { en: "GitHub",                 zh: "GitHub" },
    "nav.settings":               { en: "Settings",               zh: "设置" },

    "greeting.morning":           { en: "Good morning",           zh: "早上好" },
    "greeting.afternoon":         { en: "Good afternoon",         zh: "下午好" },
    "greeting.evening":           { en: "Good evening",           zh: "晚上好" },

    "dashboard.today_focus":      { en: "Today's Focus",          zh: "今日专注" },
    "dashboard.sessions":         { en: "Sessions",               zh: "专注次数" },
    "dashboard.tasks_done":       { en: "Tasks Done",             zh: "已完成" },
    "dashboard.daily_goal":       { en: "Daily Goal",             zh: "每日目标" },
    "dashboard.priority_tasks":   { en: "Priority Tasks",         zh: "优先任务" },
    "dashboard.this_week":        { en: "This Week",              zh: "本周趋势" },
    "dashboard.empty_tasks":      { en: "No tasks yet. Start by adding one!", zh: "还没有任务，创建一个吧！" },
    "dashboard.all_clear":        { en: "All clear!",             zh: "全部完成！" },
    "dashboard.no_stats":         { en: "Start a focus session to see your stats", zh: "开始一个专注时段来查看数据" },
    "dashboard.minutes_unit":     { en: "min",                    zh: "分钟" },

    "focus.title":                { en: "Focus Mode",             zh: "专注模式" },
    "focus.subtitle":             { en: "Deep work, uninterrupted.", zh: "深度工作，不受打扰。" },
    "focus.start":                { en: "Start",                  zh: "开始" },
    "focus.resume":               { en: "Resume",                 zh: "继续" },
    "focus.pause":                { en: "Pause",                  zh: "暂停" },
    "focus.stop":                 { en: "Stop",                   zh: "停止" },
    "focus.today_sessions":       { en: "Today's Sessions",       zh: "今日记录" },
    "focus.no_sessions":          { en: "No sessions yet today",  zh: "今天还没有专注记录" },
    "focus.ongoing":              { en: "Ongoing...",             zh: "进行中..." },
    "focus.completed_toast":      { en: "OK {mode} completed!",    zh: "OK {mode} 已完成！" },
    "focus.notes_prompt":         { en: "What did you work on? (optional)", zh: "刚才做了什么？（选填）" },
    "focus.task_label":           { en: "Link Task",               zh: "关联任务" },
    "focus.stopped_early":        { en: "Stopped early",          zh: "提前结束" },
    "focus.title_done":           { en: "Session Done!",          zh: "专注完成！" },

    "timer.pomodoro":             { en: "Pomodoro",               zh: "番茄钟" },
    "timer.deep_work":            { en: "Deep Work",              zh: "深度工作" },
    "timer.short_break":          { en: "Short Break",            zh: "短休息" },
    "timer.long_break":           { en: "Long Break",             zh: "长休息" },

    "tag.none":                   { en: "No tag",                 zh: "无标签" },
    "tag.coding":                 { en: "Coding",                 zh: "写代码" },
    "tag.meeting":                { en: "Meeting",                zh: "开会" },
    "tag.learning":               { en: "Learning",               zh: "学习" },
    "tag.debugging":              { en: "Debugging",              zh: "修Bug" },
    "tag.writing":                { en: "Writing",                zh: "写文档" },
    "tag.reviewing":              { en: "Reviewing",              zh: "Code Review" },
    "tag.planning":               { en: "Planning",               zh: "规划" },
    "tag.other":                  { en: "Other",                  zh: "其他" },
    "tag.selector_label":         { en: "Tag",                    zh: "标签" },

    "notif.completed_title":      { en: "Focus Session Done!",    zh: "专注完成！" },
    "notif.completed_body":       { en: "{mode} session completed — {minutes} min of focused work.", zh: "{mode} 完成 — 专注了 {minutes} 分钟。" },
    "notif.break_title":          { en: "Break Over!",            zh: "休息结束！" },
    "notif.break_body":           { en: "Time to get back to work.", zh: "该回去工作了。" },
    "notif.permission_denied":    { en: "Notifications blocked. Enable them in browser settings.", zh: "通知被阻止。请在浏览器设置中开启。" },

    "tasks.title":                { en: "Tasks",                  zh: "任务" },
    "tasks.subtitle":             { en: "What needs your attention?", zh: "今天需要处理什么？" },
    "tasks.new":                  { en: "+ New Task",             zh: "+ 新建任务" },
    "tasks.all":                  { en: "All",                    zh: "全部" },
    "tasks.todo":                 { en: "Todo",                   zh: "待办" },
    "tasks.in_progress":          { en: "In Progress",            zh: "进行中" },
    "tasks.done":                 { en: "Done",                   zh: "已完成" },
    "tasks.empty":                { en: "No tasks yet. Create your first task!", zh: "还没有任务，创建第一个吧！" },
    "tasks.empty_view":           { en: "No tasks in this view",  zh: "当前视图没有任务" },
    "tasks.created":              { en: "Task created!",          zh: "任务已创建！" },
    "tasks.deleted":              { en: "Task deleted",           zh: "任务已删除" },
    "tasks.priority.low":         { en: "Low",                    zh: "低" },
    "tasks.priority.medium":      { en: "Medium",                 zh: "中" },
    "tasks.priority.high":        { en: "High",                   zh: "高" },
    "tasks.priority.urgent":      { en: "Urgent",                 zh: "紧急" },

    "task_modal.title":           { en: "New Task",               zh: "新建任务" },
    "task_modal.label_title":     { en: "Title",                  zh: "标题" },
    "task_modal.placeholder":     { en: "What needs to be done?", zh: "需要做什么？" },
    "task_modal.label_desc":      { en: "Description (optional)", zh: "描述（可选）" },
    "task_modal.desc_placeholder":{ en: "Brief description...",   zh: "简要描述..." },
    "task_modal.priority":        { en: "Priority",               zh: "优先级" },
    "task_modal.cancel":          { en: "Cancel",                 zh: "取消" },
    "task_modal.create":          { en: "Create Task",            zh: "创建任务" },

    "github.title":               { en: "GitHub Pulse",           zh: "GitHub 动态" },
    "github.subtitle":            { en: "Your issues, PRs, and activity at a glance.", zh: "你的 Issue、PR、动态一览。" },
    "github.issues":              { en: "Open Issues",            zh: "待处理 Issue" },
    "github.pulls":               { en: "Pull Requests",          zh: "拉取请求" },
    "github.notifications":       { en: "Notifications",          zh: "通知" },
    "github.events":              { en: "Recent Activity",        zh: "最近动态" },
    "github.connect_hint":        { en: "Connect GitHub in Settings to see your issues", zh: "在设置中连接 GitHub 以查看 Issue" },
    "github.connect_pr":          { en: "Connect GitHub to see your PRs", zh: "连接 GitHub 以查看 PR" },
    "github.connect_events":      { en: "Connect GitHub to see your activity", zh: "连接 GitHub 以查看动态" },
    "github.no_issues":           { en: "No open issues",         zh: "没有待处理 Issue" },
    "github.no_prs":              { en: "No open PRs",            zh: "没有待处理 PR" },
    "github.no_notifications":    { en: "No unread notifications", zh: "没有未读通知" },
    "github.no_events":           { en: "No recent activity",     zh: "没有最近动态" },
    "github.load_fail_issues":    { en: "Failed to load issues",  zh: "加载 Issue 失败" },
    "github.load_fail_prs":       { en: "Failed to load PRs",     zh: "加载 PR 失败" },
    "github.load_fail_notifs":    { en: "Failed to load notifications", zh: "加载通知失败" },
    "github.load_fail_events":    { en: "Failed to load events",  zh: "加载动态失败" },
    "github.time_just_now":       { en: "just now",               zh: "刚刚" },
    "github.time_min_ago":        { en: "{n}m ago",               zh: "{n} 分钟前" },
    "github.time_hour_ago":       { en: "{n}h ago",               zh: "{n} 小时前" },
    "github.time_day_ago":        { en: "{n}d ago",               zh: "{n} 天前" },

    "settings.title":             { en: "Settings",               zh: "设置" },
    "settings.subtitle":          { en: "Configure your dev-pulse experience.", zh: "自定义你的 Dev-Pulse 体验。" },
    "settings.github_integration":{ en: "GitHub Integration",     zh: "GitHub 集成" },
    "settings.token_label":       { en: "Personal Access Token",  zh: "个人访问令牌" },
    "settings.verify":            { en: "Verify & Connect",       zh: "验证并连接" },
    "settings.token_hint":        { en: "Create a token at github.com/settings/tokens with", zh: "在 github.com/settings/tokens 创建令牌，勾选" },
    "settings.focus_section":     { en: "Focus",                  zh: "专注设置" },
    "settings.daily_goal":        { en: "Daily Goal (minutes)",   zh: "每日目标（分钟）" },
    "settings.pomodoro_dur":      { en: "Pomodoro Duration (minutes)", zh: "番茄钟时长（分钟）" },
    "settings.save":              { en: "Save Settings",          zh: "保存设置" },
    "settings.connected":         { en: "Connected as",        zh: "已连接：" },
    "settings.token_invalid":     { en: "Invalid token. Check your token and try again.", zh: "令牌无效，请检查后重试。" },
    "settings.github_ok":         { en: "GitHub connected successfully!", zh: "GitHub 连接成功！" },
    "settings.github_bad":        { en: "Invalid GitHub token",   zh: "GitHub 令牌无效" },
    "settings.need_token":        { en: "Please enter a GitHub token", zh: "请输入 GitHub 令牌" },
    "settings.saved":             { en: "Settings saved!",        zh: "设置已保存！" },
    "settings.language":          { en: "Language",               zh: "界面语言" },
    "settings.lang_en":           { en: "English",                zh: "英文" },
    "settings.lang_zh":           { en: "中文",                   zh: "中文" },
    "settings.lang_hint":         { en: "Switch UI language.",    zh: "切换界面显示语言。" },
    "settings.theme":             { en: "Theme",                  zh: "主题" },
    "settings.theme_dark":        { en: "Dark",                   zh: "深色" },
    "settings.theme_light":       { en: "Light",                  zh: "浅色" },
    "settings.theme_hint":        { en: "Dark or light appearance.", zh: "深色或浅色外观。" },

    "report.weekly":              { en: "Export Weekly Report", zh: "导出周报" },
    "report.downloaded":          { en: "Report downloaded!",     zh: "周报已下载！" },

    "title.default":              { en: "Dev-Pulse | Developer Productivity Dashboard", zh: "Dev-Pulse | 开发者生产力仪表盘" },
    "title.focus_done":           { en: "Session Done! - Dev-Pulse", zh: "专注完成！- Dev-Pulse" },
  },

  t(key, params) {
    const entry = this.strings[key];
    if (!entry) return key;
    let text = entry[this.current] || entry["en"] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  },

  setLang(lang, save = true) {
    this.current = lang;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    this._applyDOM();
    if (save) {
      localStorage.setItem("dev-pulse-lang", lang);
    }
  },

  load() {
    const saved = localStorage.getItem("dev-pulse-lang");
    if (saved === "en" || saved === "zh") {
      this.current = saved;
    }
    document.documentElement.lang = this.current === "zh" ? "zh-CN" : "en";
    this._applyDOM();
  },

  _applyDOM() {
    document.title = this.t("title.default");

    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });

    document.querySelectorAll("[data-i18n-label]").forEach(el => {
      const label = el.querySelector("label");
      if (label) label.textContent = this.t(el.getAttribute("data-i18n-label"));
    });
  }
};

function t(key, params) {
  return I18N.t(key, params);
}

I18N.load();
