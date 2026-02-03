import { useState } from 'react';
import BuildCard from './BuildCard';
import BuildModal from './BuildModal';
import { formatStatus, formatDuration, getStatusClass } from '../utils/formatters';
import { jenkinsService } from '../services/jenkinsService';

function BuildInfo({ data }) {
  const { builds, lastBuild, jobName } = data;
  const [searchBuildNumber, setSearchBuildNumber] = useState('');
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  if (!lastBuild) {
    return (
      <div className="error-message">No build information available</div>
    );
  }

  const handleSearchBuild = async (e) => {
    e.preventDefault();
    if (!searchBuildNumber || !jobName) return;

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
          <div className={`status-pill ${statusClass}`}>
            {formatStatus(lastBuild.status)}
          </div>
        </div>
        {lastBuild.currentStage && lastBuild.status === 'IN_PROGRESS' && (
          <div className="stat-card">
            <div className="stat-label">Current Stage</div>
            <div className="stat-value stage-indicator">{lastBuild.currentStage}</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-label">Duration</div>
          <div className="stat-value">{formatDuration(lastBuild.duration)}</div>
        </div>
      </div>

      {previousBuilds.length > 0 && (
        <>
          <h2>Previous Builds (Last 5)</h2>
          <div className="previous-builds">
            {previousBuilds.map((build) => (
              <BuildCard key={build.buildNumber} build={build} />
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
          onClose={() => {
            setSelectedBuild(null);
            setSearchError('');
          }}
        />
      )}
    </div>
  );
}

export default BuildInfo;
