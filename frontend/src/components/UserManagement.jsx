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
    pipelines: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

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
        pipelines: [],
      });
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-management">
      <form className="user-form" onSubmit={handleCreate}>
        <h3>Create user</h3>
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
        <div className="pipeline-selector">
          <label>Accessible Pipelines (leave empty for all):</label>
          <div className="pipeline-list">
            {availableJobs && availableJobs.length > 0 ? (
              availableJobs.map((job) => (
                <label key={job} className="pipeline-checkbox">
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

      <div className="user-list">
        <h3>Active users</h3>
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
                <div>
                  <p className="user-name">{user.displayName || user.username}</p>
                  <p className="user-handle">@{user.username}</p>
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
                      {availableJobs && availableJobs.length > 0 ? (
                        availableJobs.map((job) => (
                          <label key={job} className="pipeline-checkbox">
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
