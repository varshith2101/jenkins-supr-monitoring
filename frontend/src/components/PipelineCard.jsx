import { formatStatus, formatTimestamp, getStatusClass } from '../utils/formatters';

function PipelineCard({ jobName, lastBuild, hasError, onReadMore }) {
  const statusClass = getStatusClass(lastBuild?.status);

  return (
    <div className="pipeline-card">
      <div className="pipeline-card-main">
        <div>
          <p className="pipeline-name">{jobName}</p>
          {hasError && <p className="pipeline-meta error-message">Failed to load build details</p>}
        </div>
        <div className="pipeline-meta-row">
          <div className="pipeline-meta-item">
            <span className="pipeline-meta-label">Latest Build</span>
            <span className="pipeline-meta-value">
              {lastBuild?.buildNumber ? `#${lastBuild.buildNumber}` : 'N/A'}
            </span>
          </div>
          <div className="pipeline-meta-item">
            <span className="pipeline-meta-label">Status</span>
            <span className={`status-pill ${statusClass}`}>
              {formatStatus(lastBuild?.status)}
            </span>
          </div>
          <div className="pipeline-meta-item">
            <span className="pipeline-meta-label">Timestamp</span>
            <span className="pipeline-meta-value">
              {formatTimestamp(lastBuild?.timestamp)}
            </span>
          </div>
        </div>
      </div>
      <div className="pipeline-card-action">
        <button className="secondary-button" type="button" onClick={onReadMore}>
          View Pipeline
        </button>
      </div>
    </div>
  );
}

export default PipelineCard;
