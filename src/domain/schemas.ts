import { z } from "zod";

/** Validación del cartón: exactamente 14 números distintos del 1..25. */
export const CartonSchema = z
  .array(z.number().int().min(1).max(25))
  .length(14)
  .refine((vals) => new Set(vals).size === vals.length, {
    message: "El cartón no debe repetir números",
  });

export type Carton = z.infer<typeof CartonSchema>;

export const SimulationConfigSchema = z.object({
  /** Semilla visible/editable; fijarla reproduce el mismo resultado. */
  seed: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  /** Número de sorteos a simular (1K–1M). */
  draws: z.number().int().min(1).max(1_000_000),
  /** Campitón de aciertos a evaluar en el cartón (10..14). */
  prizeThreshold: z.number().int().min(10).max(14).default(14),
});

export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;

export const SimulationResultSchema = z.object({
  draws: z.number().int().positive(),
  seed: z.number().int().nonnegative(),
  matchHistogram: z.array(z.number().int().nonnegative()),
  prizeWins: z.number().int().nonnegative(),
  numberFrequency: z.array(z.number().int().nonnegative()),
});

export type SimulationResult = z.infer<typeof SimulationResultSchema>;

export const GenerationStrategySchema = z.enum([
  "random",
  "hot",
  "cold",
  "balanced",
]);

export type GenerationStrategy = z.infer<typeof GenerationStrategySchema>;