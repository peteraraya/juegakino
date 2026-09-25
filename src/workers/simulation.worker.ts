import { CartonSchema } from "@/domain/schemas";
import { isValidBallWeights } from "@/domain/ballWeights";
import { createPrng } from "@/domain/prng";
import { drawNumbers, countMatches } from "@/domain/simulation";
import { drawNumbersWeighted } from "@/domain/ballWeights";
import { KINO_SIZE, PICK_SIZE } from "@/domain/probabilities";

export type SimulationRequest =
  | { type: "run"; seed: number; draws: number; carton?: number[]; weights?: number[] }
  | { type: "cancel" };

export type WorkerProgress = { type: "progress"; done: number; total: number };

export type WorkerResult = {
  type: "result";
  draws: number;
  seed: number;
  matchHistogram: number[];
  prizeWins: number;
  numberFrequency: number[];
};

export type WorkerError = { type: "error"; message: string };

export type WorkerMessage = WorkerProgress | WorkerResult | WorkerError;

const CHUNK = 25_000;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

let cancelled = false;

ctx.addEventListener("message", (event: MessageEvent<SimulationRequest>) => {
  if (event.data.type === "cancel") {
    cancelled = true;
    return;
  }

  const { seed, draws, carton, weights } = event.data;
  const cartonParsed = carton ? CartonSchema.safeParse(carton) : undefined;
  if (cartonParsed && !cartonParsed.success) {
    ctx.postMessage({ type: "error", message: "Cartón inválido" } satisfies WorkerError);
    return;
  }
  const cartonValid = cartonParsed?.data;
  const weightsValid = weights ? (isValidBallWeights(weights) ? weights : null) : null;
  if (weights && !weightsValid) {
    ctx.postMessage({ type: "error", message: "Pesos de bolillas inválidos" } satisfies WorkerError);
    return;
  }

  cancelled = false;
  const rand = createPrng(seed);
  const matchHistogram = new Array<number>(PICK_SIZE + 1).fill(0);
  const numberFrequency = new Array<number>(KINO_SIZE).fill(0);
  let prizeWins = 0;

  let done = 0;
  while (done < draws) {
    if (cancelled) {
      ctx.postMessage({ type: "error", message: "Simulación cancelada" } satisfies WorkerError);
      return;
    }
    const batch = Math.min(CHUNK, draws - done);
    for (let i = 0; i < batch; i++) {
      const draw = weightsValid ? drawNumbersWeighted(rand, weightsValid) : drawNumbers(rand);
      for (const n of draw) numberFrequency[n - 1]++;
      if (cartonValid) {
        const m = countMatches(cartonValid, draw);
        matchHistogram[m]++;
        if (m >= 10) prizeWins++;
      }
    }
    done += batch;
    ctx.postMessage({ type: "progress", done, total: draws } satisfies WorkerProgress);
  }

  ctx.postMessage(
    { type: "result", draws, seed, matchHistogram, prizeWins, numberFrequency } satisfies WorkerResult,
  );
});