export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Jenkins Monitoring API Test Report',
        outputPath: process.env.JEST_HTML_REPORT_PATH || '../reports/jest-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
  ],
};
