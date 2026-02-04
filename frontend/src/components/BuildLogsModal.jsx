function BuildLogsModal({ build, logs, command, loading, error, onClose }) {
  if (!build) return null;

  return (
    <div className="modal-overlay modal-overlay-logs" onClick={onClose}>
      <div className="modal-content logs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Build #{build.buildNumber} Logs</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="logs-command-row">
            <div className="logs-command-label">Command</div>
            <div className="logs-command-value">
              {command || 'Pipeline'}
            </div>
          </div>

          {loading && (
            <div className="logs-loading">Loading logs...</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && (
            <pre className="logs-output">
              {logs || 'No logs available for this build.'}
            </pre>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default BuildLogsModal;
