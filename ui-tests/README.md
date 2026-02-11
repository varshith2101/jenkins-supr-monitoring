# UI Tests

This folder contains Playwright end-to-end tests for the Jenkins monitoring UI.

## Run locally

1. Start the stack (frontend + backend + nginx).
2. From the repo root, run the tests:

```bash
cd ui-tests
npm install
UI_BASE_URL=http://localhost:5111 npm test
```

## CI

CI uses the Playwright HTML reporter. The report is written to `reports/ui/index.html`.
Screenshots, traces, and videos are captured on failures for easy debugging.
