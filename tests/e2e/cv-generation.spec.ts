import { test, expect, Page } from '@playwright/test';

const GENERATE_URL = 'http://localhost:4001/api/cv/generate';

async function postGenerate(page: Page, body: Record<string, unknown>) {
  return page.evaluate(async ({ url, body }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  }, { url: GENERATE_URL, body });
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test.describe('CV generation flow', () => {
  test('triggers generation and returns an accepted job', async ({ page }) => {
    let capturedBody: string | null = null;
    await page.route('**/api/cv/generate', (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        capturedBody = req.postData();
        route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ jobId: 'job-987', status: 'accepted', message: 'CV generation started' }),
        });
      } else {
        route.continue();
      }
    });

    const { status, data } = await postGenerate(page, { count: 1 });

    expect(capturedBody).toContain('"count":1');
    expect(status).toBe(202);
    expect(data.jobId).toBe('job-987');
    expect(data.status).toBe('accepted');
  });

  test('rejects an invalid generation count', async ({ page }) => {
    await page.route('**/api/cv/generate', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'count is required and must be a positive integer',
        }),
      });
    });

    const { status, data } = await postGenerate(page, { count: 0 });

    expect(status).toBe(400);
    expect(data.message).toContain('positive integer');
  });

  test('surfaces an error when the LLM service is unavailable', async ({ page }) => {
    await page.route('**/api/cv/generate', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          code: 'LLM_UNAVAILABLE',
          message: 'LLM unavailable',
        }),
      });
    });

    const { status, data } = await postGenerate(page, { count: 3 });

    expect(status).toBe(500);
    expect(data.code).toBe('LLM_UNAVAILABLE');
  });
});
