import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('juega-kino-onboarding-v1', '1'))
})

test('generador con condiciones: cada búsqueda produce un cartón distinto', async ({ page }) => {
  await page.goto('/generador')
  const zeroBtn = page.getByRole('button', { name: /Generar con 0 cond/i })
  await expect(zeroBtn).toBeVisible()
  await expect(zeroBtn).toBeDisabled()
  await page.locator('label:has-text("1 y 25 fijos") input').check()
  const oneBtn = page.getByRole('button', { name: /Generar con 1 cond/i })
  await expect(oneBtn).toBeEnabled()
  await oneBtn.click()
  await expect(page.getByText(/Cartón ideal encontrado/)).toBeVisible({ timeout: 15_000 })
  const firstCarton = await page.locator('[role="group"] button[aria-pressed="true"]').allTextContents()

  await oneBtn.click()
  await expect(page.getByText(/Cartón ideal encontrado/)).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(() => page.locator('[role="group"] button[aria-pressed="true"]').allTextContents())
    .not.toEqual(firstCarton)
  const secondCarton = await page.locator('[role="group"] button[aria-pressed="true"]').allTextContents()

  expect(secondCarton).toHaveLength(14)
  expect(secondCarton).not.toEqual(firstCarton)
})