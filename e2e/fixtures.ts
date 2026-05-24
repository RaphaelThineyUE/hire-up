import { test as base, expect, type Page } from '@playwright/test'

const EMAIL    = process.env.TEST_USER_EMAIL    ?? ''
const PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

export { expect }

/** Log in once and reuse the page for the test. */
async function login(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 12_000 })
}

export const test = base.extend<{ loggedIn: Page }>({
  loggedIn: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})

export const hasTestUser = Boolean(EMAIL && PASSWORD)
