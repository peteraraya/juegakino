import { useUiStore } from "@/stores/uiStore";

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-left text-sm shadow-lg backdrop-blur transition-opacity ${
            t.kind === "success"
              ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
              : t.kind === "error"
                ? "border-red-200 bg-red-50/95 text-red-900"
                : "border-gray-200 bg-white/95 text-gray-800"
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}