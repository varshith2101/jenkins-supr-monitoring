import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

const SALT_ROUNDS = 10;

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const UserDB = {
  /**
   * Find user by username
   */
  async findByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user:', error.message);
      return null;
    }
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error.message);
      return null;
    }
  },

  /**
   * Authenticate user with username and password
   */
  async authenticate(username, password) {
    try {
      const user = await this.findByUsername(username);
      if (!user) return null;

      // Compare password with bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;

      return user;
    } catch (error) {
      console.error('Authentication error:', error.message);
      return null;
    }
  },

  /**
   * Get all users (without passwords)
   */
  async getAllUsers() {
    try {
      const result = await pool.query(
        'SELECT id, username, role, display_name, manager, pipelines, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      return result.rows.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
        lead: user.manager,
        pipelines: user.pipelines || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));
    } catch (error) {
      console.error('Error getting all users:', error.message);
      return [];
    }
  },

  /**
   * Create new user
   */
  async create({ username, password, role = 'user', displayName, lead, pipelines = [] }) {
    try {
      // Check if user already exists
      const existing = await this.findByUsername(username);
      if (existing) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      const result = await pool.query(
        'INSERT INTO users (username, password, role, display_name, manager, pipelines) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, display_name, manager, pipelines, created_at, updated_at',
        [username, hashedPassword, role, displayName || username, lead || null, pipelines]
      );

      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
        lead: user.manager,
        pipelines: user.pipelines || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  },

  /**
   * Update user
   */
  async update(username, updates) {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (updates.password) {
        const hashedPassword = await bcrypt.hash(updates.password, SALT_ROUNDS);
        updateFields.push(`password = $${paramCount++}`);
        values.push(hashedPassword);
      }

      if (updates.role !== undefined) {
        updateFields.push(`role = $${paramCount++}`);
        values.push(updates.role);
      }

      if (updates.displayName !== undefined) {
        updateFields.push(`display_name = $${paramCount++}`);
        values.push(updates.displayName);
      }

      if (updates.lead !== undefined) {
        updateFields.push(`manager = $${paramCount++}`);
        values.push(updates.lead || null);
      }

      if (updates.pipelines !== undefined) {
        updateFields.push(`pipelines = $${paramCount++}`);
        values.push(Array.isArray(updates.pipelines) ? updates.pipelines : []);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      if (updateFields.length === 1) {
        // Only updated_at, no actual changes
        return sanitizeUser(user);
      }

      values.push(username);

      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE username = $${paramCount}
        RETURNING id, username, role, display_name, manager, pipelines, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      const updatedUser = result.rows[0];

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        displayName: updatedUser.display_name,
        lead: updatedUser.manager,
        pipelines: updatedUser.pipelines || [],
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      };
    } catch (error) {
      console.error('Error updating user:', error.message);
      throw error;
    }
  },

  /**
   * Delete user
   */
  async delete(username) {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE username = $1',
        [username]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error.message);
      return false;
    }
  },
};

export default UserDB;
