import axios from 'axios';
import { config } from '../config/config.js';

class JenkinsModel {
  constructor() {
    this.jenkinsUrl = config.jenkinsUrl;
    this.auth = {
      username: config.jenkinsUser,
      password: config.jenkinsToken,
    };

    // Create a shared axios instance to maintain session cookies
    this.axiosInstance = axios.create({
      baseURL: this.jenkinsUrl,
      auth: this.auth,
      withCredentials: true,
      validateStatus: () => true,
    });
  }

  async getJobs() {
    try {
      const response = await axios.get(`${this.jenkinsUrl}/api/json`, {
        auth: this.auth,
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return { jobs: [] };
      }

      const jobs = response.data.jobs.map((job) => ({
        name: job.name,
        url: job.url,
        color: job.color,
      }));

      return { jobs };
    } catch (error) {
      console.error('Jenkins API Error:', error.message);
      return { jobs: [] };
    }
  }

  async getJobBuilds(jobName) {
    try {
      // Fetch job information from Jenkins
      const jobUrl = `${this.jenkinsUrl}/job/${jobName}/api/json`;
      const response = await axios.get(jobUrl, {
        auth: this.auth,
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return {
          jobName,
          builds: [],
          lastBuild: null,
        };
      }

      const jobData = response.data;
      const builds = [];

      // Get last 5 builds
      const buildNumbers = jobData.builds.slice(0, 5).map((b) => b.number);

      for (const buildNumber of buildNumbers) {
        try {
          const buildUrl = `${this.jenkinsUrl}/job/${jobName}/${buildNumber}/api/json`;
          const buildResponse = await axios.get(buildUrl, {
            auth: this.auth,
            timeout: 3000,
          });
          const buildData = buildResponse.data;

          // Determine stage 4 status
          let stage4Status = 'N/A';
          if (buildData.actions) {
            for (const action of buildData.actions) {
              if (action._class && action._class.includes('WorkflowRunAction')) {
                stage4Status = buildData.result || (buildData.building ? 'IN_PROGRESS' : 'COMPLETED');
              }
            }
          }

          builds.push({
            buildNumber: buildData.number,
            status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
            timestamp: buildData.timestamp,
            duration: buildData.duration,
            building: buildData.building,
            stage4Status: stage4Status,
          });
        } catch (err) {
          console.error(`Error fetching build ${buildNumber}:`, err.message);
        }
      }

      return {
        jobName,
        builds,
        lastBuild: builds[0] || null,
      };
    } catch (error) {
      console.error('Jenkins API Error:', error.message);
      throw new Error('Failed to fetch Jenkins data');
    }
  }

  async getCrumb() {
    try {
      const response = await axios.get(`${this.jenkinsUrl}/crumbIssuer/api/json`, {
        auth: this.auth,
        timeout: 3000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        return response.data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async triggerBuild(jobName) {
    try {
      console.log(`[JENKINS] Triggering build for job: ${jobName}`);
      console.log(`[JENKINS] Jenkins URL: ${this.jenkinsUrl}`);
      console.log(`[JENKINS] Using credentials: ${this.auth.username} / ${this.auth.password.substring(0, 4)}...`);

      const safeJobName = encodeURIComponent(jobName);
      const buildUrl = `${this.jenkinsUrl}/job/${safeJobName}/build`;

      console.log(`[JENKINS] POST to: ${buildUrl}`);

      // Try without CSRF first to test authentication
      const response = await axios.post(
        buildUrl,
        '',
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      console.log(`[JENKINS] Response status: ${response.status}`);

      if ([200, 201, 202, 204].includes(response.status)) {
        return { jobName, queued: true, status: response.status };
      }

      if (response.status === 404) {
        return { jobName, queued: false, error: 'Job not found' };
      }

      console.error(`[JENKINS] Unexpected status: ${response.status}`, response.data);
      throw new Error(`Unexpected Jenkins response: ${response.status}`);
    } catch (error) {
      console.error('Jenkins Trigger Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error('Failed to trigger Jenkins build');
    }
  }
}

export default JenkinsModel;
