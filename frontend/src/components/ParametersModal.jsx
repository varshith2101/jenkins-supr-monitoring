import { useState } from 'react';
import { createPortal } from 'react-dom';

function ParametersModal({ parameters, onSubmit, onClose, triggering }) {
  const [paramValues, setParamValues] = useState(() => {
    const initial = {};
    parameters.forEach(param => {
      initial[param.name] = param.defaultValue || '';
    });
    return initial;
  });

  const handleChange = (paramName, value) => {
    setParamValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paramValues);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Build Parameters</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="parameters-form">
              {parameters.map(param => (
                <div key={param.name} className="parameter-field">
                  <label htmlFor={param.name}>
                    {param.name}
                    {param.description && (
                      <span className="parameter-description">{param.description}</span>
                    )}
                  </label>
                  
                  {param.choices && param.choices.length > 0 ? (
                    <select
                      id={param.name}
                      value={paramValues[param.name]}
                      onChange={(e) => handleChange(param.name, e.target.value)}
                      className="parameter-input"
                    >
                      {param.choices.map(choice => (
                        <option key={choice} value={choice}>{choice}</option>
                      ))}
                    </select>
                  ) : param.type === 'BooleanParameterDefinition' ? (
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        id={param.name}
                        checked={paramValues[param.name] === 'true' || paramValues[param.name] === true}
                        onChange={(e) => handleChange(param.name, e.target.checked.toString())}
                        className="parameter-checkbox"
                      />
                      <label htmlFor={param.name} className="checkbox-label">Enable</label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id={param.name}
                      value={paramValues[param.name]}
                      onChange={(e) => handleChange(param.name, e.target.value)}
                      className="parameter-input"
                      placeholder={param.defaultValue || ''}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="submit" className="primary-button" disabled={triggering}>
              {triggering ? 'Triggering...' : 'Trigger Build'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ParametersModal;
