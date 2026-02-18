import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BuildInfo from './BuildInfo';
import ParametersModal from './ParametersModal';
import { jenkinsService } from '../services/jenkinsService';
import logo from '../main-logo-2.png';

function PipelineDetail({ user, onLogout }) {
  const { jobName: rawJobName } = useParams();
  const jobName = decodeURIComponent(rawJobName);
  const navigate = useNavigate();

  /* Pipeline access check */
  const userPipelines = user?.pipelines || [];
  const hasAccess = user?.role === 'admin' || userPipelines.length === 0 || userPipelines.includes(jobName);

  const [buildData, setBuildData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showParametersModal, setShowParametersModal] = useState(false);
  const [jobParameters, setJobParameters] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const canTrigger = ['admin', 'user'].includes(user?.role);

  const fetchBuildInfo = useCallback(async () => {
    if (!jobName || !hasAccess) return;
    setLoading(true);
    setError('');

    try {
      const data = await jenkinsService.getBuilds(jobName);
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
  }, [jobName, onLogout, hasAccess]);

  useEffect(() => {
    if (!hasAccess) return;
    fetchBuildInfo();

    const interval = setInterval(() => {
      fetchBuildInfo();
    }, 10000);
    setAutoRefresh(interval);

    return () => clearInterval(interval);
  }, [fetchBuildInfo]);

  const handleTriggerBuild = async () => {
    if (!jobName) return;

    try {
      const paramData = await jenkinsService.getJobParameters(jobName);

      if (paramData.hasParameters && paramData.parameters.length > 0) {
        setJobParameters(paramData.parameters);
        setShowParametersModal(true);
      } else {
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
      await jenkinsService.triggerBuild(jobName, parameters);
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

  const handleViewStages = ({ jobName: jn, build }) => {
    if (!jn || !build?.buildNumber) return;
    navigate(`/pipeline/${encodeURIComponent(jn)}/build/${build.buildNumber}/stages`);
  };

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
            {!hasAccess ? (
              <>
                <div className="panel-header">
                  <div className="panel-header-main">
                    <button className="ghost-button" type="button" onClick={() => navigate('/')}>
                      Back
                    </button>
                    <h2>Access Denied</h2>
                  </div>
                </div>
                <div className="muted-card">
                  <p>You do not have access to pipeline <strong>{jobName}</strong>. Contact an administrator.</p>
                </div>
              </>
            ) : (
              <>
                <div className="panel-header">
                  <div className="panel-header-main">
                    <button className="ghost-button" type="button" onClick={() => navigate('/')}>
                      Back
                    </button>
                    <h2>{jobName}</h2>
                  </div>
                  {lastUpdated && (
                    <span className="panel-meta">Updated {lastUpdated.toLocaleTimeString()}</span>
                  )}
                </div>

                <div className="pipeline-actions">
                  <div className="job-actions">
                    <button
                      className="ghost-button"
                      onClick={fetchBuildInfo}
                      disabled={loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      className="primary-button"
                      onClick={handleTriggerBuild}
                      disabled={triggering || !canTrigger}
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
                    jobName={jobName}
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

      <footer className="app-footer">
        Jenkins Monitor · Suprajit Technology Center
      </footer>
    </div>
  );
}

export default PipelineDetail;
