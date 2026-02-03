import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const rolePermissions = {
  admin: ['build:read', 'build:trigger', 'user:manage'],
  user: ['build:read', 'build:trigger'],
  viewer: ['build:read'],
};

export const availableRoles = Object.keys(rolePermissions);

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

export const authorizePermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    const role = req.user?.role;
    const permissions = rolePermissions[role] || [];

    const hasPermission = requiredPermissions.some((permission) =>
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    next();
  };
};

export const generateToken = (username, role) => {
  return jwt.sign({ username, role }, config.jwtSecret, { expiresIn: '24h' });
};
