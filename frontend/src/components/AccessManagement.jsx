import { useEffect, useState, useCallback } from 'react';
import UserManagement from './UserManagement';
import { jenkinsService } from '../services/jenkinsService';
import { userService } from '../services/userService';
import logo from '../main-logo-2.png';

function AccessManagement({ user, onLogout, onBack }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [allAvailableJobs, setAllAvailableJobs] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

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
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-row">
            <div className="brand">
              <img className="brand-logo" src={logo} alt="Suprajit Logo" />
            </div>

            <button
              className={`hamburger-toggle ${mobileMenuOpen ? 'open' : ''}`}
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className={`user-info ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <button className="secondary-button access-button" type="button" onClick={() => { closeMobileMenu(); onBack(); }}>
                Back to Dashboard
              </button>
              <div className="profile-menu">
                <button className="user-chip user-chip-button" type="button">
                  <div className="user-name">{user?.displayName || user?.username}</div>
                  <div className="user-role">{user?.role?.toUpperCase()}</div>
                </button>
                <div className="profile-dropdown">
                  <button className="logout-button" onClick={() => { closeMobileMenu(); onLogout(); }} type="button">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="dashboard-subtitle">Suprajit Technology Center</p>
        </div>
      </header>

      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu} />}

      <div className="dashboard-container dashboard-container-narrow">
        <section className="dashboard-grid dashboard-grid-single">
          <div className="panel panel-primary">
            <div className="panel-header">
              <h2>Access & Governance</h2>
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
