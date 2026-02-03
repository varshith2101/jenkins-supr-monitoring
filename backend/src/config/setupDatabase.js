import { testConnection, initDatabase } from './database.js';
import { config } from './config.js';
import UserDB from '../models/UserDB.js';

async function seedDatabase() {
  try {
    const adminUsername = config.adminUsername || 'admin';
    const adminPassword = config.adminPassword || 'admin123';
    const viewerUsername = config.viewerUsername || 'viewer';
    const viewerPassword = config.viewerPassword || 'viewer123';

    // Check if admin user exists
    const adminExists = await UserDB.findByUsername(adminUsername);

    if (!adminExists) {
      console.log('Creating default admin user...');
      await UserDB.create({
        username: adminUsername,
        password: adminPassword,
        displayName: 'Administrator',
        role: 'admin',
        pipelines: [],
      });
      console.log(`✓ Default admin user created (username: ${adminUsername})`);
      console.log('  ⚠️  IMPORTANT: Change the admin password immediately!');
    }

    // Check if viewer user exists
    const viewerExists = await UserDB.findByUsername(viewerUsername);

    if (!viewerExists) {
      console.log('Creating default viewer user...');
      await UserDB.create({
        username: viewerUsername,
        password: viewerPassword,
        displayName: 'Investor View',
        role: 'viewer',
        pipelines: [],
      });
      console.log(`✓ Default viewer user created (username: ${viewerUsername})`);
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
