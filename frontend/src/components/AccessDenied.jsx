import Navbar from './Navbar';

function AccessDenied({ user, onLogout, onBack }) {
  return (
    <div className="dashboard-screen">
      <Navbar actionLabel="Back to Dashboard" onAction={onBack} />
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="brand">
            <p className="brand-kicker">Jenkins Team</p>
            <h1>Access Denied</h1>
            <p className="brand-subtitle">You do not have permission to view this page.</p>
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
            <div className="muted-card">
              <p>Access denied. Please contact an administrator for access.</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="app-footer">
        Jenkins Monitor · Suprajit Technology Center
      </footer>
    </div>
  );
}

export default AccessDenied;
