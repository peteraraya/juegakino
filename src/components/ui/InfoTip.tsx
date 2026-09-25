import { useState } from "react";

/** Tooltip informativo de solo interrogación — comunica contexto sin ocupar layout. */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={`Ayuda: ${label}`}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-kino-red-300 bg-kino-red-50 font-mono text-[10px] font-bold text-kino-red-700 hover:bg-kino-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-kino-red-600"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}