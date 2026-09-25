import { test, expect } from "@playwright/test";

// Evita el onboarding en primer ingreso para todos los tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("juega-kino-onboarding-v1", "1"));
});

const APP_PAGES = [
  { path: "/", heading: /Entiende el Kino con/ },
  { path: "/generador", heading: /Generador de cartones/ },
  { path: "/simulador", heading: /Simulador Monte Carlo/ },
  { path: "/verificador", heading: /Verificador de resultados reales/ },
  { path: "/estadisticas", heading: /Estadísticas/ },
  { path: "/comparador", heading: /Comparador de cartones/ },
  { path: "/pesos", heading: /Pesos de las bolillas/ },
];

test("smoke: todas las páginas cargan con su encabezado", async ({ page }) => {
  for (const { path, heading } of APP_PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 15_000 });
  }
});

test("flujo generador: generar cartón, ver toasts y limpiar", async ({ page }) => {
  await page.goto("/generador");
  await page.getByRole("button", { name: "Generar cartón" }).click();
  await expect(page.getByText(/Cartón generado \(semilla \d+\)/)).toBeVisible();
  // El botón "Limpiar (N restantes)" revela que hay 14 bolillas elegidas; una vez completo, "0 restantes".
  const clean = page.getByRole("button", { name: /Limpiar/ });
  await expect(clean).toBeEnabled();
  await clean.click();
  await expect(clean).toBeDisabled();
});

test("generador con condiciones: aplicar 1 condición genera y avisa", async ({ page }) => {
  await page.goto("/generador");
  // Sin condiciones el botón está deshabilitado.
  const generateBtn = page.getByRole("button", { name: /Generar con 0 condición/ });
  await expect(generateBtn).toBeDisabled();
  await page.locator('label:has-text("1 y 25 fijos") input').check();
  await page.getByRole("button", { name: /Generar con 1 condición/ }).click();
  await expect(page.getByText(/Cartón con condiciones generado/)).toBeVisible({ timeout: 15_000 });
});

test("deep-link: ?seed=4813&draws=200 corre el simulador y muestra resultados", async ({ page }) => {
  await page.goto("/simulador?seed=4813&draws=200");
  // El worker termina y renderiza la sección de resultados (h2 "Resultados").
  await expect(page.getByRole("heading", { name: /^Resultados/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("200")).toBeVisible({ timeout: 30_000 });
});

test("persistencia: el cartón elegido sobrevive a recarga", async ({ page }) => {
  await page.goto("/generador");
  for (let i = 1; i <= 14; i++) {
    await page.getByRole("button", { name: String(i), exact: true }).click();
  }
  await page.reload();
  await expect(page.getByRole("button", { name: /Limpiar \(0 restantes\)/ })).toBeVisible();
});