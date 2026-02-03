import { testConnection, initDatabase } from './database.js';
import UserDB from '../models/UserDB.js';

async function seedDatabase() {
  try {
    // Check if admin user exists
    const adminExists = await UserDB.findByUsername('admin');

    if (!adminExists) {
      console.log('Creating default admin user...');
      await UserDB.create({
        username: 'admin',
        password: 'admin123',
        displayName: 'Administrator',
        role: 'admin',
        pipelines: [],
      });
      console.log('✓ Default admin user created (username: admin, password: admin123)');
      console.log('  ⚠️  IMPORTANT: Change the admin password immediately!');
    }

    // Check if viewer user exists
    const viewerExists = await UserDB.findByUsername('viewer');

    if (!viewerExists) {
      console.log('Creating default viewer user...');
      await UserDB.create({
        username: 'viewer',
        password: 'viewer123',
        displayName: 'Investor View',
        role: 'viewer',
        pipelines: [],
      });
      console.log('✓ Default viewer user created (username: viewer, password: viewer123)');
    }

    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('✗ Database seeding failed:', error.message);
    throw error;
  }
}

export async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize database schema
  const initialized = await initDatabase();
  if (!initialized) {
    console.error('Failed to initialize database. Exiting...');
    process.exit(1);
  }

  // Seed default data
  await seedDatabase();

  console.log('\n✅ Database setup complete!\n');
}

export { seedDatabase };
