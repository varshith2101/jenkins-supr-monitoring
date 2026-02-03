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

const jenkinsService = {
  async getJobs() {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getBuilds(jobName) {
    const response = await axios.get(`${API_BASE_URL}/api/builds/${jobName}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getBuildByNumber(jobName, buildNumber) {
    const response = await axios.get(
      `${API_BASE_URL}/api/builds/${jobName}/${buildNumber}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async getJobParameters(jobName) {
    const response = await axios.get(
      `${API_BASE_URL}/api/jobs/${jobName}/parameters`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async triggerBuild(jobName, parameters = null) {
    const response = await axios.post(
      `${API_BASE_URL}/api/builds/${jobName}/trigger`,
      parameters ? { parameters } : null,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

export { jenkinsService };
