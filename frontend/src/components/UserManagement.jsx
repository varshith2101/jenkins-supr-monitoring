import { useState } from 'react';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

function UserManagement({
  users,
  loading,
  error,
  availableJobs,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'viewer',
    displayName: '',
    manager: '',
    pipelines: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError('');
    try {
      await onCreate(form);
      setForm({
        username: '',
        password: '',
        role: 'viewer',
        displayName: '',
        manager: '',
        pipelines: [],
      });
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = availableJobs?.filter((job) =>
    job.toLowerCase().includes(pipelineSearch.trim().toLowerCase())
  );

  return (
    <div className="user-management">
      <form className="user-form user-section" onSubmit={handleCreate}>
        <div className="user-section-header">
          <div>
            <h3>Create user</h3>
            <p className="muted-text">Add a new team member and assign access.</p>
          </div>
        </div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange('username')}
            required
          />
          <input
            type="text"
            placeholder="Display name"
            value={form.displayName}
            onChange={handleChange('displayName')}
          />
        </div>
        <div className="form-row">
          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
          <select value={form.role} onChange={handleChange('role')}>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Manager"
            value={form.manager}
            onChange={handleChange('manager')}
          />
        </div>
        <div className="pipeline-selector">
          <label>Accessible Pipelines (leave empty for all):</label>
          <div className="pipeline-search">
            <input
              type="text"
              placeholder="Search pipelines..."
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
            />
          </div>
          <div className="pipeline-list">
            {filteredJobs && filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <label key={job} className="pipeline-checkbox pipeline-checkbox--fancy">
                  <input
                    type="checkbox"
                    checked={form.pipelines.includes(job)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({
                          ...form,
                          pipelines: [...form.pipelines, job],
                        });
                      } else {
                        setForm({
                          ...form,
                          pipelines: form.pipelines.filter((p) => p !== job),
                        });
                      }
                    }}
                  />
                  <span className="pipeline-check"></span>
                  <span>{job}</span>
                </label>
              ))
            ) : (
              <p className="muted-text">No pipelines available</p>
            )}
          </div>
        </div>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create user'}
        </button>
        {actionError && <div className="error-message">{actionError}</div>}
      </form>

      <div className="user-list user-section">
        <div className="user-section-header">
          <div>
            <h3>Active users</h3>
            <p className="muted-text">Manage roles, pipelines, and ownership.</p>
          </div>
        </div>
        {loading ? (
          <div className="muted-card">Loading users...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="user-table">
            {users
              .filter((u) => u.role !== 'admin')
              .map((user) => (
              <div key={user.username} className="user-row">
                <div className="user-info-col">
                  <p className="user-name">{user.displayName || user.username}</p>
                  <p className="user-handle">@{user.username}</p>
                  <p className="user-meta">Manager: {user.manager || 'N/A'}</p>
                </div>
                <div className="user-actions">
                  <select
                    value={user.role}
                    onChange={async (event) => {
                      setActionError('');
                      try {
                        await onUpdate(user.username, { role: event.target.value });
                      } catch (err) {
                        setActionError(
                          err?.response?.data?.error || 'Failed to update user'
                        );
                      }
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <details>
                    <summary className="ghost-button">
                      Pipelines
                    </summary>
                    <div className="pipeline-list">
                      <div className="pipeline-search">
                        <input
                          type="text"
                          placeholder="Search pipelines..."
                          value={pipelineSearch}
                          onChange={(e) => setPipelineSearch(e.target.value)}
                        />
                      </div>
                      {filteredJobs && filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                          <label key={job} className="pipeline-checkbox pipeline-checkbox--fancy">
                            <input
                              type="checkbox"
                              checked={
                                user.pipelines && user.pipelines.includes(job)
                              }
                              onChange={async (e) => {
                                setActionError('');
                                try {
                                  const newPipelines = e.target.checked
                                    ? [...(user.pipelines || []), job]
                                    : (user.pipelines || []).filter((p) => p !== job);
                                  await onUpdate(user.username, {
                                    pipelines: newPipelines,
                                  });
                                } catch (err) {
                                  setActionError(
                                    err?.response?.data?.error ||
                                      'Failed to update pipelines'
                                  );
                                }
                              }}
                            />
                            <span className="pipeline-check"></span>
                            <span>{job}</span>
                          </label>
                        ))
                      ) : (
                        <p className="muted-text">No pipelines</p>
                      )}
                    </div>
                  </details>
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={async () => {
                      setActionError('');
                      try {
                        await onDelete(user.username);
                      } catch (err) {
                        setActionError(
                          err?.response?.data?.error || 'Failed to remove user'
                        );
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
