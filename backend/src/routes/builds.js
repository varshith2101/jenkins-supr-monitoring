import express from 'express';
import JenkinsModel from '../models/Jenkins.js';
import { authenticateToken, authorizePermissions } from '../middleware/auth.js';
import UserModel from '../models/User.js';

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

// Get all Jenkins jobs
router.get(
  '/jobs',
  authenticateToken,
  authorizePermissions(['build:read']),
  async (req, res) => {
    try {
      const data = await jenkinsModel.getJobs();
      const user = UserModel.findByUsername(req.user.username);

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

// Trigger a Jenkins build for a job
router.post(
  '/builds/:jobName/trigger',
  authenticateToken,
  authorizePermissions(['build:trigger']),
  async (req, res) => {
    const { jobName } = req.params;

    console.log(`[BUILD TRIGGER] User: ${req.user.username}, Role: ${req.user.role}, Job: ${jobName}`);

    try {
      const result = await jenkinsModel.triggerBuild(jobName);
      console.log(`[BUILD TRIGGER] Success:`, result);
      res.json(result);
    } catch (error) {
      console.error(`[BUILD TRIGGER] Error:`, error.message);
      res.status(500).json({
        error: 'Failed to trigger build',
        message: error.message,
      });
    }
  }
);

export default router;
