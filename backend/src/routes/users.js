import express from 'express';
import UserDB from '../models/UserDB.js';
import { authenticateToken, authorizePermissions, availableRoles } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.use(authenticateToken, authorizePermissions(['user:manage']));

router.get('/users', async (req, res) => {
  try {
    const users = await UserDB.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/users', async (req, res) => {
  const { username, password, role, displayName, lead, pipelines } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  if (!lead || !lead.trim()) {
    return res.status(400).json({ error: 'Lead cant be empty' });
  }

  if (role && !availableRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  if (role && !['user', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Only user and viewer roles can be created.' });
  }

  try {
    const user = await UserDB.create({
      username,
      password,
      role: role || 'user',
      displayName,
      lead,
      pipelines: Array.isArray(pipelines) ? pipelines : [],
    });

    // Log user creation
    const currentUser = await UserDB.findByUsername(req.user.username);
    await AuditLog.logAction({
      userId: currentUser?.id,
      username: req.user.username,
      action: 'create_user',
      resource: username,
      details: { role: user.role, lead: user.lead },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      success: true,
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:username', async (req, res) => {
  const { username } = req.params;
  const { password, role, displayName, lead, pipelines } = req.body;

  if (role && !availableRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  if (role && !['user', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Only user and viewer roles are allowed.' });
  }

  if (lead !== undefined && !lead.trim()) {
    return res.status(400).json({ error: 'Lead cant be empty' });
  }

  try {
    const user = await UserDB.update(username, {
      password,
      role,
      displayName,
      lead,
      pipelines: Array.isArray(pipelines) ? pipelines : undefined,
    });

    // Log user update
    const currentUser = await UserDB.findByUsername(req.user.username);
    await AuditLog.logAction({
      userId: currentUser?.id,
      username: req.user.username,
      action: 'update_user',
      resource: username,
      details: { updates: { role, displayName, lead, pipelines: pipelines?.length } },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      success: true,
    });

    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.delete('/users/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const deleted = await UserDB.delete(username);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Log user deletion
    const currentUser = await UserDB.findByUsername(req.user.username);
    await AuditLog.logAction({
      userId: currentUser?.id,
      username: req.user.username,
      action: 'delete_user',
      resource: username,
      details: {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      success: true,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
