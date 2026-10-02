import { iterateAllKinoCartons, matchesIdealKinoTips, TOTAL_COMBINATIONS } from "@/domain";
import type { KinoTipCondition } from "@/domain";

export type KinoTipsSearchRequest =
  | { type: "search"; requestId: number; conditions: KinoTipCondition[] }
  | { type: "cancel"; requestId: number };

export type KinoTipsSearchMessage =
  | { type: "progress"; requestId: number; checked: number; total: number }
  | { type: "result"; requestId: number; carton: number[] | null; checked: number }
  | { type: "cancelled"; requestId: number }
  | { type: "error"; requestId: number; message: string };

const CHUNK_SIZE = 10_000;
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let activeRequestId: number | null = null;

ctx.addEventListener("message", (event: MessageEvent<KinoTipsSearchRequest>) => {
  const request = event.data;
  if (request.type === "cancel") {
    if (activeRequestId === request.requestId) {
      activeRequestId = null;
      ctx.postMessage({ type: "cancelled", requestId: request.requestId } satisfies KinoTipsSearchMessage);
    }
    return;
  }

  activeRequestId = request.requestId;
  void search(request.requestId, request.conditions);
});

async function search(requestId: number, conditions: KinoTipCondition[]): Promise<void> {
  try {
    const records = iterateAllKinoCartons();
    let checked = 0;

    while (activeRequestId === requestId) {
      for (let index = 0; index < CHUNK_SIZE; index++) {
        if (activeRequestId !== requestId) return;
        const next = records.next();
        if (next.done) {
          activeRequestId = null;
          ctx.postMessage({ type: "result", requestId, carton: null, checked } satisfies KinoTipsSearchMessage);
          return;
        }

        checked++;
        if (matchesIdealKinoTips(next.value, conditions)) {
          activeRequestId = null;
          ctx.postMessage({ type: "result", requestId, carton: next.value, checked } satisfies KinoTipsSearchMessage);
          return;
        }
      }

      ctx.postMessage({ type: "progress", requestId, checked, total: TOTAL_COMBINATIONS } satisfies KinoTipsSearchMessage);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  } catch (error) {
    activeRequestId = null;
    ctx.postMessage({
      type: "error",
      requestId,
      message: error instanceof Error ? error.message : "Falló la búsqueda de cartones.",
    } satisfies KinoTipsSearchMessage);
  }
}