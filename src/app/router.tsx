import { lazy, Suspense } from "react";
import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";
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
    <Suspense fallback={<p className="p-8 text-sm text-gray-500">Cargando estadísticas…</p>}>
      <StatsPage />
    </Suspense>
  ),
});

export const verifierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verificador",
  component: () => (
    <Suspense fallback={<p className="p-8 text-sm text-gray-500">Cargando verificador…</p>}>
      <VerifierPage />
    </Suspense>
  ),
});

export const ballWeightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pesos",
  component: () => (
    <Suspense fallback={<p className="p-8 text-sm text-gray-500">Cargando pesos…</p>}>
      <BallWeightsPage />
    </Suspense>
  ),
});

export const comparadorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comparador",
  component: () => (
    <Suspense fallback={<p className="p-8 text-sm text-gray-500">Cargando comparador…</p>}>
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