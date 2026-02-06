import { formatStatus, formatDuration, formatTimestamp, getStatusClass } from '../utils/formatters';

function BuildCard({ build, canViewStages, onViewStages, onSelectBuild }) {
  const statusClass = getStatusClass(build.status);
  const statusValue = String(build.status || '').toLowerCase();
  const isFailedStage = ['failure', 'failed', 'aborted'].includes(statusValue);
  const failedStageLabel = build.failedStage || 'Unknown Stage';

  return (
    <div
      className={`build-card ${statusClass}`}
      onClick={onSelectBuild}
      role={onSelectBuild ? 'button' : undefined}
      tabIndex={onSelectBuild ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onSelectBuild) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectBuild();
        }
      }}
    >
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
        <div className="build-detail-label">
          {isFailedStage ? 'Failed Stage' : 'Duration'}
        </div>
        <div className={`build-detail-value${isFailedStage ? ' failed-stage-badge' : ''}`}>
          {isFailedStage ? failedStageLabel : formatDuration(build.duration)}
        </div>
        {canViewStages && (
          <button
            type="button"
            className="view-logs-button"
            onClick={(event) => {
              event.stopPropagation();
              onViewStages?.();
            }}
          >
            View Stages
          </button>
        )}
      </div>
      <div className="build-detail">
        <div className="build-detail-label">Timestamp</div>
        <div className="build-detail-value">{formatTimestamp(build.timestamp)}</div>
      </div>
    </div>
  );
}

export default BuildCard;
