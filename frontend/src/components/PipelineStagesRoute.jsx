import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PipelineStagesPage from './PipelineStagesPage';
import { jenkinsService } from '../services/jenkinsService';
import logo from '../main-logo-2.png';

/**
 * Route-level wrapper that reads jobName + buildNumber from the URL,
 * fetches full build info (status, failedStage, etc.), and renders
 * the existing PipelineStagesPage component.
 */
function PipelineStagesRoute({ user, onLogout }) {
  const { jobName: rawJobName, buildNumber } = useParams();
  const jobName = decodeURIComponent(rawJobName);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const [build, setBuild] = useState(null);
  const [buildLoading, setBuildLoading] = useState(true);
  const [buildError, setBuildError] = useState('');

  /* Pipeline access check */
  const userPipelines = user?.pipelines || [];
  const hasAccess = user?.role === 'admin' || userPipelines.length === 0 || userPipelines.includes(jobName);

  useEffect(() => {
    if (!hasAccess) return;
    let cancelled = false;

    const fetchBuild = async () => {
      setBuildLoading(true);
      setBuildError('');
      try {
        const data = await jenkinsService.getBuildByNumber(jobName, buildNumber);
        if (!cancelled) setBuild(data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          onLogout();
        } else if (!cancelled) {
          setBuildError('Unable to load build information.');
        }
      } finally {
        if (!cancelled) setBuildLoading(false);
      }
    };

    fetchBuild();
    return () => { cancelled = true; };
  }, [jobName, buildNumber, onLogout, hasAccess]);

  const handleBack = () => {
    navigate(`/pipeline/${encodeURIComponent(jobName)}`);
  };

  /* Render access denied inline if user doesn't have pipeline access */
  const renderAccessDenied = () => (
    <div className="dashboard-container dashboard-container-narrow">
      <section className="dashboard-grid dashboard-grid-single">
        <div className="panel panel-primary">
          <div className="panel-header">
            <div className="panel-header-main">
              <button className="ghost-button" type="button" onClick={() => navigate('/')}>Back</button>
              <h2>Access Denied</h2>
            </div>
          </div>
          <div className="muted-card">
            <p>You do not have access to pipeline <strong>{jobName}</strong>. Contact an administrator.</p>
          </div>
        </div>
      </section>
    </div>
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

      {!hasAccess ? renderAccessDenied() : (
        <div className="dashboard-container dashboard-container-wide">
          <section className="dashboard-grid dashboard-grid-single">
            <div className="panel panel-primary">
              {buildLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Loading build information...</p>
                </div>
              ) : buildError ? (
                <div className="error-message">{buildError}</div>
              ) : build ? (
                <PipelineStagesPage
                  jobName={jobName}
                  build={build}
                  onBack={handleBack}
                  onLogout={onLogout}
                />
              ) : null}
            </div>
          </section>
        </div>
      )}

      <footer className="app-footer">
        Jenkins Monitor · Suprajit Technology Center
      </footer>
    </div>
  );
}

export default PipelineStagesRoute;
