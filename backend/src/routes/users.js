import express from 'express';
import UserModel from '../models/User.js';
import { authenticateToken, authorizePermissions, availableRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, authorizePermissions(['user:manage']));

router.get('/users', (req, res) => {
  const users = UserModel.getAllUsers();
  res.json({ users });
});

router.post('/users', (req, res) => {
  const { username, password, role, displayName, pipelines } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  if (role && !availableRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  try {
    const user = UserModel.createUser({
      username,
      password,
      role: role || 'viewer',
      displayName,
      pipelines: Array.isArray(pipelines) ? pipelines : [],
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:username', (req, res) => {
  const { username } = req.params;
  const { password, role, displayName, pipelines } = req.body;

  if (role && !availableRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const user = UserModel.updateUser(username, {
    password,
    role,
    displayName,
    pipelines: Array.isArray(pipelines) ? pipelines : undefined,
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

router.delete('/users/:username', (req, res) => {
  const { username } = req.params;

  const deleted = UserModel.deleteUser(username);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ success: true });
});

export default router;
