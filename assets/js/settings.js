/**
 * AI Coding Assistant - Settings & Profile Controller
 * Manages user profile updates, system preferences, and API configuration
 */

const Settings = {
  async init() {
    this.populateProfile();
    this.populateSystemSettings();
    this.bindEvents();
  },

  populateProfile() {
    const user = Auth.getUser() || {
      name: 'Alex Chen',
      email: 'alex.chen@university.edu',
      role: 'Computer Science Senior',
      semester: 'Semester 8',
      project: 'AI Coding Assistant'
    };

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const roleInput = document.getElementById('profile-role');
    const semesterInput = document.getElementById('profile-semester');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const settingsAvatar = document.getElementById('settings-profile-avatar');
    const avatarInput = document.getElementById('profile-avatar');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (roleInput) roleInput.value = user.role || '';
    if (semesterInput) semesterInput.value = user.semester || '';
    if (avatarPreview && user.avatar) {
      avatarPreview.src = user.avatar;
    }
    if (settingsAvatar && user.avatar) {
      settingsAvatar.src = user.avatar;
    }

    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e, avatarPreview, settingsAvatar));
    }
  },

  handleAvatarChange(event, previewElement, settingsAvatar) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      UI.showToast('Image must be under 2MB', 'error');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      UI.showToast('Please select an image file', 'error');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (previewElement) previewElement.src = dataUrl;
      if (settingsAvatar) settingsAvatar.src = dataUrl;
      
      // Save avatar to user profile
      const user = Auth.getUser() || {};
      user.avatar = dataUrl;
      localStorage.setItem(Auth.USER_KEY, JSON.stringify(user));
      UI.renderUserProfileSnippet();
      UI.showToast('Profile picture updated!', 'success');
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  },

  resetAvatar() {
    const user = Auth.getUser() || {};
    delete user.avatar;
    localStorage.setItem(Auth.USER_KEY, JSON.stringify(user));
    
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const settingsAvatar = document.getElementById('settings-profile-avatar');
    const defaultAvatar = '/src/assets/images/avatar_student_dev_1791558006569.jpg';
    
    if (avatarPreview) avatarPreview.src = defaultAvatar;
    if (settingsAvatar) settingsAvatar.src = defaultAvatar;
    
    UI.renderUserProfileSnippet();
    UI.showToast('Profile picture removed', 'info');
  },

  populateSystemSettings() {
    const apiUrlInput = document.getElementById('settings-api-url');
    const themeSelect = document.getElementById('settings-theme-select');
    const mockToggle = document.getElementById('settings-mock-toggle');

    if (apiUrlInput) apiUrlInput.value = CONFIG.API_BASE_URL;
    if (themeSelect) themeSelect.value = localStorage.getItem('aca_theme') || 'dark';
    if (mockToggle) mockToggle.checked = CONFIG.MOCK_MODE_ENABLED;
  },

  bindEvents() {
    // Save Profile Form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          name: document.getElementById('profile-name')?.value.trim() || 'Alex Chen',
          email: document.getElementById('profile-email')?.value.trim() || 'alex.chen@university.edu',
          role: document.getElementById('profile-role')?.value.trim() || 'Computer Science Senior',
          semester: document.getElementById('profile-semester')?.value.trim() || 'Semester 8',
          project: 'AI Coding Assistant'
        };

        // Preserve existing avatar if any
        const currentUser = Auth.getUser();
        if (currentUser?.avatar) {
          updated.avatar = currentUser.avatar;
        }

        localStorage.setItem(Auth.USER_KEY, JSON.stringify(updated));
        UI.renderUserProfileSnippet();
        UI.showToast('Profile updated successfully!', 'success');
      });
    }

    // Save System Settings Form
    const settingsForm = document.getElementById('system-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUrl = document.getElementById('settings-api-url')?.value.trim() || 'http://localhost:5000/api';
        const newTheme = document.getElementById('settings-theme-select')?.value || 'dark';
        const newMock = document.getElementById('settings-mock-toggle')?.checked ?? true;

        CONFIG.API_BASE_URL = newUrl;
        CONFIG.MOCK_MODE_ENABLED = newMock;
        localStorage.setItem('aca_api_base_url', newUrl);
        localStorage.setItem('aca_mock_mode', newMock.toString());

        // Apply theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('aca_theme', newTheme);
        UI.updateThemeButtonIcon(newTheme);
        window.dispatchEvent(new CustomEvent('aca-theme-changed', { detail: { theme: newTheme } }));

        UI.updateConnectionBadgeUI();
        UI.showToast('System configuration saved!', 'success');
      });
    }

    // Ping Flask Backend Button
    const btnPing = document.getElementById('btn-settings-ping');
    const pingStatus = document.getElementById('settings-ping-status');
    if (btnPing) {
      btnPing.addEventListener('click', async () => {
        const url = document.getElementById('settings-api-url')?.value.trim() || CONFIG.API_BASE_URL;
        if (pingStatus) pingStatus.innerHTML = '<span class="text-info"><i class="bi bi-hourglass-split me-1"></i>Pinging Flask server...</span>';

        try {
          const res = await fetch(`${url}/dashboard/stats`, { method: 'GET' });
          if (res.ok) {
            if (pingStatus) pingStatus.innerHTML = '<span class="text-success fw-semibold"><i class="bi bi-check-circle-fill me-1"></i>Connected! Flask server responded with HTTP 200.</span>';
          } else {
            if (pingStatus) pingStatus.innerHTML = `<span class="text-warning"><i class="bi bi-exclamation-triangle-fill me-1"></i>Backend reachable but returned HTTP ${res.status}.</span>`;
          }
        } catch (err) {
          if (pingStatus) pingStatus.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill me-1"></i>Connection failed: ${err.message}. Ensure Flask is running on port 5000.</span>`;
        }
      });
    }

    // Logout Button
    const btnLogout = document.getElementById('btn-logout-action');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await Auth.logout();
      });
    }

    // Remove Avatar Button
    const btnRemoveAvatar = document.getElementById('btn-remove-avatar');
    if (btnRemoveAvatar) {
      btnRemoveAvatar.addEventListener('click', () => {
        this.resetAvatar();
      });
    }
  }
};

window.Settings = Settings;
