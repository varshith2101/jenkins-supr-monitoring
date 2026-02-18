import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PipelineCard from './PipelineCard';
import { jenkinsService } from '../services/jenkinsService';
import { formatTimestamp } from '../utils/formatters';
import logo from '../main-logo-2.png';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [pipelineSummaries, setPipelineSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    fetchJobs();
  }, []);

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
      setLastUpdated(new Date());
    } catch (err) {
      setPipelineSummaries(jobList.map((job) => ({ name: job.name, lastBuild: null, error: true })));
    } finally {
      setSummariesLoading(false);
    }
  };

  const handlePipelineSelect = (jobName) => {
    navigate(`/pipeline/${encodeURIComponent(jobName)}`);
  };

  /* Filter by user's allowed pipelines, then by search text */
  const userPipelines = user?.pipelines || [];
  const accessibleSummaries = user?.role === 'admin' || userPipelines.length === 0
    ? pipelineSummaries
    : pipelineSummaries.filter((p) => userPipelines.includes(p.name));

  const filteredPipelineSummaries = accessibleSummaries.filter((pipeline) =>
    pipeline.name.toLowerCase().includes(pipelineSearch.trim().toLowerCase())
  );

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-row">
            <div className="brand">
              <img className="brand-logo" src={logo} alt="Suprajit Logo" />
            </div>

            <button
              className={`hamburger-toggle ${mobileMenuOpen ? 'open' : ''}`}
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className={`user-info ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <div className="profile-menu">
                <button className="user-chip user-chip-button" type="button">
                  <div className="user-name">{user?.displayName || user?.username}</div>
                  <div className="user-role">{user?.role?.toUpperCase()}</div>
                </button>
                <div className="profile-dropdown">
                  <button className="logout-button" onClick={() => { closeMobileMenu(); onLogout(); }} type="button">
                    Logout
                  </button>
                </div>
              </div>
              {user?.role === 'admin' && (
                <button className="secondary-button access-button" type="button" onClick={() => { closeMobileMenu(); navigate('/access'); }}>
                  Access Management
                </button>
              )}
              <button className="secondary-button mobile-logout-button" type="button" onClick={() => { closeMobileMenu(); onLogout(); }}>
                Logout
              </button>
            </div>
          </div>
          <p className="dashboard-subtitle">Suprajit Technology Center</p>
        </div>
      </header>

      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu} />}

      <div className="dashboard-container dashboard-container-narrow">
        <section className="dashboard-grid dashboard-grid-single">
          <div className="panel panel-primary">
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
          </div>
        </section>
      </div>

      <footer className="app-footer">
        Jenkins Monitor · Suprajit Technology Center
      </footer>
    </div>
  );
}

export default Dashboard;
