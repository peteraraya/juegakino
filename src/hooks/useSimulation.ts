import { useCallback, useEffect, useRef, useState } from "react";
import type { SimulationConfig } from "@/domain";
import { normalizeSeed } from "@/domain";
import type {
  SimulationRequest,
  WorkerMessage,
} from "@/workers/simulation.worker";
import SimulationWorker from "@/workers/simulation.worker?worker";

export interface SimOutput {
  draws: number;
  seed: number;
  matchHistogram: number[];
  prizeWins: number;
  numberFrequency: number[];
}

/** Envía un trabajo de simulación a un Web Worker con progreso y cancelación. */
export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<SimOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new SimulationWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        setProgress(msg.total === 0 ? 0 : Math.round((msg.done / msg.total) * 100));
      } else if (msg.type === "result") {
        setResult(msg);
        setRunning(false);
        setProgress(100);
      } else if (msg.type === "error") {
        setError(msg.message);
        setRunning(false);
        setProgress(null);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((config: SimulationConfig, carton?: number[], weights?: number[]) => {
    setError(null);
    setResult(null);
    setProgress(0);
    setRunning(true);
    const req: SimulationRequest = {
      type: "run",
      seed: normalizeSeed(config.seed),
      draws: config.draws,
      carton,
      weights,
    };
    workerRef.current?.postMessage(req);
  }, []);

  const cancel = useCallback(() => {
    workerRef.current?.postMessage({ type: "cancel" } satisfies SimulationRequest);
    setRunning(false);
    setProgress(null);
  }, []);

  return { running, progress, result, error, run, cancel };
}