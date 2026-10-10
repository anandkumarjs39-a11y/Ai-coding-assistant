/**
 * AI Coding Assistant - UI Helper Utilities
 * Handles themes, toast messages, sidebar interactions, clipboard, and rendering
 */

const UI = {
  init() {
    this.initTheme();
    this.initSidebar();
    this.initActiveNav();
    this.renderUserProfileSnippet();
    this.initConnectionStatus();
  },

  /* ------------------------------------------------------------------------
     Theme Management (Dark Default / Light Option)
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem('aca_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtonIcon(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('aca_theme', next);
        this.updateThemeButtonIcon(next);
        
        // Notify Monaco Editor or other subscribers
        window.dispatchEvent(new CustomEvent('aca-theme-changed', { detail: { theme: next } }));
      });
    }
  },

  updateThemeButtonIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' 
      ? '<i class="bi bi-sun"></i>' 
      : '<i class="bi bi-moon-stars"></i>';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  },

  /* ------------------------------------------------------------------------
     Sidebar Interactions
     ------------------------------------------------------------------------ */
  initSidebar() {
    const toggleBtns = document.querySelectorAll('.btn-sidebar-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');

    if (!backdrop && sidebar) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('show');
        if (backdrop) backdrop.classList.toggle('show');
      });
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('show');
        backdrop.classList.remove('show');
      });
    }
  },

  initActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && href === currentPath) {
        item.classList.add('active');
      } else if (currentPath === '' && href === 'index.html') {
        item.classList.add('active');
      }
    });
  },

  renderUserProfileSnippet() {
    const snippetName = document.querySelector('.user-display-name');
    const snippetRole = document.querySelector('.user-role-badge');
    const snippetAvatar = document.querySelector('.user-avatar-img');
    if (snippetName && window.Auth) {
      const user = window.Auth.getUser();
      if (user) {
        snippetName.textContent = user.name || 'Alex Chen';
        snippetRole.textContent = user.role || 'CS Senior Project';
        if (snippetAvatar && user.avatar) {
          snippetAvatar.src = user.avatar;
        }
      }
    }
  },

  /* ------------------------------------------------------------------------
     Backend Connection Status in Topbar
     ------------------------------------------------------------------------ */
  async initConnectionStatus() {
    const connBtn = document.getElementById('connection-status-btn');
    if (!connBtn) return;

    this.updateConnectionBadgeUI();

    connBtn.addEventListener('click', () => {
      this.showConnectionModal();
    });
  },

  updateConnectionBadgeUI() {
    const connBtn = document.getElementById('connection-status-btn');
    if (!connBtn) return;

    if (CONFIG.MOCK_MODE_ENABLED) {
      connBtn.innerHTML = `<span class="status-indicator-dot"></span><span>Demo Simulator</span>`;
      connBtn.setAttribute('title', 'Running with built-in Viva Simulator. Click to configure Flask backend.');
    } else {
      connBtn.innerHTML = `<span class="status-indicator-dot online"></span><span>Flask REST API</span>`;
      connBtn.setAttribute('title', `Connected to Flask: ${CONFIG.API_BASE_URL}`);
    }
  },

  showConnectionModal() {
    const modalHtml = `
      <div class="modal fade" id="backendModal" tabindex="-1" aria-labelledby="backendModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-md);">
            <div class="modal-header" style="border-bottom: 1px solid var(--border-color);">
              <h5 class="modal-title fs-6 fw-bold" id="backendModalLabel">
                <i class="bi bi-hdd-network text-primary me-2"></i>Backend Connection & Mode
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="filter: invert(var(--bs-btn-close-filter, 0.5));"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label-custom">Flask REST API Base URL</label>
                <input type="text" id="modal-api-url" class="form-control-custom" value="${CONFIG.API_BASE_URL}" placeholder="http://localhost:5000/api">
                <small class="text-muted d-block mt-1">Configure where your Python Flask backend is running.</small>
              </div>
              <div class="p-3 mb-3" style="background-color: var(--bg-surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-semibold small">Viva Presentation Demo Simulator</span>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" id="modal-mock-toggle" ${CONFIG.MOCK_MODE_ENABLED ? 'checked' : ''}>
                  </div>
                </div>
                <p class="text-muted small mb-0">
                  When enabled, the application works standalone without running Python Flask in the background. When disabled, the frontend sends live REST requests to your Flask server.
                </p>
              </div>
              <div id="modal-ping-result" class="small text-muted mb-2"></div>
            </div>
            <div class="modal-footer" style="border-top: 1px solid var(--border-color);">
              <button type="button" id="btn-ping-backend" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-activity me-1"></i>Test Ping
              </button>
              <button type="button" id="btn-save-backend-settings" class="btn-primary-action btn-sm">
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing if any
    const existing = document.getElementById('backendModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('backendModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Ping button handler
    const pingBtn = document.getElementById('btn-ping-backend');
    const pingResult = document.getElementById('modal-ping-result');
    pingBtn.addEventListener('click', async () => {
      const testUrl = document.getElementById('modal-api-url').value.trim();
      pingResult.innerHTML = '<span class="text-info"><i class="bi bi-hourglass-split me-1"></i>Pinging server...</span>';
      try {
        const res = await fetch(`${testUrl}/dashboard/stats`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          pingResult.innerHTML = '<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Flask Backend reachable and responding!</span>';
        } else {
          pingResult.innerHTML = `<span class="text-warning"><i class="bi bi-exclamation-triangle-fill me-1"></i>Server responded with HTTP ${res.status}.</span>`;
        }
      } catch (e) {
        pingResult.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill me-1"></i>Unreachable (${e.message}). Ensure Flask is running.</span>`;
      }
    });

    // Save button handler
    document.getElementById('btn-save-backend-settings').addEventListener('click', () => {
      const newUrl = document.getElementById('modal-api-url').value.trim();
      const mockState = document.getElementById('modal-mock-toggle').checked;
      
      CONFIG.API_BASE_URL = newUrl;
      CONFIG.MOCK_MODE_ENABLED = mockState;
      localStorage.setItem('aca_api_base_url', newUrl);
      localStorage.setItem('aca_mock_mode', mockState.toString());

      this.updateConnectionBadgeUI();
      modal.hide();
      this.showToast('Backend connection settings updated.', 'success');
    });
  },

  /* ------------------------------------------------------------------------
     Toast Notifications
     ------------------------------------------------------------------------ */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    
    let icon = 'bi-info-circle';
    if (type === 'success') icon = 'bi-check-circle';
    if (type === 'error') icon = 'bi-exclamation-octagon';

    toast.innerHTML = `
      <i class="bi ${icon}"></i>
      <span style="flex: 1;">${message}</span>
      <button style="background: none; border: none; color: inherit; cursor: pointer; opacity: 0.6;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  /* ------------------------------------------------------------------------
     Copy and Download Actions
     ------------------------------------------------------------------------ */
  async copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success');
      if (btnElement) {
        const origText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="bi bi-check2"></i> Copied';
        setTimeout(() => {
          btnElement.innerHTML = origText;
        }, 1800);
      }
    } catch (err) {
      this.showToast('Failed to copy to clipboard', 'error');
    }
  },

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${filename}`, 'success');
  },

  /* ------------------------------------------------------------------------
     Safe Markdown Formatter
     ------------------------------------------------------------------------ */
  formatMarkdown(rawMarkdown) {
    if (!rawMarkdown) return '';
    try {
      if (window.marked && window.DOMPurify) {
        return window.DOMPurify.sanitize(window.marked.parse(rawMarkdown));
      }
      // Simple fallback formatting if libraries aren't loaded
      return rawMarkdown
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '<br><br>');
    } catch (e) {
      return rawMarkdown;
    }
  }
};

window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.init());
