/**
 * Arquitectura de navegación.
 *
 * Antes: siete items planos en un `flex-wrap`. En mobile el nav ocupaba dos o tres filas
 * y empujaba el contenido real fuera del fold, y nada indicaba por dónde empezar.
 *
 * Ahora: los siete items se agrupan en tres familias por intención — manipulation de un
 * cartón, correr sorteos, e hipótesis secundarias — y se agregan dos accesos que
 * reducen la tarea principal de 7 clicks a 2: el buscador (⌘K) y un CTA directo a
 * Generador en el header.
 */
import { Link, useRouterState } from "@tanstack/react-router";

export interface NavItem {
  to: string;
  label: string;
  /** Qué resuelve, en una línea. Solo visible en mobile y en el palette. */
  description: string;
  /** Términos extra que el buscador indexa (el usuario no los conoce de entrada). */
  keywords: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tu cartón",
    items: [
      {
        to: "/generador",
        label: "Generador",
        description: "Arma un cartón de 14 números con estrategia, hot/cold o balanceado.",
        keywords: "crear carton numeros estrategia hot cold balanceado tips",
      },
      {
        to: "/verificador",
        label: "Verificador",
        description: "Pega sorteos reales y mira cuántos aciertos habría tenido tu cartón.",
        keywords: "verificar comprobar reales resultados aciertos premio",
      },
    ],
  },
  {
    label: "Simular",
    items: [
      {
        to: "/simulador",
        label: "Simulador",
        description: "Corre miles de sorteos con semilla reproducible, sin bloquear la interfaz.",
        keywords: "simular montecarlo sorteos semilla progreso worker",
      },
      {
        to: "/estadisticas",
        label: "Estadísticas",
        description: "Probabilidades teóricas contra las frecuencias de tu simulación.",
        keywords: "estadisticas probabilidades distribucion histograma frecuencias premio",
      },
    ],
  },
  {
    label: "Explorar",
    items: [
      {
        to: "/pesos",
        label: "Pesos",
        description: "Edita el peso de cada bolilla y contrasta contra el modelo uniforme.",
        keywords: "pesos kg bolillas sesgo uniforme empirico",
      },
      {
        to: "/comparador",
        label: "Comparador",
        description: "Genera N cartones y ordénalos por estilo frente a series ganadoras.",
        keywords: "comparador comparar estilo score cartones top",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** ¿La ruta activa es exacta? Para "/" hay que exigir coincidencia exacta. */
export function isActivePath(currentPath: string, to: string): boolean {
  return to === "/" ? currentPath === "/" : currentPath === to || currentPath.startsWith(`${to}/`);
}

/** Hook del path actual, para resolver el estado activo sin depender del Link. */
export function useIsActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => isActivePath(path, to);
}

const LINK_BASE = [
  "relative rounded-md px-2.5 py-2 text-small font-medium",
  "transition-colors duration-150 ease-smooth",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
].join(" ");

/** Clases del enlace de nav según estado. Mismo patrón para desktop y mobile. */
export function navLinkClass(active: boolean): string {
  return [
    LINK_BASE,
    active
      ? "text-accent-text-strong after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent-fill"
      : "text-ink-600 hover:bg-surface-sunken hover:text-ink-900",
  ].join(" ");
}

/** Nav horizontal para desktop: los tres grupos separados por un hairline. */
export function DesktopNav({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} className="flex items-center gap-1">
          {gi > 0 && <span aria-hidden="true" className="mx-1 h-4 w-px bg-line-strong" />}
          {group.items.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active)}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Lista agrupada para mobile. Se renderiza dentro de un Dialog. */
export function MobileNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Principal" className="mt-2 flex flex-col">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? "mt-4 border-t border-line pt-4" : ""}>
          <p className="text-eyebrow font-medium uppercase text-ink-500">{group.label}</p>
          <ul className="mt-1.5 flex flex-col">
            {group.items.map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "block rounded-md px-3 py-2.5 transition-colors duration-150 ease-smooth",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                      active ? "bg-accent-tint text-accent-text-strong" : "text-ink-800 hover:bg-surface-sunken",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 text-body font-medium">
                      {item.label}
                      {active && (
                        <span aria-hidden="true" className="text-accent-text">
                          ·
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-small leading-snug text-ink-600">{item.description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}