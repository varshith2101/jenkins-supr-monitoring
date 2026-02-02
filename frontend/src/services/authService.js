import axios from 'axios';

// All API calls go through same origin (nginx proxy)
const API_BASE_URL = ''; // nginx proxies /api to backend

const authService = {
  async login(username, password) {
    const response = await axios.post(`${API_BASE_URL}/api/login`, {
      username,
      password,
    });

    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('role', response.data.role || 'viewer');
      if (response.data.displayName) {
        localStorage.setItem('displayName', response.data.displayName);
      }
      if (response.data.pipelines) {
        localStorage.setItem('pipelines', JSON.stringify(response.data.pipelines));
      }
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('displayName');
    localStorage.removeItem('pipelines');
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  getUsername() {
    return localStorage.getItem('username');
  },

  getRole() {
    return localStorage.getItem('role');
  },

  getDisplayName() {
    return localStorage.getItem('displayName');
  },

  getPipelines() {
    const stored = localStorage.getItem('pipelines');
    return stored ? JSON.parse(stored) : [];
  },

  getUser() {
    const username = this.getUsername();
    const role = this.getRole();
    const displayName = this.getDisplayName();
    const pipelines = this.getPipelines();

    if (!username) return null;

    return {
      username,
      role: role || 'viewer',
      displayName: displayName || username,
      pipelines,
    };
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export { authService };
