import { test, expect, Page } from '@playwright/test';

const CHAT_URL = '/chat';

async function mockChat(page: Page, response: Record<string, unknown>) {
  await page.route('**/api/chat', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

test.describe('Chat flow', () => {
  test('send a question and receive an answer with sources', async ({ page }) => {
    const answer = 'Jane has 5 years of experience with Python.';
    const sources = [
      { cvId: 'cv-1', name: 'Jane Doe', role: 'Senior Python Engineer', relevance: 0.95 },
      { cvId: 'cv-2', name: 'John Smith', role: 'Backend Developer', relevance: 0.82 },
    ];

    await mockChat(page, {
      answer,
      sources,
      requestId: 'req-123',
      conversationId: 'conv-1',
    });

    await page.goto(CHAT_URL);
    await page.getByPlaceholder('Ask about candidates...').fill('Who knows Python?');
    await page.getByRole('button', { name: 'Send' }).click();

    const userMessage = page.locator('.flex.justify-end', { hasText: 'Who knows Python?' });
    await expect(userMessage).toBeVisible();

    const assistantCard = page.locator('div.bg-white.border', { hasText: answer });
    await expect(assistantCard).toBeVisible();
    await expect(assistantCard).toContainText('Jane has 5 years of experience with Python.');
  });

  test('renders source cards for retrieved chunks', async ({ page }) => {
    await mockChat(page, {
      answer: 'Found matching candidates.',
      sources: [
        { cvId: 'cv-1', name: 'Jane Doe', role: 'Senior Python Engineer', relevance: 0.95 },
        { cvId: 'cv-2', name: 'John Smith', role: 'Backend Developer', relevance: 0.5 },
      ],
      requestId: 'req-456',
      conversationId: 'conv-2',
    });

    await page.goto(CHAT_URL);
    await page.getByPlaceholder('Ask about candidates...').fill('Find Python devs');
    await page.getByRole('button', { name: 'Send' }).click();

    const assistantCard = page.locator('div.bg-white.border', { hasText: 'Found matching candidates.' });
    await expect(assistantCard).toBeVisible();

    await expect(assistantCard).toContainText('Sources:');
    await expect(assistantCard).toContainText('Jane Doe');
    await expect(assistantCard).toContainText('Senior Python Engineer');
    await expect(assistantCard).toContainText('John Smith');
    await expect(assistantCard).toContainText('95%');
    await expect(assistantCard).toContainText('50%');
  });

  test('displays an error message when the request fails', async ({ page }) => {
    await page.route('**/api/chat', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'LLM service unavailable' }),
      });
    });

    await page.goto(CHAT_URL);
    await page.getByPlaceholder('Ask about candidates...').fill('Trigger an error');
    await page.getByRole('button', { name: 'Send' }).click();

    const errorBanner = page.locator('div.text-red-700', { hasText: 'LLM service unavailable' });
    await expect(errorBanner).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(errorBanner).toBeHidden();
  });
});
