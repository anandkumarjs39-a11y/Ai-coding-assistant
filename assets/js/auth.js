/**
 * AI Coding Assistant - Authentication Controller
 * Manages user session, token lifecycle, and route protection
 */

const Auth = {
  TOKEN_KEY: 'aca_auth_token',
  USER_KEY: 'aca_user_profile',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) {
      // Default fallback profile for immediate review
      return {
        id: 'usr_001',
        name: 'Alex Chen',
        email: 'alex.chen@university.edu',
        role: 'Computer Science Senior',
        semester: 'Semester 8',
        project: 'AI Coding Assistant'
      };
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken() || CONFIG.MOCK_MODE_ENABLED;
  },

  async login(email, password) {
    const res = await API.login({ email, password });
    if (res.token) {
      localStorage.setItem(this.TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    }
    return res;
  },

  async register(name, email, password) {
    return await API.register({ name, email, password });
  },

  async logout() {
    try {
      await API.logout();
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'login.html';
  },

  /**
   * Route Guard: Protects dashboard, workspace, history, settings
   */
  requireAuth() {
    // In strict mode when mock mode is turned off, force login
    if (!CONFIG.MOCK_MODE_ENABLED && !this.getToken()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
  },

  /**
   * Redirects logged-in users away from login/register pages
   */
  redirectIfAuthenticated() {
    if (this.getToken() && !CONFIG.MOCK_MODE_ENABLED) {
      window.location.href = 'dashboard.html';
    }
  }
};

window.Auth = Auth;
