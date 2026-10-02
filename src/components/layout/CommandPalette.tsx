/**
 * CommandPalette — navegación por teclado (⌘K / Ctrl+K).
 *
 * Reduce la tarea principal del producto (llegar a Generador o Simulador) de 7 clicks a
 * 2. Además da a un público no técnico una ruta que no depende de recordar nombres de
 * menú: escribe "cartón" y llega.
 *
 * Busca por etiqueta, por descripción y por keywords, de modo que los términos que el
 * usuario realmente tiene en la cabeza ("crear cartón", "cuántas veces salió el 7")
 * encuentran el destino aunque no coincidan con el nombre de la página.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog } from "@/components/ui/Dialog";
import { TextInput } from "@/components/ui/Field";
import { ALL_NAV_ITEMS } from "./Nav";
import type { NavItem } from "./Nav";

function score(item: NavItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const label = item.label.toLowerCase();
  const desc = item.description.toLowerCase();
  const keys = item.keywords.toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (keys.includes(q)) return 40;
  if (desc.includes(q)) return 20;
  return 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);

  // ⌘K / Ctrl+K global. También Ctrl+K sobre la "/" no se intercepta para no romper
  // escritura normal en los campos de texto.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    return ALL_NAV_ITEMS.map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  }, [query]);

  // Resetear al abrir: siempre arrancar desde el índice completo, no desde un filtro viejo.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (item: NavItem) => {
    setOpen(false);
    void navigate({ to: item.to });
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar una herramienta"
        aria-keyshortcuts="Control+K Meta+K"
        className={[
          "hidden items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5",
          "text-small text-ink-500 transition-colors duration-150 ease-smooth hover:border-line-control hover:text-ink-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          "sm:flex",
        ].join(" ")}
      >
        <span aria-hidden="true">⌕</span>
        <span>Buscar…</span>
        <kbd className="ml-1 rounded border border-line px-1 font-mono leading-none text-data text-ink-500">⌘K</kbd>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Buscar una herramienta" size="lg">
        <div className="mt-3">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="cartón, simular, frecuencias, pesos…"
            aria-label="Buscar una herramienta"
            aria-controls="palette-results"
            autoFocus
          />
        </div>

        <ul
          id="palette-results"
          ref={listRef}
          className="mt-3 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Resultados"
        >
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-small text-ink-600">
              Nada coincide con «{query}».
            </li>
          ) : (
            results.map((item, i) => (
              <li key={item.to} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(i)}
                  className={[
                    "block w-full rounded-md px-3 py-2.5 text-left transition-colors duration-150 ease-smooth",
                    i === active ? "bg-accent-tint" : "hover:bg-surface-sunken",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "block text-body font-medium",
                      i === active ? "text-accent-text-strong" : "text-ink-900",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-small leading-snug text-ink-600">{item.description}</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <p className="mt-3 border-t border-line pt-3 text-small text-ink-500">
          <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> para moverse ·{" "}
          <kbd className="font-mono">Enter</kbd> para abrir · <kbd className="font-mono">Esc</kbd> para cerrar
        </p>
      </Dialog>
    </>
  );
}