/**
 * AI Coding Assistant - Conversation History Controller
 * Search, filter, inspect, and manage archived coding tasks
 */

const HistoryManager = {
  conversations: [],
  filtered: [],
  selectedConvId: null,

  async init() {
    this.bindEvents();
    await this.loadConversations();
  },

  async loadConversations() {
    const listEl = document.getElementById('history-table-body');
    const emptyEl = document.getElementById('history-empty-state');
    const loadingEl = document.getElementById('history-loading-indicator');

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';

    try {
      const res = await API.getConversations();
      this.conversations = (res && res.conversations) ? res.conversations : [];
      this.filtered = [...this.conversations];
      this.render();
    } catch (e) {
      console.error('[History] Failed to load:', e);
      UI.showToast('Could not load history from backend.', 'error');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterConversations();
      });
    }

    // Task filter select
    const taskFilter = document.getElementById('history-task-filter');
    if (taskFilter) {
      taskFilter.addEventListener('change', () => {
        this.filterConversations();
      });
    }

    // Modal Delete button
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!this.selectedConvId) return;
        try {
          await API.deleteConversation(this.selectedConvId);
          UI.showToast('Conversation deleted.', 'success');
          
          // Close modal
          const modalEl = document.getElementById('deleteConfirmModal');
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();

          // Refresh list
          await this.loadConversations();
        } catch (err) {
          UI.showToast('Failed to delete: ' + err.message, 'error');
        }
      });
    }
  },

  filterConversations() {
    const query = (document.getElementById('history-search-input')?.value || '').toLowerCase().trim();
    const task = document.getElementById('history-task-filter')?.value || 'all';

    this.filtered = this.conversations.filter(item => {
      const matchTask = task === 'all' || item.task === task;
      const matchQuery = !query || 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.instruction && item.instruction.toLowerCase().includes(query)) ||
        (item.language && item.language.toLowerCase().includes(query));
      return matchTask && matchQuery;
    });

    this.render();
  },

  render() {
    const listEl = document.getElementById('history-table-body');
    const emptyEl = document.getElementById('history-empty-state');
    const countBadge = document.getElementById('history-total-count');

    if (countBadge) countBadge.textContent = `${this.filtered.length} saved`;

    if (!listEl) return;

    if (this.filtered.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = this.filtered.map(item => {
      const dateStr = item.created_at 
        ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      const taskObj = CONFIG.TASKS[item.task] || { title: item.task, icon: 'bi-code-slash' };

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <i class="bi ${taskObj.icon} text-primary fs-5"></i>
              <div>
                <div class="fw-semibold text-primary-emphasis">${this.escapeHtml(item.title || 'Untitled Session')}</div>
                <div class="small text-muted text-truncate" style="max-width: 360px;">${this.escapeHtml(item.instruction || item.code || '')}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge" style="background-color: var(--accent-subtle); color: var(--accent-text); border: 1px solid rgba(99,102,241,0.2);">
              ${taskObj.title}
            </span>
          </td>
          <td>
            <span class="font-mono small text-uppercase fw-semibold">${item.language || 'python'}</span>
          </td>
          <td>
            <span class="small text-muted text-tabular">${dateStr}</span>
          </td>
          <td class="text-end">
            <div class="d-flex align-items-center justify-content-end gap-1">
              <a href="workspace.html?task=${item.task}&lang=${item.language}" class="btn-icon-action text-decoration-none" title="Open in Workspace">
                <i class="bi bi-box-arrow-up-right"></i> Open
              </a>
              <button type="button" class="btn-icon-action text-danger border-danger-subtle" onclick="HistoryManager.promptDelete('${item.id}', '${this.escapeHtml(item.title || 'Conversation')}')" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  promptDelete(id, title) {
    this.selectedConvId = id;
    const titleEl = document.getElementById('delete-modal-item-title');
    if (titleEl) titleEl.textContent = title;

    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
};

window.HistoryManager = HistoryManager;
