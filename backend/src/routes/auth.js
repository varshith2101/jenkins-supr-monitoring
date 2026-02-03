import express from 'express';
import UserDB from '../models/UserDB.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    const user = await UserDB.authenticate(username, password);

    if (!user) {
      // Log failed login attempt
      await AuditLog.logAction({
        userId: null,
        username,
        action: 'login',
        resource: null,
        details: { reason: 'Invalid credentials' },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success: false,
        errorMessage: 'Invalid credentials',
      });

      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Log successful login
    await AuditLog.logAction({
      userId: user.id,
      username: user.username,
      action: 'login',
      resource: null,
      details: { role: user.role },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      success: true,
    });

    const token = generateToken(user.username, user.role);
    res.json({
      token,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
      pipelines: user.pipelines || [],
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await UserDB.findByUsername(req.user.username);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      username: user.username,
      role: user.role,
      displayName: user.display_name,
      pipelines: user.pipelines || [],
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: 'Failed to get user information.' });
  }
});

export default router;
