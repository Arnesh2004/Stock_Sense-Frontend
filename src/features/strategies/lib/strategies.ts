import type { Candle, ParamDef, Params, Signal, StrategyDef } from '../types';
import {
  bollinger,
  ema,
  highest,
  lowest,
  macd,
  roc,
  rsi,
  sma,
  stochastic,
  supertrend,
} from './indicators';

const closes = (c: Candle[]) => c.map((x) => x.c);
const highs = (c: Candle[]) => c.map((x) => x.h);
const lows = (c: Candle[]) => c.map((x) => x.l);

/** Tiny state machine: flat -> long when `enter`, long -> flat when `exit`. NaN comparisons are false. */
function fsm(n: number, enter: (i: number) => boolean, exit: (i: number) => boolean): Signal[] {
  const out: Signal[] = new Array<Signal>(n).fill(0);
  let pos: Signal = 0;
  for (let i = 0; i < n; i++) {
    if (pos === 0 && enter(i)) pos = 1;
    else if (pos === 1 && exit(i)) pos = 0;
    out[i] = pos;
  }
  return out;
}

const p = (key: string, label: string, min: number, max: number, step: number, def: number, hint?: string): ParamDef => ({
  key,
  label,
  min,
  max,
  step,
  default: def,
  hint,
});

const UPDATED = '2026-10-01';

export const BUILTIN_STRATEGIES: StrategyDef[] = [
  {
    id: 'sma-cross',
    name: 'SMA crossover',
    kind: 'builtin',
    category: 'Trend',
    summary: 'Hold while the fast average is above the slow average.',
    logic: 'BUY when the fast SMA is above the slow SMA. SELL when it falls back below. (50/200 is the classic "golden cross / death cross".)',
    bestFor: 'Long, smooth trends',
    weakness: 'Whipsaws in sideways markets; always late to turns',
    origin: 'Classic technical analysis',
    params: [
      p('fast', 'Fast SMA', 2, 100, 1, 20, 'Shorter = more trades, more noise'),
      p('slow', 'Slow SMA', 5, 300, 1, 50, 'Longer = fewer, later signals'),
    ],
    updatedAt: UPDATED,
    run: (c, { fast, slow }) => {
      const cl = closes(c);
      const f = sma(cl, fast);
      const s = sma(cl, slow);
      return cl.map((_, i) => (f[i] > s[i] ? 1 : 0));
    },
  },
  {
    id: 'ema-cross',
    name: 'EMA crossover',
    kind: 'builtin',
    category: 'Trend',
    summary: 'Like SMA crossover, but reacts faster to recent prices.',
    logic: 'BUY when the fast EMA is above the slow EMA. SELL when it drops below.',
    bestFor: 'Trending markets where speed matters',
    weakness: 'More false signals than SMA when price chops',
    origin: 'Classic technical analysis',
    params: [
      p('fast', 'Fast EMA', 2, 100, 1, 12),
      p('slow', 'Slow EMA', 5, 300, 1, 26),
    ],
    updatedAt: UPDATED,
    run: (c, { fast, slow }) => {
      const cl = closes(c);
      const f = ema(cl, fast);
      const s = ema(cl, slow);
      return cl.map((_, i) => (f[i] > s[i] ? 1 : 0));
    },
  },
  {
    id: 'macd',
    name: 'MACD signal cross',
    kind: 'builtin',
    category: 'Trend',
    summary: 'Trade momentum shifts when MACD crosses its signal line.',
    logic: 'BUY when the MACD line is above its signal line (histogram > 0). SELL when the histogram turns negative.',
    bestFor: 'Catching medium-term momentum swings',
    weakness: 'Lagging; many small losses in ranges',
    origin: 'Gerald Appel, late 1970s',
    params: [
      p('fast', 'Fast EMA', 2, 50, 1, 12),
      p('slow', 'Slow EMA', 5, 100, 1, 26),
      p('signal', 'Signal EMA', 2, 30, 1, 9),
    ],
    updatedAt: UPDATED,
    run: (c, { fast, slow, signal }) => {
      const { hist } = macd(closes(c), fast, slow, signal);
      return hist.map((h) => (h > 0 ? 1 : 0));
    },
  },
  {
    id: 'supertrend',
    name: 'SuperTrend',
    kind: 'builtin',
    category: 'Trend',
    summary: 'ATR-based trailing line that flips with the trend.',
    logic: 'BUY when price closes above the SuperTrend line (trend turns up). SELL when it closes below it.',
    bestFor: 'Strong trends with volatility-aware stops',
    weakness: 'Frequent flips in tight ranges',
    origin: 'Olivier Seban',
    params: [
      p('period', 'ATR period', 3, 50, 1, 10),
      p('mult', 'ATR multiplier', 1, 6, 0.1, 3, 'Higher = wider band, fewer flips'),
    ],
    updatedAt: UPDATED,
    run: (c, { period, mult }) => {
      const { dir } = supertrend(highs(c), lows(c), closes(c), period, mult);
      return dir.map((d) => (d === 1 ? 1 : 0));
    },
  },
  {
    id: 'rsi-mr',
    name: 'RSI mean reversion',
    kind: 'builtin',
    category: 'Mean reversion',
    summary: 'Buy oversold dips, sell once momentum recovers.',
    logic: 'BUY when RSI drops below the oversold level. SELL when RSI rises above the exit level.',
    bestFor: 'Range-bound, mean-reverting markets',
    weakness: '"Catching a falling knife" in strong downtrends',
    origin: 'J. Welles Wilder, 1978',
    params: [
      p('period', 'RSI period', 2, 50, 1, 14),
      p('oversold', 'Oversold below', 5, 50, 1, 30),
      p('exit', 'Exit above', 40, 90, 1, 55),
    ],
    updatedAt: UPDATED,
    run: (c, { period, oversold, exit }) => {
      const r = rsi(closes(c), period);
      return fsm(c.length, (i) => r[i] < oversold, (i) => r[i] > exit);
    },
  },
  {
    id: 'bb-mr',
    name: 'Bollinger mean reversion',
    kind: 'builtin',
    category: 'Mean reversion',
    summary: 'Buy a stretch below the lower band, exit at the average.',
    logic: 'BUY when price closes below the lower Bollinger Band. SELL when it closes back above the middle band (SMA).',
    bestFor: 'Sideways, low-trend markets',
    weakness: 'Bands keep expanding in a crash',
    origin: 'John Bollinger',
    params: [
      p('period', 'Band period', 5, 100, 1, 20),
      p('k', 'Std-dev width', 0.5, 4, 0.1, 2),
    ],
    updatedAt: UPDATED,
    run: (c, { period, k }) => {
      const cl = closes(c);
      const b = bollinger(cl, period, k);
      return fsm(c.length, (i) => cl[i] < b.lower[i], (i) => cl[i] >= b.mid[i]);
    },
  },
  {
    id: 'trend-filter',
    name: '200-day trend filter',
    kind: 'builtin',
    category: 'Trend',
    summary: 'Stay invested only while price is above its long moving average.',
    logic: 'BUY when price closes above its long SMA by more than the buffer. SELL when it closes below the SMA by more than the buffer. The buffer reduces whipsaws.',
    bestFor: 'Avoiding the worst of long bear markets',
    weakness: 'Gives back gains at the top; whipsaws around the average',
    origin: 'Widely used market-timing rule (e.g. Faber, 2007)',
    params: [
      p('period', 'SMA period', 20, 300, 1, 200),
      p('buffer', 'Buffer %', 0, 10, 0.5, 1, 'Price must clear the SMA by this much to flip'),
    ],
    updatedAt: UPDATED,
    run: (c, { period, buffer }) => {
      const cl = closes(c);
      const m = sma(cl, period);
      const up = 1 + buffer / 100;
      const dn = 1 - buffer / 100;
      return fsm(c.length, (i) => cl[i] > m[i] * up, (i) => cl[i] < m[i] * dn);
    },
  },
  {
    id: 'rsi2-pullback',
    name: 'RSI(2) pullback in uptrend',
    kind: 'builtin',
    category: 'Mean reversion',
    summary: 'Buy sharp short-term dips, but only above the 200-day trend.',
    logic: 'BUY when price is above its long SMA AND the 2-period RSI is below the entry level. SELL when price closes above its short SMA.',
    bestFor: 'Healthy uptrends with brief pullbacks',
    weakness: 'Sits out bear markets; sharp gaps can hurt',
    origin: 'Larry Connors & Cesar Alvarez',
    params: [
      p('trend', 'Trend SMA', 50, 300, 1, 200),
      p('rsiPeriod', 'RSI period', 2, 5, 1, 2),
      p('entry', 'Entry RSI below', 2, 30, 1, 10),
      p('exitSma', 'Exit SMA', 2, 20, 1, 5),
    ],
    updatedAt: UPDATED,
    run: (c, { trend, rsiPeriod, entry, exitSma }) => {
      const cl = closes(c);
      const t = sma(cl, trend);
      const r = rsi(cl, rsiPeriod);
      const x = sma(cl, exitSma);
      return fsm(c.length, (i) => cl[i] > t[i] && r[i] < entry, (i) => cl[i] > x[i]);
    },
  },
  {
    id: 'bb-breakout',
    name: 'Bollinger breakout',
    kind: 'builtin',
    category: 'Breakout',
    summary: 'Ride volatility expansions above the upper band.',
    logic: 'BUY when price closes above the upper Bollinger Band. SELL when it closes back below the middle band.',
    bestFor: 'Volatility expansion after consolidation',
    weakness: 'Fake-outs that reverse immediately',
    origin: 'John Bollinger',
    params: [
      p('period', 'Band period', 5, 100, 1, 20),
      p('k', 'Std-dev width', 0.5, 4, 0.1, 2),
    ],
    updatedAt: UPDATED,
    run: (c, { period, k }) => {
      const cl = closes(c);
      const b = bollinger(cl, period, k);
      return fsm(c.length, (i) => cl[i] > b.upper[i], (i) => cl[i] < b.mid[i]);
    },
  },
  {
    id: 'donchian',
    name: 'Donchian channel breakout',
    kind: 'builtin',
    category: 'Breakout',
    summary: 'Buy new N-day highs, exit on M-day lows (Turtle-style).',
    logic: 'BUY when price closes above the highest high of the previous N days. SELL when it closes below the lowest low of the previous M days.',
    bestFor: 'Big, sustained trends',
    weakness: 'Many small losses; needs patience through drawdowns',
    origin: 'Richard Donchian / Turtle Traders',
    params: [
      p('entryN', 'Entry: N-day high', 5, 200, 1, 20),
      p('exitN', 'Exit: M-day low', 3, 100, 1, 10),
    ],
    updatedAt: UPDATED,
    run: (c, { entryN, exitN }) => {
      const cl = closes(c);
      const hh = highest(highs(c), entryN);
      const ll = lowest(lows(c), exitN);
      // Compare against the PREVIOUS bar's channel so today's bar can't break its own level.
      return fsm(c.length, (i) => i > 0 && cl[i] > hh[i - 1], (i) => i > 0 && cl[i] < ll[i - 1]);
    },
  },
  {
    id: 'stochastic',
    name: 'Stochastic oscillator',
    kind: 'builtin',
    category: 'Momentum',
    summary: 'Buy a bullish %K/%D cross from oversold territory.',
    logic: 'BUY when %K crosses above %D after being below the oversold level. SELL when %K rises above the overbought level.',
    bestFor: 'Range-bound or gently trending markets',
    weakness: 'Stays "overbought" for a long time in strong trends',
    origin: 'George Lane, 1950s',
    params: [
      p('kPeriod', '%K period', 5, 30, 1, 14),
      p('dPeriod', '%D smoothing', 2, 10, 1, 3),
      p('oversold', 'Oversold below', 5, 40, 1, 20),
      p('overbought', 'Overbought above', 60, 95, 1, 80),
    ],
    updatedAt: UPDATED,
    run: (c, { kPeriod, dPeriod, oversold, overbought }) => {
      const { k, d } = stochastic(highs(c), lows(c), closes(c), kPeriod, dPeriod);
      return fsm(
        c.length,
        (i) => i > 0 && k[i - 1] <= d[i - 1] && k[i] > d[i] && k[i - 1] < oversold,
        (i) => k[i] > overbought,
      );
    },
  },
  {
    id: 'tsmom',
    name: 'Time-series momentum',
    kind: 'builtin',
    category: 'Momentum',
    summary: 'Own assets whose own past return is positive.',
    logic: 'BUY when the return over the lookback window is above the threshold. Go to cash when it is not.',
    bestFor: 'Persistent, multi-month trends',
    weakness: 'Momentum crashes at sharp market reversals',
    origin: 'Moskowitz, Ooi & Pedersen, 2012',
    params: [
      p('lookback', 'Lookback (days)', 20, 252, 1, 90, '~252 trading days = 1 year'),
      p('threshold', 'Min return %', -5, 20, 0.5, 0),
    ],
    updatedAt: UPDATED,
    run: (c, { lookback, threshold }) => {
      const r = roc(closes(c), lookback);
      return r.map((x) => (x * 100 > threshold ? 1 : 0));
    },
  },
  {
    id: 'buy-hold',
    name: 'Buy & hold (benchmark)',
    kind: 'builtin',
    category: 'Benchmark',
    summary: 'The bar every other strategy has to beat.',
    logic: 'BUY on day one. Never sell.',
    bestFor: 'Long-term investing; the honest baseline',
    weakness: 'Full exposure to every drawdown',
    origin: 'Passive investing',
    params: [],
    updatedAt: UPDATED,
    run: (c) => c.map(() => 1 as Signal),
  },
];

export const defaultParams = (s: StrategyDef): Params =>
  Object.fromEntries(s.params.map((d) => [d.key, d.default]));

/** Merge user-saved defaults over factory defaults, ignoring keys that no longer exist. */
export const resolveParams = (s: StrategyDef, saved?: Params): Params => {
  const base = defaultParams(s);
  if (!saved) return base;
  for (const k of Object.keys(base)) if (typeof saved[k] === 'number') base[k] = saved[k];
  return base;
};
