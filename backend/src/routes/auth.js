import express from 'express';
import UserModel from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const user = UserModel.authenticate(username, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = generateToken(user.username, user.role);
  res.json({
    token,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    pipelines: user.pipelines || [],
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = UserModel.findByUsername(req.user.username);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    pipelines: user.pipelines || [],
  });
});

export default router;
