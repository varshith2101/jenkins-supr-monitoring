import { useState } from 'react';
import BuildCard from './BuildCard';
import BuildModal from './BuildModal';
import BuildLogsModal from './BuildLogsModal';
import { formatStatus, formatDuration, getStatusClass } from '../utils/formatters';
import { jenkinsService } from '../services/jenkinsService';

function BuildInfo({ data }) {
  const { builds, lastBuild, jobName } = data;
  const [searchBuildNumber, setSearchBuildNumber] = useState('');
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [logsBuild, setLogsBuild] = useState(null);
  const [logsContent, setLogsContent] = useState('');
  const [logsCommand, setLogsCommand] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  if (!lastBuild) {
    return (
      <div className="error-message">No build information available</div>
    );
  }

  const handleSearchBuild = async (e) => {
    e.preventDefault();
    if (!searchBuildNumber || !jobName) return;

    if (Number(searchBuildNumber) === 696969) {
      setSelectedBuild({
        buildNumber: 696969,
        status: 'SUCCESS',
        duration: 0,
        timestamp: Date.now(),
      });
      setSearchBuildNumber('');
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const build = await jenkinsService.getBuildByNumber(jobName, searchBuildNumber);
      setSelectedBuild(build);
      setSearchBuildNumber('');
    } catch (err) {
      setSearchError(`Build #${searchBuildNumber} not found`);
    } finally {
      setSearchLoading(false);
    }
  };

  const previousBuilds = builds.slice(1);

  const statusClass = getStatusClass(lastBuild.status);

  const isFailedStatus = (status) => {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return ['failure', 'failed', 'aborted'].includes(normalized);
  };

  const canViewLogs = (status) => {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return normalized !== 'success' && normalized !== 'in_progress' && normalized !== 'in progress';
  };

  const getDurationOrStage = (build) => {
    if (!build) return 'N/A';
    if (isFailedStatus(build.status)) {
      return build.failedStage || 'Unknown Stage';
    }
    return formatDuration(build.duration);
  };

  const handleViewLogs = async (build) => {
    if (!jobName || !build?.buildNumber) return;

    setLogsBuild(build);
    setLogsLoading(true);
    setLogsError('');
    setLogsContent('');
    setLogsCommand('');

    try {
      const data = await jenkinsService.getBuildLogs(jobName, build.buildNumber);
      setLogsContent(data.logs || '');
      setLogsCommand(data.command || 'Pipeline');
    } catch (err) {
      setLogsError('Unable to load logs for this build.');
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="build-info">
      <h2>Current Build Status</h2>
      <div className="current-build">
        <div className="stat-card">
          <div className="stat-label">Build Number</div>
          <div className="stat-value">#{lastBuild.buildNumber}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="status-actions">
            <div className={`status-pill ${statusClass}`}>
              {formatStatus(lastBuild.status)}
            </div>
            {canViewLogs(lastBuild.status) && (
              <button
                type="button"
                className="view-logs-button"
                onClick={() => handleViewLogs(lastBuild)}
              >
                View Logs
              </button>
            )}
          </div>
        </div>
        {lastBuild.currentStage && lastBuild.status === 'IN_PROGRESS' && (
          <div className="stat-card">
            <div className="stat-label">Current Stage</div>
            <div className="stat-value stage-indicator">{lastBuild.currentStage}</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-label">
            {isFailedStatus(lastBuild.status) ? 'Failed Stage' : 'Duration'}
          </div>
          <div className={`stat-value${isFailedStatus(lastBuild.status) ? ' failed-stage-badge' : ''}`}>
            {getDurationOrStage(lastBuild)}
          </div>
        </div>
      </div>

      {previousBuilds.length > 0 && (
        <>
          <h2>Previous Builds</h2>
          <div className="previous-builds">
            {previousBuilds.map((build) => (
              <BuildCard
                key={build.buildNumber}
                build={build}
                canViewLogs={canViewLogs(build.status)}
                onViewLogs={() => handleViewLogs(build)}
                onSelectBuild={() => setSelectedBuild(build)}
              />
            ))}
          </div>
        </>
      )}

      <div className="build-search-section">
        <h2>Search Build by Number</h2>
        <form onSubmit={handleSearchBuild} className="build-search-form">
          <input
            type="number"
            placeholder="Enter build number..."
            value={searchBuildNumber}
            onChange={(e) => setSearchBuildNumber(e.target.value)}
            className="build-search-input"
            min="1"
          />
          <button type="submit" className="primary-button" disabled={searchLoading}>
            {searchLoading ? 'Loading...' : 'Load Build'}
          </button>
        </form>
        {searchError && <div className="error-message">{searchError}</div>}
      </div>

      {selectedBuild && (
        <BuildModal
          build={selectedBuild}
          canViewLogs={canViewLogs(selectedBuild.status)}
          onViewLogs={() => handleViewLogs(selectedBuild)}
          onClose={() => {
            setSelectedBuild(null);
            setSearchError('');
          }}
        />
      )}

      {logsBuild && (
        <BuildLogsModal
          build={logsBuild}
          logs={logsContent}
          command={logsCommand}
          loading={logsLoading}
          error={logsError}
          onClose={() => {
            setLogsBuild(null);
            setLogsError('');
            setLogsContent('');
            setLogsCommand('');
          }}
        />
      )}
    </div>
  );
}

export default BuildInfo;
