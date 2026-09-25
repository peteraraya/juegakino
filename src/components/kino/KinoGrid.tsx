/** Grid de bolillas del Kino (1..25). Selección de hasta 14 números. */
import { PICK_SIZE } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";

export function KinoGrid() {
  const carton = useKinoStore((s) => s.carton);
  const toggleBall = useKinoStore((s) => s.toggleBall);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          Cartón: <span className="font-mono">{carton.length}</span>/<span className="font-mono">{PICK_SIZE}</span>
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
          const selected = carton.includes(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              disabled={!selected && carton.length >= PICK_SIZE}
              onClick={() => toggleBall(n)}
              className={`flex h-11 items-center justify-center rounded-full font-mono text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kino-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "bg-kino-red-600 text-white hover:bg-kino-red-700"
                  : "border border-gray-200 bg-white text-gray-800 hover:border-kino-red-400 hover:text-kino-red-700"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}