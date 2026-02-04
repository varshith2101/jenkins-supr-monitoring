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

  getJobPath(jobName) {
    return jobName
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/job/');
  }

  extractFailedStageFromLogs(logText) {
    if (!logText) return null;
    const lines = logText.split('\n');
    const isDeclarativeStage = (name) => {
      if (!name) return false;
      return (
        name.startsWith('Declarative:') ||
        name === 'Declarative: Checkout SCM' ||
        name === 'Declarative: Post Actions' ||
        name === 'Checkout SCM'
      );
    };

    const stageFromLine = (line) => {
      const pipelineMatch = line.match(/\[Pipeline\] \{ \((.+)\)/);
      if (pipelineMatch?.[1]) return pipelineMatch[1].trim();

      const enteringMatch = line.match(/Entering stage \[(.+)\]/);
      if (enteringMatch?.[1]) return enteringMatch[1].trim();

      const stageMatch = line.match(/Stage "(.+)"/);
      if (stageMatch?.[1]) return stageMatch[1].trim();

      return null;
    };

    const errorPattern = /ERROR:|Finished: FAILURE|Finished: ABORTED|script returned exit code|AbortException|FlowInterruptedException|Exception:|hudson\.AbortException|^\s*\[Pipeline\] error/;
    let currentStage = null;
    let lastNonDeclarativeStage = null;

    for (let i = 0; i < lines.length; i += 1) {
      const stageName = stageFromLine(lines[i]);
      if (stageName && !isDeclarativeStage(stageName)) {
        currentStage = stageName;
        lastNonDeclarativeStage = stageName;
      }

      if (errorPattern.test(lines[i])) {
        if (currentStage) return currentStage;
      }
    }

    return lastNonDeclarativeStage;
  }

  extractCommandFromLogs(logText) {
    if (!logText) return null;
    const lines = logText.split('\n');

    const findCommandLine = (line) => {
      const trimmed = line.trim();
      const plusMatch = trimmed.match(/^\+\s+(.+)/);
      if (plusMatch?.[1]) return plusMatch[1].trim();

      const batMatch = trimmed.match(/^>\s+(.+)/);
      if (batMatch?.[1]) return batMatch[1].trim();

      const dollarMatch = trimmed.match(/^\$\s+(.+)/);
      if (dollarMatch?.[1]) return dollarMatch[1].trim();

      const shMatch = trimmed.match(/\/bin\/(?:ba|z|)sh -xe\s+(.+)/);
      if (shMatch?.[1]) return shMatch[1].trim();

      return null;
    };

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const candidate = findCommandLine(lines[i]);
      if (candidate) return candidate;
    }

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i];
      if (
        line.includes('[Pipeline] sh') ||
        line.includes('[Pipeline] bat') ||
        line.includes('Executing shell script') ||
        line.includes('Running shell script')
      ) {
        for (let j = i + 1; j < lines.length; j += 1) {
          const candidate = findCommandLine(lines[j]);
          if (candidate) return candidate;
          const trimmed = lines[j].trim();
          if (trimmed && !trimmed.startsWith('[')) {
            return trimmed;
          }
        }
      }
    }

    return null;
  }

  pickFailedStageFromStages(stages) {
    if (!stages || stages.length === 0) return null;
    const failureStatuses = ['FAILED', 'FAILURE', 'ABORTED', 'UNSTABLE'];

    const relevantStages = stages.filter((stage) => stage?.name);
    const nonDeclarativeStages = relevantStages.filter((stage) => {
      const name = String(stage.name);
      if (name.startsWith('Declarative:')) return false;
      if (name === 'Declarative: Post Actions') return false;
      if (name === 'Declarative: Checkout SCM') return false;
      if (name === 'Checkout SCM') return false;
      return true;
    });

    const pickFrom = nonDeclarativeStages.length > 0 ? nonDeclarativeStages : relevantStages;

    for (let i = pickFrom.length - 1; i >= 0; i -= 1) {
      const stageStatus = String(pickFrom[i].status || '').toUpperCase();
      if (failureStatuses.includes(stageStatus)) {
        return pickFrom[i].name;
      }
    }

    return null;
  }

  async getFailedStageFromLogs(jobName, buildNumber) {
    try {
      const jobPath = this.getJobPath(jobName);
      const logUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/consoleText`;
      const logResponse = await axios.get(logUrl, {
        auth: this.auth,
        timeout: 5000,
        responseType: 'text',
        validateStatus: () => true,
      });

      if (logResponse.status !== 200) {
        return null;
      }

  return this.extractFailedStageFromLogs(logResponse.data || '');
    } catch (error) {
      return null;
    }
  }

  async getWorkflowStages(jobName, buildNumber) {
    try {
      const jobPath = this.getJobPath(jobName);
      const wfUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/wfapi/describe`;
      const wfResponse = await axios.get(wfUrl, {
        auth: this.auth,
        timeout: 2000,
        validateStatus: () => true,
      });

      if (wfResponse.status !== 200) {
        return [];
      }

      return wfResponse.data.stages || [];
    } catch (error) {
      return [];
    }
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
      const jobPath = this.getJobPath(jobName);
      const jobUrl = `${this.jenkinsUrl}/job/${jobPath}/api/json`;
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
          const buildUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/api/json`;
          const buildResponse = await axios.get(buildUrl, {
            auth: this.auth,
            timeout: 3000,
          });
          const buildData = buildResponse.data;

          let currentStage = null;
          let failedStage = null;
          const stages = await this.getWorkflowStages(jobName, buildNumber);

          if (stages.length > 0) {
            if (buildData.building) {
              const runningStage = stages.find((stage) => stage.status === 'IN_PROGRESS');
              if (runningStage?.name) {
                currentStage = runningStage.name;
              }
            } else if (buildData.result) {
              const resultStatus = String(buildData.result).toUpperCase();
              if (['FAILURE', 'ABORTED'].includes(resultStatus)) {
                failedStage = await this.getFailedStageFromLogs(jobName, buildNumber);
                if (!failedStage) {
                  failedStage = this.pickFailedStageFromStages(stages);
                }
              }
            }
          }

          if (!failedStage && buildData.result) {
            const resultStatus = String(buildData.result).toUpperCase();
            if (['FAILURE', 'ABORTED'].includes(resultStatus)) {
              failedStage = await this.getFailedStageFromLogs(jobName, buildNumber);
              if (!failedStage) {
                failedStage = this.pickFailedStageFromStages(stages);
              }
            }
          }

          builds.push({
            buildNumber: buildData.number,
            status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
            timestamp: buildData.timestamp,
            duration: buildData.duration,
            building: buildData.building,
            currentStage: currentStage,
            failedStage: failedStage,
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
      console.log(`[JENKINS] Using credentials for user: ${this.auth.username}`);

  const jobPath = this.getJobPath(jobName);
  const buildUrl = `${this.jenkinsUrl}/job/${jobPath}/build`;

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
      const jobPath = this.getJobPath(jobName);
      const buildUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/api/json`;
      const buildResponse = await axios.get(buildUrl, {
        auth: this.auth,
        timeout: 3000,
        validateStatus: () => true,
      });

      if (buildResponse.status !== 200) {
        throw new Error('Build not found');
      }

      const buildData = buildResponse.data;

      let currentStage = null;
      let failedStage = null;
      const stages = await this.getWorkflowStages(jobName, buildNumber);

      if (stages.length > 0) {
        if (buildData.building) {
          const runningStage = stages.find((stage) => stage.status === 'IN_PROGRESS');
          if (runningStage?.name) {
            currentStage = runningStage.name;
          }
        } else if (buildData.result) {
          const resultStatus = String(buildData.result).toUpperCase();
          if (['FAILURE', 'ABORTED'].includes(resultStatus)) {
            failedStage = await this.getFailedStageFromLogs(jobName, buildNumber);
            if (!failedStage) {
              failedStage = this.pickFailedStageFromStages(stages);
            }
          }
        }
      }

      if (!failedStage && buildData.result) {
        const resultStatus = String(buildData.result).toUpperCase();
        if (['FAILURE', 'ABORTED'].includes(resultStatus)) {
          failedStage = await this.getFailedStageFromLogs(jobName, buildNumber);
          if (!failedStage) {
            failedStage = this.pickFailedStageFromStages(stages);
          }
        }
      }

      return {
        buildNumber: buildData.number,
        status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
        timestamp: buildData.timestamp,
        duration: buildData.duration,
        building: buildData.building,
        currentStage: currentStage,
        failedStage: failedStage,
      };
    } catch (error) {
      console.error('Jenkins API Error:', error.message);
      throw new Error('Failed to fetch build data');
    }
  }

  async getBuildLogs(jobName, buildNumber) {
    try {
      const jobPath = this.getJobPath(jobName);
      const buildUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/api/json`;
      const buildResponse = await axios.get(buildUrl, {
        auth: this.auth,
        timeout: 3000,
        validateStatus: () => true,
      });

      if (buildResponse.status !== 200) {
        throw new Error('Build not found');
      }

      const buildData = buildResponse.data;

      let command = 'Pipeline';
      const stages = await this.getWorkflowStages(jobName, buildNumber);
      if (stages.length > 0) {
        const lastStage = stages.slice().reverse().find((stage) => stage.name);
        if (lastStage?.name) {
          command = lastStage.name;
        }
      }

  const logUrl = `${this.jenkinsUrl}/job/${jobPath}/${buildNumber}/consoleText`;
      const logResponse = await axios.get(logUrl, {
        auth: this.auth,
        timeout: 5000,
        responseType: 'text',
        validateStatus: () => true,
      });

      if (logResponse.status !== 200) {
        throw new Error('Failed to fetch build logs');
      }

      const logText = logResponse.data || '';
      const extractedCommand = this.extractCommandFromLogs(logText);
      if (extractedCommand) {
        command = extractedCommand;
      }

      return {
        buildNumber: buildData.number,
        status: buildData.result || (buildData.building ? 'IN_PROGRESS' : 'UNKNOWN'),
        command,
        logs: logText,
      };
    } catch (error) {
      console.error('Jenkins Logs Error:', error.message);
      throw new Error('Failed to fetch build logs');
    }
  }

  async getJobParameters(jobName) {
    try {
      const jobPath = this.getJobPath(jobName);
      const jobUrl = `${this.jenkinsUrl}/job/${jobPath}/api/json`;
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

  const jobPath = this.getJobPath(jobName);
  const buildUrl = `${this.jenkinsUrl}/job/${jobPath}/buildWithParameters`;

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
