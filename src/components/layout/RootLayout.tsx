import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toasts } from "@/components/ui/Toasts";

const NAV_ITEMS = [
  { to: "/", label: "Inicio" },
  { to: "/generador", label: "Generador" },
  { to: "/simulador", label: "Simulador" },
  { to: "/estadisticas", label: "Estadísticas" },
  { to: "/verificador", label: "Verificador" },
  { to: "/comparador", label: "Comparador" },
  { to: "/pesos", label: "Pesos" },
];

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-kino-red-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kino-red-600 font-mono text-sm font-bold text-white">
              7
            </span>
            juegaKino
          </Link>
          <nav className="ml-auto flex flex-wrap gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-kino-red-50 hover:text-kino-red-700 [&.active]:bg-kino-red-50 [&.active]:text-kino-red-700"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
          <p className="mb-1 font-semibold text-gray-700">Juego responsable</p>
          <p>
            Simulación con fines estadísticos y educativos. No garantiza ni predice resultados: cada combinación de
            14 números tiene la misma probabilidad de acierto. Jugar Kino tiene costo real y aquí no se juega con
            dinero.
          </p>
        </div>
      </footer>
      <Toasts />
    </div>
  );
}