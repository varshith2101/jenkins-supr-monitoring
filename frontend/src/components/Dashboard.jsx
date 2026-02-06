import { useState, useEffect } from 'react';
import BuildInfo from './BuildInfo';
import PipelineStagesPage from './PipelineStagesPage';
import PipelineCard from './PipelineCard';
import ParametersModal from './ParametersModal';
import { jenkinsService } from '../services/jenkinsService';
import { formatTimestamp } from '../utils/formatters';
import logo from '../main-logo-2.png';

function Dashboard({ user, onLogout, onAccessManagement }) {
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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showParametersModal, setShowParametersModal] = useState(false);
  const [jobParameters, setJobParameters] = useState([]);
  const [pipelineSummaries, setPipelineSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [stageViewBuild, setStageViewBuild] = useState(null);

  const canTrigger = ['admin', 'user'].includes(user?.role);

  // Fetch available jobs when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (viewMode === 'detail' && selectedJob) {
      fetchBuildInfo();
      startAutoRefresh();
    } else if (viewMode === 'stages') {
      stopAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [selectedJob, viewMode]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError('');

    try {
      const data = await jenkinsService.getJobs();
      const jobList = data.jobs || [];
      setJobs(jobList);
      await fetchPipelineSummaries(jobList);
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

  const fetchPipelineSummaries = async (jobList = jobs) => {
    if (!jobList || jobList.length === 0) {
      setPipelineSummaries([]);
      return;
    }

    setSummariesLoading(true);

    try {
      const results = await Promise.allSettled(
        jobList.map((job) => jenkinsService.getBuilds(job.name))
      );

      const summaries = jobList.map((job, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return {
            name: job.name,
            lastBuild: result.value.lastBuild || null,
          };
        }
        return {
          name: job.name,
          lastBuild: null,
          error: true,
        };
      });

      setPipelineSummaries(summaries);
    } catch (err) {
      setPipelineSummaries(jobList.map((job) => ({ name: job.name, lastBuild: null, error: true })));
    } finally {
      setSummariesLoading(false);
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

  const handlePipelineSelect = (jobName) => {
    setSelectedJob(jobName);
    setBuildData(null);
    setError('');
    setTriggerMessage('');
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJob('');
    setBuildData(null);
    setError('');
    setTriggerMessage('');
    setStageViewBuild(null);
  };

  const handleViewStages = ({ jobName, build }) => {
    if (!jobName || !build) return;
    setSelectedJob(jobName);
    setStageViewBuild(build);
    setViewMode('stages');
  };

  const handleBackToBuild = () => {
    setViewMode('detail');
  };

  const filteredPipelineSummaries = pipelineSummaries.filter((pipeline) =>
    pipeline.name.toLowerCase().includes(pipelineSearch.trim().toLowerCase())
  );

  const handleRefresh = () => {
    fetchBuildInfo();
  };

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-row">
            <div className="brand">
              <img className="brand-logo" src={logo} alt="Suprajit Logo" />
            </div>
            <div className="user-info">
              {user?.role === 'admin' && (
                <button className="secondary-button access-button" type="button" onClick={onAccessManagement}>
                  Access Management
                </button>
              )}
              <div className="profile-menu">
                <button className="user-chip user-chip-button" type="button">
                  <div className="user-name">{user?.displayName || user?.username}</div>
                  <div className="user-role">{user?.role?.toUpperCase()}</div>
                </button>
                <div className="profile-dropdown">
                  <button className="logout-button" onClick={onLogout} type="button">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="dashboard-subtitle">Suprajit Technology Center</p>
        </div>
      </header>

      <div className="dashboard-container dashboard-container-narrow">
        <section className="dashboard-grid dashboard-grid-single">
          <div className="panel panel-primary">
            {viewMode === 'list' ? (
              <>
                <div className="panel-header">
                  <h2>Pipeline Overview</h2>
                  <div className="panel-search">
                    <input
                      type="text"
                      placeholder="Search pipelines..."
                      value={pipelineSearch}
                      onChange={(event) => setPipelineSearch(event.target.value)}
                      className="panel-search-input"
                    />
                  </div>
                  {lastUpdated && (
                    <span className="panel-meta">Updated {formatTimestamp(lastUpdated)}</span>
                  )}
                </div>

                {jobsError && <div className="error-message">{jobsError}</div>}

                {jobsLoading || summariesLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading pipelines...</p>
                  </div>
                ) : filteredPipelineSummaries.length === 0 ? (
                  <div className="muted-card">No pipelines available.</div>
                ) : (
                  <div className="pipeline-card-list">
                    {filteredPipelineSummaries.map((pipeline) => (
                      <PipelineCard
                        key={pipeline.name}
                        jobName={pipeline.name}
                        lastBuild={pipeline.lastBuild}
                        hasError={pipeline.error}
                        onReadMore={() => handlePipelineSelect(pipeline.name)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : viewMode === 'stages' ? (
              <PipelineStagesPage
                jobName={selectedJob}
                build={stageViewBuild}
                onBack={handleBackToBuild}
                onLogout={onLogout}
              />
            ) : (
              <>
                <div className="panel-header">
                  <div className="panel-header-main">
                    <button className="ghost-button" type="button" onClick={handleBackToList}>
                      Back
                    </button>
                    <h2>{selectedJob}</h2>
                  </div>
                  {lastUpdated && (
                    <span className="panel-meta">Updated {lastUpdated.toLocaleTimeString()}</span>
                  )}
                </div>

                <div className="pipeline-actions">
                  <div className="job-actions">
                    <button
                      className="ghost-button"
                      onClick={handleRefresh}
                      disabled={!selectedJob || loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      className="primary-button"
                      onClick={handleTriggerBuild}
                      disabled={!selectedJob || triggering || !canTrigger}
                    >
                      {triggering ? 'Triggering...' : 'Trigger Build'}
                    </button>
                  </div>
                  {triggerMessage && (
                    <div className="status-message">{triggerMessage}</div>
                  )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading && !buildData && (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading build intelligence...</p>
                  </div>
                )}

                {buildData && (
                  <BuildInfo
                    data={buildData}
                    onViewStages={handleViewStages}
                  />
                )}
              </>
            )}
          </div>
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
