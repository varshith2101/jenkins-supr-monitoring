import axios from 'axios';
import { authService } from './authService';

// All API calls go through same origin (nginx proxy)
const API_BASE_URL = ''; // nginx proxies /api to backend

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const userService = {
  async getUsers() {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createUser(payload) {
    const response = await axios.post(`${API_BASE_URL}/api/users`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateUser(username, payload) {
    const response = await axios.patch(
      `${API_BASE_URL}/api/users/${username}`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async deleteUser(username) {
    const response = await axios.delete(`${API_BASE_URL}/api/users/${username}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export { userService };
