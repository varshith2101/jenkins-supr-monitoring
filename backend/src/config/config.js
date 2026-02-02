import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  jenkinsUrl: process.env.JENKINS_URL || 'http://jenkins:8080',
  jenkinsUser: process.env.JENKINS_USER || 'V_jenkins',
  jenkinsToken: process.env.JENKINS_TOKEN || '1191f1a0ae74dabbfb08a5dede9e7a5978',
  nodeEnv: process.env.NODE_ENV || 'development',
};
