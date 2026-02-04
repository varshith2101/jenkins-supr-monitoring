import express from 'express';
import JenkinsModel from '../models/Jenkins.js';
import { authenticateToken, authorizePermissions } from '../middleware/auth.js';
import UserDB from '../models/UserDB.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();
const jenkinsModel = new JenkinsModel();

// Get Jenkins build information for a specific job
router.get(
  '/builds/:jobName',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    const { jobName } = req.params;

    try {
      const data = await jenkinsModel.getJobBuilds(jobName);
      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch Jenkins data',
        message: error.message,
        builds: [],
      });
    }
  }
);

// Get a specific build by number
router.get(
  '/builds/:jobName/:buildNumber',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    const { jobName, buildNumber } = req.params;

    try {
      const data = await jenkinsModel.getBuildByNumber(jobName, parseInt(buildNumber));
      res.json(data);
    } catch (error) {
      res.status(404).json({
        error: 'Failed to fetch build data',
        message: error.message,
      });
    }
  }
);

// Get build logs for a specific build
router.get(
  '/builds/:jobName/:buildNumber/logs',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    const { jobName, buildNumber } = req.params;

    try {
      const data = await jenkinsModel.getBuildLogs(jobName, parseInt(buildNumber));
      res.json(data);
    } catch (error) {
      res.status(404).json({
        error: 'Failed to fetch build logs',
        message: error.message,
      });
    }
  }
);

// Get all Jenkins jobs
router.get(
  '/jobs',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    try {
      const data = await jenkinsModel.getJobs();
      const user = await UserDB.findByUsername(req.user.username);

      // Admins see all jobs; others see only assigned pipelines
      if (user?.role === 'admin' || !user?.pipelines || user.pipelines.length === 0) {
        res.json(data);
      } else {
        const filteredJobs = data.jobs.filter((job) =>
          user.pipelines.includes(job.name)
        );
        res.json({ jobs: filteredJobs });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch jobs',
        jobs: [],
      });
    }
  }
);

// Get job parameters
router.get(
  '/jobs/:jobName/parameters',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    const { jobName } = req.params;

    try {
      const data = await jenkinsModel.getJobParameters(jobName);
      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch job parameters',
        hasParameters: false,
        parameters: [],
      });
    }
  }
);

// Trigger a Jenkins build for a job
router.post(
  '/builds/:jobName/trigger',
  authenticateToken,
  authorizePermissions(['build:trigger']),
  async (req, res) => {
    const { jobName } = req.params;
    const { parameters } = req.body;

    console.log(`[BUILD TRIGGER] User: ${req.user.username}, Role: ${req.user.role}, Job: ${jobName}`);

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    try {
      const user = await UserDB.findByUsername(req.user.username);

      let result;
      if (parameters && Object.keys(parameters).length > 0) {
        console.log(`[BUILD TRIGGER] With parameters:`, parameters);
        result = await jenkinsModel.triggerBuildWithParameters(jobName, parameters);
      } else {
        result = await jenkinsModel.triggerBuild(jobName);
      }
      console.log(`[BUILD TRIGGER] Success:`, result);

      // Log successful build trigger
      await AuditLog.logAction({
        userId: user?.id,
        username: req.user.username,
        action: 'trigger_build',
        resource: jobName,
        details: { parameters, result },
        ipAddress,
        userAgent,
        success: true,
      });

      res.json(result);
    } catch (error) {
      console.error(`[BUILD TRIGGER] Error:`, error.message);

      // Log failed build trigger
      const user = await UserDB.findByUsername(req.user.username);
      await AuditLog.logAction({
        userId: user?.id,
        username: req.user.username,
        action: 'trigger_build',
        resource: jobName,
        details: { parameters },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error.message,
      });

      res.status(500).json({
        error: 'Failed to trigger build',
        message: error.message,
      });
    }
  }
);

export default router;
