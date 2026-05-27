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

  test('shows Add CV button', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    await expect(page.getByRole('button', { name: /Add CV/i })).toBeVisible()
  })

  test('uploads cv.docx and shows filename + word count', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')

    // Delete all existing CVs first
    const hasExisting = await page.locator('text=/words/').isVisible()
    if (hasExisting) {
      page.on('dialog', d => d.accept())
      const deleteBtns = page.locator('button[title="Delete CV"]')
      const count = await deleteBtns.count()
      for (let i = 0; i < count; i++) {
        await deleteBtns.first().click()
        await page.waitForTimeout(800)
      }
    }

    // Trigger hidden file input via the Add CV button
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /Add CV/i }).click(),
    ])
    await fileChooser.setFiles(CV_PATH)

    // Wait for revalidation — filename should appear
    await expect(page.getByText('cv.docx')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('text=/\\d+ words/')).toBeVisible({ timeout: 5_000 })
  })

  test('shows extracted text preview after upload', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    // Expand the CV card if a CV is present
    const expandBtn = page.locator('button[title="Show preview"]').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await expect(page.getByText('Extracted text preview')).toBeVisible()
      await expect(page.locator('pre')).toBeVisible()
    }
  })

  test('delete button removes the CV', async ({ loggedIn: page }) => {
    await page.goto('/app/cv')
    const hasCV = await page.locator('text=cv.docx').isVisible()
    if (!hasCV) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /Add CV/i }).click(),
      ])
      await fileChooser.setFiles(CV_PATH)
      await expect(page.getByText('cv.docx')).toBeVisible({ timeout: 20_000 })
    }

    page.on('dialog', d => d.accept())
    await page.locator('button[title="Delete CV"]').first().click()
    await expect(page.getByText('No CVs uploaded yet.')).toBeVisible({ timeout: 8_000 })
  })
})
