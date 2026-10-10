/**
 * AI Coding Assistant - Dashboard Controller
 * Displays recent activities, stats, and quick workflows
 */

const Dashboard = {
  async init() {
    await this.loadStats();
    await this.loadRecentConversations();
  },

  async loadStats() {
    try {
      const res = await API.getDashboardStats();
      if (res && res.success) {
        const totalReq = document.getElementById('stat-total-requests');
        const savedConv = document.getElementById('stat-saved-conversations');
        const langCount = document.getElementById('stat-supported-languages');
        const avgSpeed = document.getElementById('stat-avg-speed');

        if (totalReq) totalReq.textContent = res.total_requests;
        if (savedConv) savedConv.textContent = res.saved_conversations;
        if (langCount) langCount.textContent = res.supported_languages_count;
        if (avgSpeed) avgSpeed.textContent = res.avg_response_time || '1.2s';
      }
    } catch (err) {
      console.warn('[Dashboard] Could not load stats:', err);
    }
  },

  async loadRecentConversations() {
    const listEl = document.getElementById('recent-conversations-list');
    const emptyEl = document.getElementById('recent-empty-state');
    if (!listEl) return;

    try {
      const res = await API.getConversations();
      const items = (res && res.conversations) ? res.conversations.slice(0, 5) : [];

      if (items.length === 0) {
        if (listEl) listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }

      if (emptyEl) emptyEl.style.display = 'none';
      listEl.innerHTML = items.map(item => {
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
        const taskObj = CONFIG.TASKS[item.task] || { title: item.task, icon: 'bi-code-slash' };

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2">
                <i class="bi ${taskObj.icon} text-primary"></i>
                <div class="text-truncate" style="max-width: 320px;">
                  <span class="fw-semibold text-primary-emphasis">${escapeHtml(item.title || 'Untitled')}</span>
                  <div class="small text-muted text-truncate">${escapeHtml(item.instruction || item.code || '')}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="font-mono small text-uppercase fw-semibold" style="color: var(--accent-text);">${item.language || 'python'}</span>
            </td>
            <td>
              <span class="small text-muted text-tabular">${dateStr}</span>
            </td>
            <td class="text-end">
              <a href="workspace.html?task=${item.task}&lang=${item.language}" class="btn-icon-action text-decoration-none">
                <i class="bi bi-box-arrow-up-right me-1"></i>Open
              </a>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.warn('[Dashboard] Error loading conversations:', e);
      if (listEl) listEl.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Could not load recent conversations.</td></tr>`;
    }
  }
};

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.Dashboard = Dashboard;
