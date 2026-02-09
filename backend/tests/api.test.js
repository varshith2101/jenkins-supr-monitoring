const baseUrl = process.env.API_BASE_URL || 'http://nginx';
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const rateLimitPoints = Number(process.env.RATE_LIMIT_POINTS || 20);

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }

  return { response, body };
}

describe('Jenkins Monitoring API', () => {
  test('health endpoint responds', async () => {
    const { response, body } = await jsonRequest('/health');
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('status', 'ok');
  });

  test('login succeeds with admin credentials', async () => {
    const { response, body } = await jsonRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('username', adminUsername);
  });

  test('login fails with invalid password', async () => {
    const { response, body } = await jsonRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: adminUsername,
        password: 'wrong-password',
      }),
    });

    expect(response.status).toBe(401);
    expect(body).toHaveProperty('error');
  });

  test('protected endpoint requires auth', async () => {
    const { response, body } = await jsonRequest('/api/jobs');
    expect([401, 403]).toContain(response.status);
    expect(body).toHaveProperty('error');
  });

  test('token allows access to /api/me', async () => {
    const login = await jsonRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    const token = login.body?.token;
    expect(token).toBeTruthy();

    const { response, body } = await jsonRequest('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('username', adminUsername);
  });

  test('unknown route returns 404', async () => {
    const { response } = await jsonRequest('/api/unknown');
    expect(response.status).toBe(404);
  });

  test('rate limiter blocks excessive requests', async () => {
    const ip = '10.10.10.10';
    let blocked = 0;

    for (let i = 0; i < rateLimitPoints + 3; i += 1) {
      const { response } = await jsonRequest('/api/login', {
        method: 'POST',
        headers: {
          'X-Forwarded-For': ip,
        },
        body: JSON.stringify({
          username: adminUsername,
          password: 'wrong-password',
        }),
      });

      if (response.status === 429) {
        blocked += 1;
      }
    }

    expect(blocked).toBeGreaterThan(0);
  });

  test('basic load requests return expected status codes', async () => {
    const ip = '10.10.10.20';
    const requests = Array.from({ length: 25 }, () =>
      jsonRequest('/api/login', {
        method: 'POST',
        headers: {
          'X-Forwarded-For': ip,
        },
        body: JSON.stringify({
          username: adminUsername,
          password: 'wrong-password',
        }),
      })
    );

    const results = await Promise.all(requests);
    const statusCodes = results.map((result) => result.response.status);

    statusCodes.forEach((status) => {
      expect([401, 429]).toContain(status);
    });
  });
});
