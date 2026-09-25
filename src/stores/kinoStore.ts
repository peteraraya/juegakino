import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Carton, GenerationStrategy, SimulationConfig } from "@/domain";
import { randomSeed } from "@/domain";
import { DEFAULT_BALL_WEIGHTS } from "@/domain";
import type { BallWeights } from "@/domain";
import { CartonSchema } from "@/domain";

export interface StoredSimulationResult {
  draws: number;
  seed: number;
  matchHistogram: number[];
  prizeWins: number;
  numberFrequency: number[];
}

interface KinoState {
  /** Cartón seleccionado por el usuario (hasta 14 números del 1..25). */
  carton: number[];
  /** Configuración de simulación (semilla + cantidad de sorteos). */
  config: SimulationConfig;
  /** Estrategia de generación de cartón. */
  strategy: GenerationStrategy;
  /** Caso "progreso de simulación" en curso. */
  simulationRunning: boolean;
  simulationProgress: number | null;
  /** Frecuencias de números desde la última simulación (para generación hot/cold). */
  numberFrequency: number[] | null;
  /** Resultado de la última simulación (para Estadísticas: observado vs teórico). */
  lastResult: StoredSimulationResult | null;
  /** Peso (kg) editado de cada bolilla 1..25 — para el modelo de sesgo. */
  ballWeights: BallWeights;
  /** Si la simulación debe usar el sorteo ponderado por pesos. */
  useBallWeights: boolean;

  toggleBall: (n: number) => void;
  setCarton: (carton: Carton) => void;
  configure: (patch: Partial<SimulationConfig>) => void;
  setStrategy: (strategy: GenerationStrategy) => void;
  setRunning: (running: boolean, progress?: number | null) => void;
  setNumberFrequency: (freq: number[] | null) => void;
  setLastResult: (result: StoredSimulationResult | null) => void;
  setBallWeight: (index: number, weightKg: number) => void;
  resetBallWeights: () => void;
  setUseBallWeights: (use: boolean) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: SimulationConfig = {
  seed: randomSeed(),
  draws: 10_000,
  prizeThreshold: 14,
};

/** Persistencia en localStorage: cartón, estrategia, config y pesos sobreviven a recargar. */
export const useKinoStore = create<KinoState>()(
  persist(
    (set) => ({
      carton: [],
      config: DEFAULT_CONFIG,
      strategy: "random",
      simulationRunning: false,
      simulationProgress: null,
      numberFrequency: null,
      lastResult: null,
      ballWeights: DEFAULT_BALL_WEIGHTS,
      useBallWeights: false,

      toggleBall: (n) =>
        set((s) => {
          const has = s.carton.includes(n);
          if (has) return { carton: s.carton.filter((x) => x !== n) };
          if (s.carton.length >= 14) return {};
          return { carton: [...s.carton, n].sort((a, b) => a - b) };
        }),

      setCarton: (carton) => set({ carton }),
      configure: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      setStrategy: (strategy) => set({ strategy }),
      setRunning: (running, progress = null) => set({ simulationRunning: running, simulationProgress: progress }),
      setNumberFrequency: (numberFrequency) => set({ numberFrequency }),
      setLastResult: (lastResult) => set({ lastResult }),
      setBallWeight: (index, weightKg) =>
        set((s) => {
          const weights = [...s.ballWeights];
          weights[index] = weightKg;
          return { ballWeights: weights };
        }),
      resetBallWeights: () => set({ ballWeights: DEFAULT_BALL_WEIGHTS }),
      setUseBallWeights: (useBallWeights) => set({ useBallWeights }),
      reset: () =>
        set({
          carton: [],
          config: DEFAULT_CONFIG,
          strategy: "random",
          numberFrequency: null,
          lastResult: null,
          ballWeights: DEFAULT_BALL_WEIGHTS,
          useBallWeights: false,
        }),
    }),
    {
      name: "juega-kino-store",
      partialize: (s) => ({
        carton: s.carton,
        config: s.config,
        strategy: s.strategy,
        ballWeights: s.ballWeights,
        useBallWeights: s.useBallWeights,
      }),
      onRehydrateStorage: () => (state) => {
        // Protégete contra estado corrupto guardado (p.ej. cartón con 25 números).
        if (state && state.carton.length > 0 && !CartonSchema.safeParse(state.carton).success) {
          state.carton = [];
        }
      },
    },
  ),
);