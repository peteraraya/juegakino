/**
 * Skeleton — placeholder de carga.
 *
 * Reemplaza los `<p>Cargando…</p>` que eran el fallback de `Suspense`. Un texto de carga
 * hace que la región aparezca ya poblada y salte de alto; un skeleton reserva el espacio
 * y no provoca layout shift.
 *
 * `role="status"` + texto sr-only: la carga se anuncia sin ensuciar la vista.
 * El shimmer respeta `prefers-reduced-motion` (baja a opacidad fija).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={["relative overflow-hidden bg-surface-sunken rounded-md", className].join(" ")}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.06] to-transparent motion-reduce:animate-none" />
    </div>
  );
}

/** Bloque de carga con su anuncio accesible. Para usar como fallback de Suspense. */
export function LoadingBlock({ label = "Cargando" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">{label}…</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-prose" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}