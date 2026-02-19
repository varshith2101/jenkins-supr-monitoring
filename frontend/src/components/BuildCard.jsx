import { formatStatus, formatDuration, formatTimestamp, getStatusClass } from '../utils/formatters';

function BuildCard({ build, canViewStages, onViewStages, onSelectBuild, onViewParameters }) {
  const statusClass = getStatusClass(build.status);
  const statusValue = String(build.status || '').toLowerCase();
  const isFailureStage = ['failure', 'failed'].includes(statusValue);
  const isAbortedStage = statusValue === 'aborted';
  const failedStageLabel = build.failedStage || 'Unknown Stage';
  const detailLabel = isFailureStage ? 'Failed Stage' : isAbortedStage ? 'Result' : 'Duration';
  const detailValue = isFailureStage
    ? failedStageLabel
    : isAbortedStage
      ? 'Aborted'
      : formatDuration(build.duration);

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
        {build.hasParameters && (
          <button
            type="button"
            className="view-logs-button"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onViewParameters?.();
            }}
          >
            View Params
          </button>
        )}
      </div>
      {build.currentStage && build.status === 'IN_PROGRESS' && (
        <div className="build-detail">
          <div className="build-detail-label">Current Stage</div>
          <div className="build-detail-value stage-indicator">{build.currentStage}</div>
        </div>
      )}
      <div className="build-detail">
        <div className="build-detail-label">
          {detailLabel}
        </div>
        <div className={`build-detail-value${isFailureStage ? ' failed-stage-badge' : ''}`}>
          {detailValue}
        </div>
        {canViewStages && (
          <button
            type="button"
            className="view-logs-button"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
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
