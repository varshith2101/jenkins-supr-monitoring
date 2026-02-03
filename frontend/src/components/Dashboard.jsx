import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import JobSelector from './JobSelector';
import BuildInfo from './BuildInfo';
import UserManagement from './UserManagement';
import ParametersModal from './ParametersModal';
import { jenkinsService } from '../services/jenkinsService';
import { userService } from '../services/userService';

function Dashboard({ user, onLogout }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [buildData, setBuildData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [allAvailableJobs, setAllAvailableJobs] = useState([]);
  const [showParametersModal, setShowParametersModal] = useState(false);
  const [jobParameters, setJobParameters] = useState([]);

  const canTrigger = ['admin', 'operator'].includes(user?.role);
  const canManageUsers = user?.role === 'admin';

  // Fetch available jobs when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  useEffect(() => {
    if (selectedJob) {
      fetchBuildInfo();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [selectedJob]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError('');

    try {
      const data = await jenkinsService.getJobs();
      setJobs(data.jobs || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setJobsError('Failed to fetch jobs from Jenkins');
      }
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchBuildInfo = async () => {
    if (!selectedJob) return;

    setLoading(true);
    setError('');

    try {
      const data = await jenkinsService.getBuilds(selectedJob);
      setBuildData(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setError(err.response?.data?.error || 'Failed to fetch build information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBuild = async () => {
    if (!selectedJob) return;
    
    // First check if job has parameters
    try {
      const paramData = await jenkinsService.getJobParameters(selectedJob);
      
      if (paramData.hasParameters && paramData.parameters.length > 0) {
        // Show parameters modal
        setJobParameters(paramData.parameters);
        setShowParametersModal(true);
      } else {
        // Trigger without parameters
        await triggerBuildWithParameters(null);
      }
    } catch (err) {
      setTriggerMessage('Failed to check job parameters');
    }
  };

  const triggerBuildWithParameters = async (parameters) => {
    setTriggering(true);
    setTriggerMessage('');

    try {
      await jenkinsService.triggerBuild(selectedJob, parameters);
      setTriggerMessage('Build queued successfully.');
      setShowParametersModal(false);
      fetchBuildInfo();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setTriggerMessage(err.response?.data?.error || 'Failed to trigger build');
      }
    } finally {
      setTriggering(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const data = await userService.getUsers();
      setUsers(data.users || []);

      // Also fetch all available jobs for admin to assign
      const jobsData = await jenkinsService.getJobs();
      setAllAvailableJobs(jobsData.jobs?.map((job) => job.name) || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setUsersError('Failed to load users');
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserCreate = async (payload) => {
    await userService.createUser(payload);
    fetchUsers();
  };

  const handleUserUpdate = async (username, payload) => {
    try {
      await userService.updateUser(username, payload);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
      throw err;
    }
  };

  const handleUserDelete = async (username) => {
    try {
      await userService.deleteUser(username);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
      throw err;
    }
  };

  const startAutoRefresh = () => {
    stopAutoRefresh();
    const interval = setInterval(() => {
      if (selectedJob) {
        fetchBuildInfo();
      }
    }, 10000);
    setAutoRefresh(interval);
  };

  const stopAutoRefresh = () => {
    if (autoRefresh) {
      clearInterval(autoRefresh);
      setAutoRefresh(null);
    }
  };

  const handleJobChange = (jobName) => {
    setSelectedJob(jobName);
    setBuildData(null);
    setError('');
    setTriggerMessage('');
  };

  const handleRefresh = () => {
    fetchBuildInfo();
  };

  return (
    <div className="dashboard-screen">
      <Navbar />
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="brand">
            <p className="brand-kicker">Jenkins Team</p>
            <h1>Remote Jenkins</h1>
            <p className="brand-subtitle">Remotely trigger your Jenkins pipelines</p>
          </div>
          <div className="user-info">
            <div className="user-chip">
              <div className="user-name">{user?.displayName || user?.username}</div>
              <div className="user-role">{user?.role?.toUpperCase()}</div>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <section className="dashboard-grid">
          <div className="panel panel-primary">
            <div className="panel-header">
              <h2>Assigned Pipelines</h2>
              {lastUpdated && (
                <span className="panel-meta">Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>

            <JobSelector
              selectedJob={selectedJob}
              onJobChange={handleJobChange}
              onRefresh={handleRefresh}
              onTrigger={handleTriggerBuild}
              loading={loading}
              triggering={triggering}
              canTrigger={canTrigger}
              triggerMessage={triggerMessage}
              jobs={jobs}
              jobsLoading={jobsLoading}
              jobsError={jobsError}
            />

            {error && <div className="error-message">{error}</div>}

            {loading && !buildData && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading build intelligence...</p>
              </div>
            )}

            {buildData && <BuildInfo data={buildData} />}
          </div>

          <aside className="panel panel-secondary">
            <div className="panel-header">
              <h2>Access & Governance</h2>
              <span className="panel-meta">Role-based control</span>
            </div>

            {canManageUsers ? (
              <UserManagement
                users={users}
                loading={usersLoading}
                error={usersError}
                availableJobs={allAvailableJobs}
                onCreate={handleUserCreate}
                onUpdate={handleUserUpdate}
                onDelete={handleUserDelete}
              />
            ) : (
              <div className="muted-card">
                <p>Request admin access to manage user roles and permissions.</p>
              </div>
            )}
          </aside>
        </section>
      </div>

      {showParametersModal && (
        <ParametersModal
          parameters={jobParameters}
          onSubmit={triggerBuildWithParameters}
          onClose={() => setShowParametersModal(false)}
          triggering={triggering}
        />
      )}
    </div>
  );
}

export default Dashboard;
