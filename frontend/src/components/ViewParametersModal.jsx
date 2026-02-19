import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { jenkinsService } from '../services/jenkinsService';

function ViewParametersModal({ jobName, buildNumber, onClose }) {
  const [parameters, setParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchParams() {
      try {
        const data = await jenkinsService.getBuildParameters(jobName, buildNumber);
        if (!cancelled) {
          if (data.hasParameters && data.parameters.length > 0) {
            setParameters(data.parameters);
          } else {
            setParameters([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load parameters');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchParams();
    return () => { cancelled = true; };
  }, [jobName, buildNumber]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Build #{buildNumber} Parameters</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading parameters...</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!loading && !error && parameters && parameters.length === 0 && (
            <div className="view-params-empty">No parameters were used for this build.</div>
          )}

          {!loading && !error && parameters && parameters.length > 0 && (
            <div className="parameters-form">
              {parameters.map((param) => (
                <div key={param.name} className="parameter-field">
                  <label>{param.name}</label>
                  <div className="view-param-value">
                    {param.value || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ViewParametersModal;
