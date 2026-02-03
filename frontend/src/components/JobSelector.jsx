function JobSelector({
  selectedJob,
  onJobChange,
  onRefresh,
  onTrigger,
  loading,
  triggering,
  canTrigger,
  triggerMessage,
  jobs,
  jobsLoading,
  jobsError,
}) {
  return (
    <div className="job-selector">
      <div className="job-select-row">
        <label htmlFor="job-select">Pipelines</label>
        <select
          id="job-select"
          className="job-select"
          value={selectedJob}
          onChange={(e) => onJobChange(e.target.value)}
          disabled={jobsLoading || jobsError || jobs.length === 0}
        >
          <option value="">
            {jobsLoading ? '-- Loading jobs... --' :
             jobsError ? '-- Error loading jobs --' :
             jobs.length === 0 ? '-- No jobs available --' :
             '-- Select a job --'}
          </option>
          {jobs.map((job) => (
            <option key={job.name} value={job.name}>
              {job.name}
            </option>
          ))}
        </select>
      </div>

      <div className="job-actions">
        <button
          className="ghost-button"
          onClick={onRefresh}
          disabled={!selectedJob || loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          className="primary-button"
          onClick={onTrigger}
          disabled={!selectedJob || triggering || !canTrigger}
        >
          {triggering ? 'Triggering...' : 'Trigger Build'}
        </button>
      </div>

      {triggerMessage && (
        <div className="status-message">{triggerMessage}</div>
      )}

      {jobsError && (
        <div className="error-message" style={{ marginTop: '10px' }}>
          {jobsError}
        </div>
      )}
    </div>
  );
}

export default JobSelector;
