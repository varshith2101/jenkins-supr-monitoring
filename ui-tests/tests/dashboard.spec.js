import { test, expect } from '@playwright/test';

const mockUser = {
  token: 'fake-token',
  username: 'admin',
  role: 'admin',
  displayName: 'Admin User',
  pipelines: [],
};

const mockJobs = {
  jobs: [
    { name: 'Flash RH850' },
    { name: 'Rename Reports' },
    { name: 'Archive Reports' },
  ],
};

const buildDataByJob = {
  'Flash RH850': {
    jobName: 'Flash RH850',
    lastBuild: {
      buildNumber: 42,
      status: 'FAILED',
      duration: 123456,
      timestamp: Date.now() - 60_000,
      failedStage: 'Run Tests',
    },
    builds: [
      {
        buildNumber: 42,
        status: 'FAILED',
        duration: 123456,
        timestamp: Date.now() - 60_000,
        failedStage: 'Run Tests',
      },
      {
        buildNumber: 41,
        status: 'SUCCESS',
        duration: 65432,
        timestamp: Date.now() - 120_000,
      },
    ],
  },
  'Rename Reports': {
    jobName: 'Rename Reports',
    lastBuild: {
      buildNumber: 12,
      status: 'SUCCESS',
      duration: 23456,
      timestamp: Date.now() - 80_000,
    },
    builds: [
      {
        buildNumber: 12,
        status: 'SUCCESS',
        duration: 23456,
        timestamp: Date.now() - 80_000,
      },
    ],
  },
  'Archive Reports': {
    jobName: 'Archive Reports',
    lastBuild: {
      buildNumber: 7,
      status: 'ABORTED',
      duration: 1122,
      timestamp: Date.now() - 200_000,
      failedStage: 'Archive',
    },
    builds: [
      {
        buildNumber: 7,
        status: 'ABORTED',
        duration: 1122,
        timestamp: Date.now() - 200_000,
        failedStage: 'Archive',
      },
    ],
  },
};

const mockStages = {
  failedStage: 'Run Tests',
  stages: [
    { name: 'Checkout', status: 'SUCCESS' },
    { name: 'Build', status: 'SUCCESS' },
    { name: 'Run Tests', status: 'FAILED' },
    { name: 'Deploy', status: 'SKIPPED' },
  ],
  steps: [
    { name: 'npm test', status: 'FAILED', logs: 'Test suite failed: lint errors.' },
    { name: 'archive artifacts', status: 'SKIPPED', logs: 'Skipped due to failure.' },
  ],
};

const mockLogs = {
  command: 'Pipeline',
  logs: 'Full build logs...\nError: lint failed\n',
};

const mockLoginFailure = {
  error: 'Invalid credentials',
};

const routeWithJson = async (route, json, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(json),
  });
};

const setupDefaultMocks = async (page) => {
  await page.route('**/api/login', async (route) => {
    await routeWithJson(route, mockUser);
  });

  await page.route('**/api/jobs', async (route) => {
    await routeWithJson(route, mockJobs);
  });

  await page.route('**/api/builds/**', async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split('/').filter(Boolean);
    const jobName = decodeURIComponent(parts[2] || '');

    if (parts[4] === 'stages') {
      return routeWithJson(route, mockStages);
    }

    if (parts[4] === 'logs') {
      return routeWithJson(route, mockLogs);
    }

    if (parts.length >= 4 && parts[3]) {
      const buildNumber = Number(parts[3]);
      const buildData = buildDataByJob[jobName];
      const build = buildData?.builds.find((item) => item.buildNumber === buildNumber);
      return routeWithJson(route, build || {}, build ? 200 : 404);
    }

    return routeWithJson(route, buildDataByJob[jobName] || { jobName, builds: [] });
  });

  await page.route('**/api/**', async (route) => {
    await routeWithJson(route, { error: 'Unhandled route' }, 404);
  });
};

const loginAsAdmin = async (page) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Pipeline Overview')).toBeVisible();
};

test('login shows pipeline overview and cards', async ({ page }) => {
  await setupDefaultMocks(page);
  await loginAsAdmin(page);

  await expect(page.getByText('Flash RH850')).toBeVisible();
  await expect(page.getByText('Rename Reports')).toBeVisible();
  await expect(page.getByText('Archive Reports')).toBeVisible();
});

test('search filters pipeline list', async ({ page }) => {
  await setupDefaultMocks(page);
  await loginAsAdmin(page);

  const searchInput = page.getByPlaceholder('Search pipelines...');
  await searchInput.fill('rename');

  await expect(page.getByText('Rename Reports')).toBeVisible();
  await expect(page.locator('.pipeline-card', { hasText: 'Flash RH850' })).toHaveCount(0);
});

test('pipeline detail view shows failed stage badge', async ({ page }) => {
  await setupDefaultMocks(page);
  await loginAsAdmin(page);

  const flashCard = page.locator('.pipeline-card', { hasText: 'Flash RH850' });
  await flashCard.getByRole('button', { name: 'View Pipeline' }).click();

  await expect(page.getByText('Current Build Status')).toBeVisible();
  await expect(page.locator('.failed-stage-badge')).toContainText('Run Tests');
  await expect(page.getByRole('button', { name: 'View Stages' })).toBeVisible();
});

test('stages view renders graph and failed steps', async ({ page }) => {
  await setupDefaultMocks(page);
  await loginAsAdmin(page);

  const flashCard = page.locator('.pipeline-card', { hasText: 'Flash RH850' });
  await flashCard.getByRole('button', { name: 'View Pipeline' }).click();
  await page.getByRole('button', { name: 'View Stages' }).click();

  await expect(page.getByText('Failed Stage Steps')).toBeVisible();
  await expect(page.getByText('Failed at Run Tests')).toBeVisible();
  await expect(page.getByText('Run Tests')).toBeVisible();
  await expect(page.getByText('npm test')).toBeVisible();
});

test('full logs modal shows output', async ({ page }) => {
  await setupDefaultMocks(page);
  await loginAsAdmin(page);

  const flashCard = page.locator('.pipeline-card', { hasText: 'Flash RH850' });
  await flashCard.getByRole('button', { name: 'View Pipeline' }).click();
  await page.getByRole('button', { name: 'View Stages' }).click();

  await page.getByRole('button', { name: 'View Full Logs' }).click();
  await expect(page.getByText('Build #42 Logs')).toBeVisible();
  await expect(page.getByText('Full build logs')).toBeVisible();
});

test('empty pipelines state is shown', async ({ page }) => {
  await page.route('**/api/login', async (route) => {
    await routeWithJson(route, mockUser);
  });

  await page.route('**/api/jobs', async (route) => {
    await routeWithJson(route, { jobs: [] });
  });

  await page.route('**/api/**', async (route) => {
    await routeWithJson(route, { error: 'Unhandled route' }, 404);
  });

  await loginAsAdmin(page);
  await expect(page.getByText('No pipelines available.')).toBeVisible();
});

test('login error is displayed', async ({ page }) => {
  await page.route('**/api/login', async (route) => {
    await routeWithJson(route, mockLoginFailure, 401);
  });

  await page.goto('/');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('Invalid credentials')).toBeVisible();
});
