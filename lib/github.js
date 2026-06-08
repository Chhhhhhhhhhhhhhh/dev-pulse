const fetch = require("node-fetch");

class GitHubAPI {
  constructor(token = "") {
    this.token = token;
    this.base = "https://api.github.com";
  }

  _headers() {
    const h = {
      Accept: "application/vnd.github+json",
      "User-Agent": "dev-pulse/1.0",
    };
    if (this.token) {
      h.Authorization = `Bearer ${this.token}`;
    }
    return h;
  }

  async _fetch(path) {
    const res = await fetch(`${this.base}${path}`, { headers: this._headers() });
    if (!res.ok) {
      if (res.status === 401) throw new Error("GitHub: Unauthorized — check your token");
      if (res.status === 403) throw new Error("GitHub: Rate limited — add a token to increase limits");
      const body = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${body.substring(0, 200)}`);
    }
    return res.json();
  }

  /** Get assigned issues across all repos */
  async getIssues(username) {
    const q = `is:issue is:open assignee:${username} archived:false`;
    const res = await this._fetch(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=50`);
    return (res.items || []).map(item => ({
      id: `gh-${item.id}`,
      title: item.title,
      url: item.html_url,
      repo: item.repository_url.split("/repos/")[1],
      number: item.number,
      state: item.state,
      labels: item.labels.map(l => l.name),
      created_at: item.created_at,
      updated_at: item.updated_at,
      type: item.pull_request ? "pr" : "issue",
    }));
  }

  /** Get user's recent PRs (created + review requested) */
  async getPullRequests(username) {
    const q = `is:pr is:open involves:${username} archived:false`;
    const res = await this._fetch(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=30`);
    return (res.items || [])
      .filter(item => item.pull_request)
      .map(item => ({
        id: `gh-${item.id}`,
        title: item.title,
        url: item.html_url,
        repo: item.repository_url.split("/repos/")[1],
        number: item.number,
        state: item.state,
        labels: item.labels.map(l => l.name),
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "pr",
      }));
  }

  /** Get notifications */
  async getNotifications() {
    const items = await this._fetch("/notifications?per_page=30&all=false");
    return items.map(n => ({
      id: n.id,
      title: n.subject.title,
      url: n.subject.url.replace("api.github.com/repos", "github.com"),
      reason: n.reason,
      repo: n.repository.full_name,
      updated_at: n.updated_at,
    }));
  }

  /** Get user's recent activity/events */
  async getEvents(username) {
    const items = await this._fetch(`/users/${username}/events/public?per_page=30`);
    return items.map(e => ({
      id: e.id,
      type: e.type,
      repo: e.repo.name,
      created_at: e.created_at,
      payload: this._summarizeEvent(e),
    }));
  }

  _summarizeEvent(event) {
    const p = event.payload;
    switch (event.type) {
      case "PushEvent":
        return `Pushed ${p.commits?.length || 0} commits to ${p.ref?.replace("refs/heads/", "")}`;
      case "IssuesEvent":
        return `${p.action} issue #${p.issue?.number}: ${p.issue?.title}`;
      case "PullRequestEvent":
        return `${p.action} PR #${p.pull_request?.number}: ${p.pull_request?.title}`;
      case "CreateEvent":
        return `Created ${p.ref_type} ${p.ref || ""}`;
      case "WatchEvent":
        return `Starred ${event.repo.name}`;
      case "ForkEvent":
        return `Forked ${event.repo.name}`;
      case "IssueCommentEvent":
        return `Commented on ${event.repo.name}#${p.issue?.number}`;
      case "PullRequestReviewEvent":
        return `Reviewed PR in ${event.repo.name}`;
      default:
        return event.type.replace("Event", "");
    }
  }

  /** Verify token works */
  async verifyToken() {
    try {
      const user = await this._fetch("/user");
      return { valid: true, username: user.login, avatar: user.avatar_url };
    } catch {
      return { valid: false, username: "", avatar: "" };
    }
  }
}

module.exports = GitHubAPI;
