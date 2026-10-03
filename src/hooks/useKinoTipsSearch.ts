import { useCallback, useEffect, useRef, useState } from "react";
import type { KinoTipCondition } from "@/domain";
import { randomSeed } from "@/domain";
import type { KinoTipsSearchMessage, KinoTipsSearchRequest } from "@/workers/kinoTipsSearch.worker";
import KinoTipsSearchWorker from "@/workers/kinoTipsSearch.worker?worker";

export interface KinoTipsSearchResult {
  carton: number[] | null;
  checked: number;
  onlyCurrentCarton: boolean;
}

export function useKinoTipsSearch() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<KinoTipsSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new KinoTipsSearchWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<KinoTipsSearchMessage>) => {
      const message = event.data;
      if (message.requestId !== requestIdRef.current) return;

      if (message.type === "progress") {
        setChecked(message.checked);
        setTotal(message.total);
      } else if (message.type === "result") {
        setResult({
          carton: message.carton,
          checked: message.checked,
          onlyCurrentCarton: message.onlyCurrentCarton,
        });
        setRunning(false);
      } else if (message.type === "cancelled") {
        setRunning(false);
      } else if (message.type === "error") {
        setError(message.message);
        setRunning(false);
      }
    };

    worker.onerror = (event) => {
      setError(event.message || "Falló la búsqueda de cartones.");
      setRunning(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const search = useCallback((conditions: KinoTipCondition[], currentCarton: number[]) => {
    if (conditions.length === 0) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setRunning(true);
    setChecked(0);
    setTotal(0);
    setResult(null);
    setError(null);
    const request: KinoTipsSearchRequest = {
      type: "search",
      requestId,
      conditions,
      seed: randomSeed(),
      currentCarton,
    };
    workerRef.current?.postMessage(request);
  }, []);

  const cancel = useCallback(() => {
    const requestId = requestIdRef.current;
    const request: KinoTipsSearchRequest = { type: "cancel", requestId };
    workerRef.current?.postMessage(request);
    requestIdRef.current++;
    setRunning(false);
  }, []);

  return { running, checked, total, result, error, search, cancel };
}