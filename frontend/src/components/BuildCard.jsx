import { formatStatus, formatDuration, formatTimestamp, getStatusClass } from '../utils/formatters';

function BuildCard({ build }) {
  const statusClass = getStatusClass(build.status);

  return (
    <div className={`build-card ${statusClass}`}>
      <div className="build-detail">
        <div className="build-detail-label">Build Number</div>
        <div className="build-detail-value">#{build.buildNumber}</div>
      </div>
      <div className="build-detail">
        <div className="build-detail-label">Status</div>
        <div className={`status-pill ${getStatusClass(build.status)}`}>
          {formatStatus(build.status)}
        </div>
      </div>
      {build.currentStage && build.status === 'IN_PROGRESS' && (
        <div className="build-detail">
          <div className="build-detail-label">Current Stage</div>
          <div className="build-detail-value stage-indicator">{build.currentStage}</div>
        </div>
      )}
      <div className="build-detail">
        <div className="build-detail-label">Duration</div>
        <div className="build-detail-value">{formatDuration(build.duration)}</div>
      </div>
      <div className="build-detail">
        <div className="build-detail-label">Timestamp</div>
        <div className="build-detail-value">{formatTimestamp(build.timestamp)}</div>
      </div>
    </div>
  );
}

export default BuildCard;
