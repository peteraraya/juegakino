import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('juega-kino-onboarding-v1', '1'))
})

test('flujo generador: generar cartón, ver toasts y limpiar', async ({ page }) => {
  await page.goto('/generador')
  const genBtn = page.getByRole('button', { name: 'Generar cartón' })
  await expect(genBtn).toBeVisible()
  await genBtn.click()
  await expect(page.getByText(/cartón generado \(semilla \d+\)/i)).toBeVisible()
  const clean = page.getByRole('button', { name: /Limpiar/ })
  await expect(clean).toBeEnabled()
  await clean.click()
  await expect(clean).toBeDisabled()
})

test('generador con condiciones: aplicar 1 condición genera un cartón', async ({ page }) => {
  await page.goto('/generador')
  const zeroBtn = page.getByRole('button', { name: /Generar con 0 cond/i })
  await expect(zeroBtn).toBeVisible()
  await expect(zeroBtn).toBeDisabled()
  await page.locator('label:has-text("1 y 25 fijos") input').check()
  const oneBtn = page.getByRole('button', { name: /Generar con 1 cond/i })
  await expect(oneBtn).toBeEnabled()
  await oneBtn.click()
  await expect(page.getByText(/Cartón ideal encontrado/)).toBeVisible({ timeout: 15_000 })
})