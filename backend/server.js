import express from 'express';
import cors from 'cors';
import { config } from './src/config/config.js';
import { setupDatabase } from './src/config/setupDatabase.js';
import { rateLimiterMiddleware } from './src/middleware/rateLimiter.js';
import authRoutes from './src/routes/auth.js';
import buildsRoutes from './src/routes/builds.js';
import usersRoutes from './src/routes/users.js';

const app = express();
const PORT = config.port;

// Middleware
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use('/api', rateLimiterMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'jenkins-monitor-backend' });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', buildsRoutes);
app.use('/api', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Setup database connection and seed initial data
    await setupDatabase();

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`Jenkins URL: ${config.jenkinsUrl}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
