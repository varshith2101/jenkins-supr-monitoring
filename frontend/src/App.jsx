import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AccessManagement from './components/AccessManagement';
import AccessDenied from './components/AccessDenied';
import { authService } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(storedUser);
    }
  }, []);

  const handleLogin = (profile) => {
    setIsAuthenticated(true);
    setUser(profile);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveView('dashboard');
  };

  const handleAccessManagement = () => {
    setActiveView('access');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  return (
    <div className="app">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : activeView === 'access' ? (
        user?.role === 'admin' ? (
          <AccessManagement
            user={user}
            onLogout={handleLogout}
            onBack={handleBackToDashboard}
          />
        ) : (
          <AccessDenied user={user} onLogout={handleLogout} onBack={handleBackToDashboard} />
        )
      ) : (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onAccessManagement={handleAccessManagement}
        />
      )}
    </div>
  );
}

export default App;
