# Changelog

## [v1.1.0] - Dynamic Job Discovery Update

### Added

1. **Dynamic Job Fetching**
   - Frontend now automatically fetches all Jenkins jobs via API
   - No more hardcoded job list in JobSelector component
   - Dropdown dynamically populates with all available Jenkins jobs
   - Works with any pipeline you create in Jenkins

2. **Brew Jenkins Support**
   - Added comprehensive documentation for using Homebrew Jenkins
   - Step-by-step guide for creating V_jenkins user
   - Instructions for creating custom pipeline stages
   - Full integration with external Jenkins instance

3. **Enhanced User Experience**
   - Loading states while fetching jobs
   - Error handling for job fetch failures
   - Disabled state when no jobs available
   - Clear messaging for all states

### Changed

**Frontend Changes:**

1. **Dashboard.jsx**
   - Added `jobs`, `jobsLoading`, `jobsError` state variables
   - Added `fetchJobs()` function to call Jenkins API
   - Fetch jobs on component mount
   - Pass job data to JobSelector component

2. **JobSelector.jsx**
   - Removed hardcoded `test-pipeline` option
   - Now accepts `jobs`, `jobsLoading`, `jobsError` props
   - Dynamically renders job list from API data
   - Shows appropriate messages for different states:
     - "Loading jobs..." while fetching
     - "Error loading jobs" on failure
     - "No jobs available" when Jenkins has no jobs
     - "Select a job" when jobs are loaded
   - Disables dropdown during loading or error states

3. **README.md**
   - Added "Option A: Using Brew Jenkins (macOS)" section
   - Complete brew Jenkins setup instructions
   - Pipeline creation examples
   - User management guide
   - Updated features to mention "Dynamic Job Discovery"

### Backend

No changes required - `/api/jobs` endpoint already existed and works correctly.

### How to Use

**For Brew Jenkins Users:**

1. Start Jenkins:
   ```bash
   brew services start jenkins-lts
   ```

2. Setup V_jenkins user at http://localhost:8080

3. Create any pipeline jobs with custom stages

4. Start the dashboard:
   ```bash
   docker-compose -f docker-compose.external-jenkins.yml up -d --build
   ```

5. Open https://localhost and login

6. **All your Jenkins jobs will appear in the dropdown automatically!**

7. Select any job to monitor builds

**What You Can Monitor:**

- ✅ Any pipeline with any name
- ✅ Any number of stages
- ✅ Custom stage names
- ✅ Multiple jobs (switch between them)
- ✅ All builds from each job

### Breaking Changes

None - fully backward compatible.

### Migration

If you were using the old version:
1. Rebuild frontend: `docker-compose -f docker-compose.external-jenkins.yml up -d --build frontend`
2. No other changes needed
3. Your existing jobs will appear automatically

### Files Modified

- `frontend/src/components/Dashboard.jsx` - Added job fetching
- `frontend/src/components/JobSelector.jsx` - Made dynamic
- `README.md` - Added brew Jenkins instructions

### Testing

Tested with:
- ✅ Brew Jenkins (jenkins-lts)
- ✅ External Jenkins on localhost:8080
- ✅ Empty job list (shows appropriate message)
- ✅ Multiple jobs (all appear in dropdown)
- ✅ Job switching (works seamlessly)
- ✅ Authentication (JWT still works)
- ✅ Auto-refresh (continues working)

### Known Issues

None

### Future Enhancements

- Add job refresh button
- Add job search/filter
- Show job status badges
- Display last build status next to job name
