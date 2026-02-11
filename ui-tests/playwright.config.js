import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportDir = process.env.UI_REPORT_DIR
  ? process.env.UI_REPORT_DIR
  : path.resolve(__dirname, '../reports/ui');

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 8000,
  },
  reporter: [['html', { outputFolder: reportDir, open: 'never' }]],
  use: {
    baseURL: process.env.UI_BASE_URL || 'http://localhost:5111',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
