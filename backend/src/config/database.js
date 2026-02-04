import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

// Initialize PostgreSQL connection pool (local database)
const pool = new Pool({
  connectionString: config.databaseUrl
});

// Test database connection
export async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database URL configured:', config.databaseUrl ? 'Yes' : 'No');
    const result = await pool.query('SELECT version()');
    console.log('✓ Database connection established successfully');
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Initialize database schema
export async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        display_name VARCHAR(255),
        manager VARCHAR(255),
        pipelines TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns for schema changes (non-destructive)
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS manager VARCHAR(255)
    `);

    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN role SET DEFAULT 'user'
    `);

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        username VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(255),
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on audit_logs for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)
    `);

    console.log('✓ Database tables initialized');
    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    return false;
  }
}

export { pool };
