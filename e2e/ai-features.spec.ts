import { test, expect, hasTestUser } from './fixtures'

test.describe('AI Features — ApplicationDetail', () => {
  test.skip(!hasTestUser, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run')

  test('applications page loads', async ({ loggedIn: page }) => {
    await page.goto('/app/applications')
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
  })

  test('Score match button is disabled when application has no job description', async ({ loggedIn: page }) => {
    await page.goto('/app/applications')

    // Create a new application without a job description
    await page.getByRole('button', { name: /Add application|New application|\+/i }).first().click()
    // Wait for slide-over animation (180ms) to complete before interacting with form
    await page.locator('input[name="company"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(250)
    await page.locator('input[name="company"]').fill('Test Co E2E')
    await page.locator('input[name="role"]').fill('E2E Test Role')
    // Skip job_description — leave blank
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Test Co E2E')).toBeVisible({ timeout: 8_000 })

    // Open the application full page
    await page.getByText('Test Co E2E').first().click()
    await page.getByText('Open full page').click()
    await expect(page).toHaveURL(/\/app\/applications\//)

    // Score match button should be disabled (no job description)
    const scoreBtn = page.getByRole('button', { name: /Score match/ })
    await expect(scoreBtn).toBeVisible()
    await expect(scoreBtn).toBeDisabled()
  })

  test('Score match button is enabled when job description exists', async ({ loggedIn: page }) => {
    await page.goto('/app/applications')

    // Create application WITH job description
    await page.getByRole('button', { name: /Add application|New application|\+/i }).first().click()
    // Wait for slide-over animation (180ms) to complete
    await page.locator('input[name="company"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(250)
    await page.locator('input[name="company"]').fill('AI Test Co')
    await page.locator('input[name="role"]').fill('AI Test Role')

    // Fill job description
    await page.locator('textarea[name="job_description"]').fill('Looking for a skilled developer with TypeScript and React experience.')

    await page.locator('button[type="submit"]').click()
    await page.getByText('AI Test Co').first().click()
    await page.getByText('Open full page').click()

    const scoreBtn = page.getByRole('button', { name: /Score match/ })
    await expect(scoreBtn).toBeVisible()
    await expect(scoreBtn).toBeEnabled()
  })

  test('full page shows Documents section with generate buttons', async ({ loggedIn: page }) => {
    await page.goto('/app/applications')

    // Find any existing application and open its full page
    const firstApp = page.locator('[style*="cursor: pointer"]').first()
    if (await firstApp.isVisible()) {
      await firstApp.click()
      await page.getByText('Open full page').click()
      await expect(page).toHaveURL(/\/app\/applications\//)

      await expect(page.getByText('Documents')).toBeVisible()
      await expect(page.getByRole('button', { name: /Generate cover letter/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Generate tailored CV/ })).toBeVisible()
    }
  })

  test('document download route returns 401 for unauthenticated request', async ({ page }) => {
    const response = await page.request.get('/api/documents/nonexistent-id/download?format=pdf')
    expect(response.status()).toBe(401)
  })

  test('document download route returns 404 for unknown document id', async ({ loggedIn: page }) => {
    const response = await page.request.get('/api/documents/00000000-0000-0000-0000-000000000000/download?format=pdf')
    expect(response.status()).toBe(404)
  })
})
