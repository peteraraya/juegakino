import { lazy, Suspense } from "react";
import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { HomePage } from "@/pages/HomePage";
import { GeneratorPage } from "@/pages/GeneratorPage";
import { SimulatorPage } from "@/pages/SimulatorPage";

const StatsPage = lazy(() =>
  import("@/pages/StatsPage").then((m) => ({ default: m.StatsPage })),
);

const VerifierPage = lazy(() =>
  import("@/pages/VerifierPage").then((m) => ({ default: m.VerifierPage })),
);

const BallWeightsPage = lazy(() =>
  import("@/pages/BallWeightsPage").then((m) => ({ default: m.BallWeightsPage })),
);

const ComparadorPage = lazy(() =>
  import("@/pages/ComparadorPage").then((m) => ({ default: m.ComparadorPage })),
);

/**
 * Fallback de ruta: skeleton con la silueta real de la vista, no un "Cargando…"
 * genérico. El texto de carga va a `role="status"` (LoadingBlock) para que el
 * usuario con lector de pantalla sepa qué se está montando.
 */
function routeFallback(label: string) {
  return (
    <div className="mx-auto w-full max-w-tool px-5 py-10 sm:px-6 lg:px-8">
      <LoadingBlock label={label} />
    </div>
  );
}

export const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const generatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generador",
  component: GeneratorPage,
});

export const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/simulador",
  component: SimulatorPage,
});

export const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/estadisticas",
  component: () => (
    <Suspense fallback={routeFallback("Cargando estadísticas")}>
      <StatsPage />
    </Suspense>
  ),
});

export const verifierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verificador",
  component: () => (
    <Suspense fallback={routeFallback("Cargando verificador")}>
      <VerifierPage />
    </Suspense>
  ),
});

export const ballWeightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pesos",
  component: () => (
    <Suspense fallback={routeFallback("Cargando pesos de las bolillas")}>
      <BallWeightsPage />
    </Suspense>
  ),
});

export const comparadorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comparador",
  component: () => (
    <Suspense fallback={routeFallback("Cargando comparador")}>
      <ComparadorPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  generatorRoute,
  simulatorRoute,
  statsRoute,
  verifierRoute,
  ballWeightsRoute,
  comparadorRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}