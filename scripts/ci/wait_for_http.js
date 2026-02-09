const url = process.argv[2];
const timeoutSeconds = Number(process.argv[3] || 120);
const intervalMs = Number(process.argv[4] || 2000);

if (!url) {
  console.error('[ERROR] URL is required');
  process.exit(1);
}

const startedAt = Date.now();

async function wait() {
  while (true) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        console.log(`[INFO] Service is ready: ${url}`);
        return;
      }
      console.log(`[INFO] Waiting for ${url} (status ${response.status})`);
    } catch (error) {
      console.log(`[INFO] Waiting for ${url} (${error.message})`);
    }

    if (Date.now() - startedAt > timeoutSeconds * 1000) {
      console.error(`[ERROR] Timed out waiting for ${url}`);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

wait();
