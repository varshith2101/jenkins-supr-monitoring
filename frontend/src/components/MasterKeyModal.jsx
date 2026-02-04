import { useState } from 'react';

function MasterKeyModal({ onSubmit, onClose, submitting }) {
  const [masterKey, setMasterKey] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(masterKey);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Insert master key</h2>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="parameter-field">
              <label htmlFor="master-key-input">Master key</label>
              <input
                id="master-key-input"
                type="password"
                className="parameter-input"
                value={masterKey}
                onChange={(event) => setMasterKey(event.target.value)}
                placeholder="Insert master key"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MasterKeyModal;
