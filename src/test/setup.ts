import "@testing-library/jest-dom/vitest";

// jsdom no implementa scrollTo; TanStack Router lo invoca al restaurar scroll.
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });