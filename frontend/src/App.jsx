import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AccessManagement from './components/AccessManagement';
import AccessDenied from './components/AccessDenied';
import PipelineDetail from './components/PipelineDetail';
import PipelineStagesRoute from './components/PipelineStagesRoute';
import { authService } from './services/authService';

/* Guard: if not logged in, redirect to /login and remember where user wanted to go */
function RequireAuth({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/* Guard: admin-only pages */
function RequireAdmin({ user, children, onLogout }) {
  const navigate = useNavigate();

  if (user?.role !== 'admin') {
    return <AccessDenied user={user} onLogout={onLogout} onBack={() => navigate('/')} />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (profile, redirectTo) => {
    setUser(profile);
    navigate(redirectTo || '/', { replace: true });
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  /* Wait for the auth check so we don't flash the login page */
  if (!authChecked) return null;

  return (
    <div className="app">
      <Routes>
        {/* Login — if already logged in, go to dashboard */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/" replace />
              : <Login onLogin={handleLogin} />
          }
        />

        {/* Dashboard — pipeline list */}
        <Route
          path="/"
          element={
            <RequireAuth user={user}>
              <Dashboard
                user={user}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />

        {/* Pipeline detail — build info for a specific job */}
        <Route
          path="/pipeline/:jobName"
          element={
            <RequireAuth user={user}>
              <PipelineDetail
                user={user}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />

        {/* Pipeline stages — stages for a specific build */}
        <Route
          path="/pipeline/:jobName/build/:buildNumber/stages"
          element={
            <RequireAuth user={user}>
              <PipelineStagesRoute
                user={user}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />

        {/* Access management — admin only */}
        <Route
          path="/access"
          element={
            <RequireAuth user={user}>
              <RequireAdmin user={user} onLogout={handleLogout}>
                <AccessManagement
                  user={user}
                  onLogout={handleLogout}
                />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        {/* Catch-all → dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
