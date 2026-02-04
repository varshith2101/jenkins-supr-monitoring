import { formatStatus, formatDuration, formatTimestamp, getStatusClass } from '../utils/formatters';
import easterEggImage from '../assets/asset.png';

function BuildModal({ build, onClose, onViewLogs, canViewLogs }) {
  if (!build) return null;

  const isEasterEgg = Number(build.buildNumber) === 696969;

  const statusClass = getStatusClass(build.status);
  const statusValue = String(build.status || '').toLowerCase();
  const isFailedStage = ['failure', 'failed', 'aborted'].includes(statusValue);
  const failedStageLabel = build.failedStage || 'Unknown Stage';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEasterEgg ? 'KAAM DEKH SAALE' : `Build #${build.buildNumber} Details`}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isEasterEgg ? (
            <div className="build-modal-easter-egg">
              <img
                src={easterEggImage}
                alt="Easter egg"
                className="build-modal-easter-egg-image"
              />
            </div>
          ) : (
            <div className="build-modal-grid">
              <div className="build-modal-stat">
                <div className="build-modal-label">Build Number</div>
                <div className="build-modal-value">#{build.buildNumber}</div>
              </div>

              <div className="build-modal-stat">
                <div className="build-modal-label">Status</div>
                <div className={`status-pill ${statusClass}`}>
                  {formatStatus(build.status)}
                </div>
              </div>

              {build.currentStage && build.status === 'IN_PROGRESS' && (
                <div className="build-modal-stat">
                  <div className="build-modal-label">Current Stage</div>
                  <div className="build-modal-value stage-indicator">{build.currentStage}</div>
                </div>
              )}

              <div className="build-modal-stat">
                <div className="build-modal-label">
                  {isFailedStage ? 'Failed Stage' : 'Duration'}
                </div>
                <div className={`build-modal-value${isFailedStage ? ' failed-stage-badge' : ''}`}>
                  {isFailedStage ? failedStageLabel : formatDuration(build.duration)}
                </div>
              </div>

              <div className="build-modal-stat">
                <div className="build-modal-label">Timestamp</div>
                <div className="build-modal-value">{formatTimestamp(build.timestamp)}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {canViewLogs && (
            <button className="primary-button" onClick={onViewLogs}>
              View Logs
            </button>
          )}
          <button className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default BuildModal;
