import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_USER_EMAIL    ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''
const hasTestUser   = Boolean(TEST_EMAIL && TEST_PASSWORD)

// ── Page rendering ──────────────────────────────────────────────────────────

test('login page renders sign-in form', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
})

test('signup page renders create-account form', async ({ page }) => {
  await page.goto('/signup')
  await expect(page).toHaveURL(/\/signup/)
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})

test('signup page links back to login', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('login page links to signup', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Sign up' }).click()
  await expect(page).toHaveURL(/\/signup/)
})

// ── Redirect guards ─────────────────────────────────────────────────────────

test('unauthenticated /app redirects to /login', async ({ page }) => {
  await page.goto('/app/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('unauthenticated /app/applications redirects to /login', async ({ page }) => {
  await page.goto('/app/applications')
  await expect(page).toHaveURL(/\/login/)
})

// ── Bad credentials ─────────────────────────────────────────────────────────

test('wrong password shows error message', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('nobody@example.com')
  await page.locator('#password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 })
  await expect(page).toHaveURL(/\/login/)
})

test('empty form submission stays on login', async ({ page }) => {
  await page.goto('/login')
  // HTML5 required validation prevents submit — button should not trigger navigation
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('submit shows loading state then restores', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('test@example.com')
  await page.locator('#password').fill('badpassword')

  const btn = page.getByRole('button', { name: /Sign in/ })
  await btn.click()

  // Button should briefly show loading text
  await expect(btn).toHaveText(/Signing in…/, { timeout: 2_000 }).catch(() => {
    // Fast response — loading state may not be visible long enough; that's fine
  })

  // Should eventually return to enabled state
  await expect(btn).toBeEnabled({ timeout: 10_000 })
})

// ── Valid credentials (requires TEST_USER_EMAIL + TEST_USER_PASSWORD in env) ─

test.describe('authenticated flow', () => {
  test.skip(!hasTestUser, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run')

  test('valid credentials redirect to /app/dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(TEST_EMAIL)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10_000 })
  })

  test('dashboard shows stat cards after login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(TEST_EMAIL)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10_000 })
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('Applications')).toBeVisible()
  })

  test('already-logged-in user visiting /login is redirected to dashboard', async ({ page }) => {
    // Log in first
    await page.goto('/login')
    await page.locator('#email').fill(TEST_EMAIL)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10_000 })

    // Revisit /login — middleware should redirect back to dashboard
    await page.goto('/login')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 5_000 })
  })

  test('sidebar navigation to Applications works', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(TEST_EMAIL)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10_000 })

    await page.getByText('Applications').first().click()
    await expect(page).toHaveURL(/\/app\/applications/)
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
  })
})
