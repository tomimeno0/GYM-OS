import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
test('public pages and signed-in dashboard have accessible controls and no horizontal overflow', async ({
  page,
  request,
}) => {
  for (const path of ['/', '/login', '/registro']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const email = `a11y-${randomUUID()}@gym-os.test`,
    password = 'Accesibilidad 2026!';
  expect(
    (
      await request.post('/api/v1/auth/register', {
        headers: { 'X-GymOS-Client': 'web' },
        data: { nombre: 'Accesibilidad', email, password },
      })
    ).status(),
  ).toBe(201);
  await page.context().addCookies((await request.storageState()).cookies);
  for (const path of ['/dashboard', '/rutinas/nueva', '/dietas/nueva', '/me']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(
    (
      await request.delete('/api/v1/me', {
        headers: { 'X-GymOS-Client': 'web' },
        data: { confirmar: true, password },
      })
    ).status(),
  ).toBe(204);
});
