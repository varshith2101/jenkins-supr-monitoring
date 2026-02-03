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

          // Determine current stage for in-progress builds
          let currentStage = null;
          if (buildData.building) {
            // Try to get the current stage from workflow execution
            const wfUrl = `${this.jenkinsUrl}/job/${jobName}/${buildNumber}/wfapi/describe`;
            try {
              const wfResponse = await axios.get(wfUrl, {
                auth: this.auth,
                timeout: 2000,
              });
              const stages = wfResponse.data.stages || [];
              const runningStage = stages.find(s => s.status === 'IN_PROGRESS');
              if (runningStage) {
                currentStage = runningStage.name;
              }
            } catch (wfErr) {
              // Workflow API not available, ignore
            }
          }

          builds.push({
            buildNumber: buildData.number,
            status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
            timestamp: buildData.timestamp,
            duration: buildData.duration,
            building: buildData.building,
            currentStage: currentStage,
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

  async getBuildByNumber(jobName, buildNumber) {
    try {
      const buildUrl = `${this.jenkinsUrl}/job/${jobName}/${buildNumber}/api/json`;
      const buildResponse = await axios.get(buildUrl, {
        auth: this.auth,
        timeout: 3000,
        validateStatus: () => true,
      });

      if (buildResponse.status !== 200) {
        throw new Error('Build not found');
      }

      const buildData = buildResponse.data;

      // Determine current stage for in-progress builds
      let currentStage = null;
      if (buildData.building) {
        const wfUrl = `${this.jenkinsUrl}/job/${jobName}/${buildNumber}/wfapi/describe`;
        try {
          const wfResponse = await axios.get(wfUrl, {
            auth: this.auth,
            timeout: 2000,
          });
          const stages = wfResponse.data.stages || [];
          const runningStage = stages.find(s => s.status === 'IN_PROGRESS');
          if (runningStage) {
            currentStage = runningStage.name;
          }
        } catch (wfErr) {
          // Workflow API not available, ignore
        }
      }

      return {
        buildNumber: buildData.number,
        status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
        timestamp: buildData.timestamp,
        duration: buildData.duration,
        building: buildData.building,
        currentStage: currentStage,
      };
    } catch (error) {
      console.error('Jenkins API Error:', error.message);
      throw new Error('Failed to fetch build data');
    }
  }

  async getJobParameters(jobName) {
    try {
      const jobUrl = `${this.jenkinsUrl}/job/${jobName}/api/json`;
      const response = await axios.get(jobUrl, {
        auth: this.auth,
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return { hasParameters: false, parameters: [] };
      }

      const jobData = response.data;
      
      // Check if job has parameter definitions
      const properties = jobData.property || [];
      const parameterDefinitions = properties.find(
        (prop) => prop._class === 'hudson.model.ParametersDefinitionProperty'
      );

      if (!parameterDefinitions || !parameterDefinitions.parameterDefinitions) {
        return { hasParameters: false, parameters: [] };
      }

      const parameters = parameterDefinitions.parameterDefinitions.map((param) => ({
        name: param.name,
        type: param.type || param._class,
        description: param.description || '',
        defaultValue: param.defaultParameterValue?.value || '',
        choices: param.choices || [], // for choice parameters
      }));

      return { hasParameters: true, parameters };
    } catch (error) {
      console.error('Jenkins API Error:', error.message);
      return { hasParameters: false, parameters: [] };
    }
  }

  async triggerBuildWithParameters(jobName, parameters) {
    try {
      console.log(`[JENKINS] Triggering parameterized build for job: ${jobName}`, parameters);

      const safeJobName = encodeURIComponent(jobName);
      const buildUrl = `${this.jenkinsUrl}/job/${safeJobName}/buildWithParameters`;

      const params = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await axios.post(
        buildUrl,
        params.toString(),
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

      throw new Error(`Unexpected Jenkins response: ${response.status}`);
    } catch (error) {
      console.error('Jenkins Trigger Error:', error.message);
      throw new Error('Failed to trigger Jenkins build with parameters');
    }
  }
}

export default JenkinsModel;
