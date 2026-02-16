import { useState } from 'react';
import { authService } from '../services/authService';
import logo from '../main-logo-2.png';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      onLogin({
        username: data.username,
        role: data.role || 'viewer',
        displayName: data.displayName || data.username,
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Network error. Please check if the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left / top colored section */}
        <div className="login-logo-section">
          <div className="login-logo-content">
            <img src={logo} alt="Suprajit Logo" />
            <h1>Jenkins</h1>
            <p className="login-subtitle">Controlled Access</p>
          </div>
        </div>

        {/* Right section (desktop only — hidden on mobile) */}
        <div className="login-form-section">
          <div className="login-form-container">
            <h2 className="login-form-title">Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

        {/* Mobile-only login form — rendered inside the colored section */}
        <div className="login-form-mobile">
          <div className="login-form-container">
            <h2 className="login-form-title">Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
