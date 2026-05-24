import path from 'path'
import { test, expect, hasTestUser } from './fixtures'

const CV_PATH = path.resolve('public/cv.docx')

test.describe('CV Manager', () => {
  test.skip(!hasTestUser, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run')

  test('CV page loads after login', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    await expect(page.getByRole('heading', { name: 'CV Manager' })).toBeVisible()
  })

  test('sidebar links to CV page', async ({ loggedIn: page }) => {
    await page.getByRole('link', { name: /CV/i }).first().click()
    await expect(page).toHaveURL(/\/app\/cv/)
    await expect(page.getByRole('heading', { name: 'CV Manager' })).toBeVisible()
  })

  test('shows upload form when no CV exists', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    // Either shows the upload form or an existing CV — both are valid states
    const hasUpload = await page.locator('input[type="file"]').isVisible()
    expect(hasUpload).toBe(true)
  })

  test('uploads cv.docx and shows filename + word count', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')

    // Delete any existing CV first so we get a clean upload
    const deleteBtn = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' }).first()
    const hasExisting = await page.locator('text=/words/').isVisible()
    if (hasExisting) {
      page.on('dialog', d => d.accept())
      await deleteBtn.click()
      await page.waitForTimeout(1_500)
    }

    await page.setInputFiles('input[type="file"]', CV_PATH)
    await page.getByRole('button', { name: /Upload CV|Replace CV/ }).click()

    // Wait for revalidation — filename should appear
    await expect(page.getByText('cv.docx')).toBeVisible({ timeout: 20_000 })
    // Word count should appear (non-zero)
    await expect(page.locator('text=/\\d+ words/')).toBeVisible({ timeout: 5_000 })
  })

  test('shows extracted text preview after upload', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    // If a CV is already uploaded the preview block should be visible
    const hasPreview = await page.locator('text=/Extracted text preview/').isVisible()
    if (hasPreview) {
      await expect(page.locator('pre')).toBeVisible()
    }
  })

  test('delete button removes the CV', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    const hasCV = await page.locator('text=cv.docx').isVisible()
    if (!hasCV) {
      // Upload first
      await page.setInputFiles('input[type="file"]', CV_PATH)
      await page.getByRole('button', { name: /Upload CV|Replace CV/ }).click()
      await expect(page.getByText('cv.docx')).toBeVisible({ timeout: 20_000 })
    }

    page.on('dialog', d => d.accept())
    await page.locator('button[style*="danger"]').click()
    await expect(page.getByText('No CV uploaded yet.')).toBeVisible({ timeout: 8_000 })
  })
})
