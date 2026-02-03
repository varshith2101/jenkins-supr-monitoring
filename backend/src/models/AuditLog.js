import { pool } from '../config/database.js';

const AuditLog = {
  /**
   * Log an action
   */
  async logAction({
    userId,
    username,
    action,
    resource = null,
    details = null,
    ipAddress = null,
    userAgent = null,
    success = true,
    errorMessage = null,
  }) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (
          user_id, username, action, resource, details,
          ip_address, user_agent, success, error_message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, username, action, resource, JSON.stringify(details), ipAddress, userAgent, success, errorMessage]
      );
      return true;
    } catch (error) {
      console.error('Error logging action:', error.message);
      return false;
    }
  },

  /**
   * Get logs with optional filters
   */
  async getLogs({
    username = null,
    action = null,
    limit = 100,
    offset = 0,
  } = {}) {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (username) {
        query += ` AND username = $${paramCount++}`;
        params.push(username);
      }

      if (action) {
        query += ` AND action = $${paramCount++}`;
        params.push(action);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return result.rows.map(log => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        resource: log.resource,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        success: log.success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      }));
    } catch (error) {
      console.error('Error getting logs:', error.message);
      return [];
    }
  },

  /**
   * Get recent logs for a user
   */
  async getUserLogs(username, limit = 50) {
    try {
      const result = await pool.query(
        'SELECT * FROM audit_logs WHERE username = $1 ORDER BY created_at DESC LIMIT $2',
        [username, limit]
      );

      return result.rows.map(log => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        resource: log.resource,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        success: log.success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      }));
    } catch (error) {
      console.error('Error getting user logs:', error.message);
      return [];
    }
  },

  /**
   * Get logs by action type
   */
  async getLogsByAction(action, limit = 100) {
    try {
      const result = await pool.query(
        'SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC LIMIT $2',
        [action, limit]
      );

      return result.rows.map(log => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        resource: log.resource,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        success: log.success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      }));
    } catch (error) {
      console.error('Error getting logs by action:', error.message);
      return [];
    }
  },

  /**
   * Delete old logs (older than specified days)
   */
  async deleteOldLogs(days = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${days} days'`
      );
      console.log(`Deleted ${result.rowCount} old audit logs`);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting old logs:', error.message);
      return 0;
    }
  },
};

export default AuditLog;
