import BuildCard from './BuildCard';
import { formatStatus, formatDuration, getStatusClass } from '../utils/formatters';

function BuildInfo({ data }) {
  const { builds, lastBuild } = data;

  if (!lastBuild) {
    return (
      <div className="error-message">No build information available</div>
    );
  }

  const previousBuilds = builds.slice(1);

  const statusClass = getStatusClass(lastBuild.status);
  const stageClass = getStatusClass(lastBuild.stage4Status);

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
        <div className="stat-card">
          <div className="stat-label">Stage 4 Status</div>
          <div className={`status-pill ${stageClass}`}>
            {formatStatus(lastBuild.stage4Status)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Duration</div>
          <div className="stat-value">{formatDuration(lastBuild.duration)}</div>
        </div>
      </div>

      {previousBuilds.length > 0 && (
        <>
          <h2>Previous Builds</h2>
          <div className="previous-builds">
            {previousBuilds.map((build) => (
              <BuildCard key={build.buildNumber} build={build} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default BuildInfo;
