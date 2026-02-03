import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (2 levels up from config directory)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || '',
  jenkinsUrl: process.env.JENKINS_URL || '',
  jenkinsUser: process.env.JENKINS_USER || '',
  jenkinsToken: process.env.JENKINS_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
};
