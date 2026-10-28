export interface Candle {
  /** ISO date (YYYY-MM-DD) */
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/** Target position after the bar closes: 1 = long, 0 = flat. Long-only (educational scope). */
export type Signal = 0 | 1;

export type Params = Record<string, number>;

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  hint?: string;
}

export type StrategyCategory =
  | 'Trend'
  | 'Momentum'
  | 'Mean reversion'
  | 'Breakout'
  | 'Benchmark'
  | 'Custom';

export interface StrategyDef {
  id: string;
  name: string;
  kind: 'builtin' | 'rule';
  category: StrategyCategory;
  /** One line shown on the card. */
  summary: string;
  /** Plain-English rules (entry / exit). */
  logic: string;
  bestFor: string;
  weakness: string;
  /** Where the idea comes from. */
  origin: string;
  params: ParamDef[];
  updatedAt: string;
  run: (candles: Candle[], params: Params) => Signal[];
}

/* ---------------- Rule builder ---------------- */

export type OperandType =
  | 'close'
  | 'open'
  | 'high'
  | 'low'
  | 'volume'
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'roc'
  | 'bbUpper'
  | 'bbLower'
  | 'highest'
  | 'lowest'
  | 'value';

export interface Operand {
  type: OperandType;
  /** Lookback for indicators. */
  period: number;
  /** Constant for type === 'value'. */
  value: number;
}

export type Comparator = '<' | '>' | '<=' | '>=' | 'crossesAbove' | 'crossesBelow';

export interface Condition {
  id: string;
  left: Operand;
  op: Comparator;
  right: Operand;
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

export interface RuleSet {
  id: string;
  name: string;
  updatedAt: string;
  entry: ConditionGroup;
  exit: ConditionGroup;
}

/* ---------------- Backtest ---------------- */

export interface BacktestConfig {
  initialCapital: number;
  /** Per side, % of traded value. */
  feePct: number;
  /** Per side, % adverse price move. */
  slippagePct: number;
  /** % of current equity allocated on entry. */
  positionPct: number;
  /** 0 = disabled. */
  stopLossPct: number;
  /** 0 = disabled. */
  takeProfitPct: number;
}

export type ExitReason = 'signal' | 'stop' | 'target' | 'end';

export interface Trade {
  entryIdx: number;
  exitIdx: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
  retPct: number;
  bars: number;
  reason: ExitReason;
}

export interface Metrics {
  totalReturnPct: number;
  buyHoldReturnPct: number;
  cagrPct: number;
  sharpe: number;
  sortino: number;
  maxDrawdownPct: number;
  calmar: number;
  winRatePct: number;
  profitFactor: number;
  trades: number;
  avgTradePct: number;
  exposurePct: number;
  finalEquity: number;
}

export interface BacktestResult {
  dates: string[];
  equity: number[];
  benchmark: number[];
  drawdownPct: number[];
  trades: Trade[];
  metrics: Metrics;
}

export interface SymbolSpec {
  symbol: string;
  name: string;
  currency: 'INR' | 'USD';
}
