import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import UserManagement from './UserManagement';
import { jenkinsService } from '../services/jenkinsService';
import { userService } from '../services/userService';

function AccessManagement({ user, onLogout, onBack }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [allAvailableJobs, setAllAvailableJobs] = useState([]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const data = await userService.getUsers();
      setUsers(data.users || []);

      const jobsData = await jenkinsService.getJobs();
      setAllAvailableJobs(jobsData.jobs?.map((job) => job.name) || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      } else {
        setUsersError('Failed to load users');
      }
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreate = async (payload) => {
    await userService.createUser(payload);
    fetchUsers();
  };

  const handleUserUpdate = async (username, payload) => {
    try {
      await userService.updateUser(username, payload);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
      throw err;
    }
  };

  const handleUserDelete = async (username) => {
    try {
      await userService.deleteUser(username);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
      throw err;
    }
  };

  return (
    <div className="dashboard-screen">
      <Navbar actionLabel="Back to Dashboard" onAction={onBack} />
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="brand">
            <p className="brand-kicker">Jenkins Team</p>
            <h1>Access Management</h1>
            <p className="brand-subtitle">Manage roles, users, and pipeline access</p>
          </div>
          <div className="user-info">
            <div className="user-chip">
              <div className="user-name">{user?.displayName || user?.username}</div>
              <div className="user-role">{user?.role?.toUpperCase()}</div>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container dashboard-container-narrow">
        <section className="dashboard-grid dashboard-grid-single">
          <div className="panel panel-primary">
            <div className="panel-header">
              <h2>Access & Governance</h2>
              <span className="panel-meta">Admin only</span>
            </div>
            <UserManagement
              users={users}
              loading={usersLoading}
              error={usersError}
              availableJobs={allAvailableJobs}
              onCreate={handleUserCreate}
              onUpdate={handleUserUpdate}
              onDelete={handleUserDelete}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default AccessManagement;
