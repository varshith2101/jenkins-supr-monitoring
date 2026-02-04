import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repo root and/or current working directory
const repoRootEnv = path.resolve(__dirname, '../../../.env');
const cwdEnv = path.resolve(process.cwd(), '.env');

if (fs.existsSync(repoRootEnv)) {
  dotenv.config({ path: repoRootEnv });
}

if (cwdEnv !== repoRootEnv && fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
}

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || '',
  jenkinsUrl: process.env.JENKINS_URL || '',
  jenkinsUser: process.env.JENKINS_USER || '',
  jenkinsToken: process.env.JENKINS_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  viewerUsername: process.env.VIEWER_USERNAME || '',
  viewerPassword: process.env.VIEWER_PASSWORD || '',
  rateLimit: {
    points: Number(process.env.RATE_LIMIT_POINTS || 120),
    durationSeconds: Number(process.env.RATE_LIMIT_DURATION || 60),
    blockSeconds: Number(process.env.RATE_LIMIT_BLOCK_DURATION || 60),
  },
};
