import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('juega-kino-onboarding-v1', '1'))
})

test('generador con condiciones: aplicar 1 condición genera y avisa', async ({ page }) => {
  await page.goto('/generador')
  const zeroBtn = page.getByRole('button', { name: /Generar con 0 cond/i })
  await expect(zeroBtn).toBeVisible()
  await expect(zeroBtn).toBeDisabled()
  await page.locator('label:has-text("1 y 25 fijos") input').check()
  const oneBtn = page.getByRole('button', { name: /Generar con 1 cond/i })
  await expect(oneBtn).toBeEnabled()
  await oneBtn.click()
  await expect(page.getByText(/Cartón con condiciones generado/)).toBeVisible({ timeout: 15_000 })
})