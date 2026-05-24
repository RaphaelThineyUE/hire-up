import { test, expect, hasTestUser } from './fixtures'

test.describe('Settings', () => {
  test.skip(!hasTestUser, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run')

  test('settings page loads with three sections', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('AI Provider')).toBeVisible()
    await expect(page.getByText('Job Search')).toBeVisible()
    await expect(page.getByText('Auto Source')).toBeVisible()
  })

  test('sidebar links to settings', async ({ loggedIn: page }) => {
    await page.getByRole('link', { name: /Settings/i }).first().click()
    await expect(page).toHaveURL(/\/app\/settings/)
  })

  test('AI provider radio buttons are present', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    await expect(page.locator('input[value="ollama"]')).toBeVisible()
    await expect(page.locator('input[value="claude"]')).toBeVisible()
    await expect(page.locator('input[value="openai"]')).toBeVisible()
  })

  test('switching to Claude shows API key field', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    await page.locator('input[value="claude"]').check()
    await expect(page.locator('input[name="claude_api_key"]')).toBeVisible()
    await expect(page.locator('input[name="ai_base_url"]')).not.toBeVisible()
  })

  test('switching to Ollama shows base URL field', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    await page.locator('input[value="ollama"]').check()
    await expect(page.locator('input[name="ai_base_url"]')).toBeVisible()
    await expect(page.locator('input[name="claude_api_key"]')).not.toBeVisible()
  })

  test('save settings shows Saved confirmation', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 })
  })

  test('cron hour field accepts values 0-23', async ({ loggedIn: page }) => {
    await page.goto('/app/settings')
    const hourInput = page.locator('input[name="cron_hour_utc"]')
    await expect(hourInput).toBeVisible()
    await expect(hourInput).toHaveAttribute('min', '0')
    await expect(hourInput).toHaveAttribute('max', '23')
  })
})
