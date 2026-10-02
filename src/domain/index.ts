export {
  createPrng,
  hashSeed,
  normalizeSeed,
  randomSeed,
} from "./prng";

export {
  KINO_SIZE,
  PICK_SIZE,
  MIN_PRIZE_MATCHES,
  EXPECTED_MATCHES,
  TOTAL_COMBINATIONS,
  combinations,
  probabilityExactMatches,
  probabilityAtLeast,
  probabilityTable,
} from "./probabilities";

export {
  drawNumbers,
  countMatches,
  generateCarton,
  runSimulation,
} from "./simulation";

export {
  generateBalancedCarton,
  generateCartonByStrategy,
  iterateAllKinoCartons,
} from "./generation";

export {
  parseDrawResults,
  verifyCarton,
  summarizeVerification,
} from "./verifier";

export {
  KINO_TIP_DEFS,
  kinoTipsMetrics,
  evaluateKinoTips,
  matchesIdealKinoTips,
  kinoStyleScore,
  analyzeDrawsAgainstTips,
  countActive,
} from "./kinoTips";

export type {
  KinoTipCondition,
  KinoTipDefinition,
  KinoTipsMetrics,
  KinoTipResult,
  Status,
  TipEmpiricalStats,
} from "./kinoTips";

export type { DrawParseResult, DrawParseError, VerificationRow, VerificationSummary } from "./verifier";

export {
  DEFAULT_BALL_WEIGHTS,
  BALL_WEIGHT_MIN,
  BALL_WEIGHT_MAX,
  UNIFORM_BALL_WEIGHT,
  isValidBallWeights,
  relativeSelectionShare,
  drawNumbersWeighted,
  runWeightedSimulation,
  analyzeBallEmpirics,
} from "./ballWeights";

export type { BallWeights, BallEmpiricalRow } from "./ballWeights";

export type { SimulationResult as SimulationResultDomain } from "./simulation";
export {
  CartonSchema,
  SimulationConfigSchema,
  SimulationResultSchema,
  GenerationStrategySchema,
} from "./schemas";

export type { Carton, SimulationConfig, GenerationStrategy } from "./schemas";