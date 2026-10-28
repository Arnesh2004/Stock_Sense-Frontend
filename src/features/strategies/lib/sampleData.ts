import type { Candle, SymbolSpec } from '../types';

interface SampleSpec extends SymbolSpec {
  seed: number;
  start: number;
  bias: number;
}

export const SAMPLE_SYMBOLS: SampleSpec[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', currency: 'INR', seed: 11, start: 1400, bias: 0.08 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', currency: 'INR', seed: 23, start: 3300, bias: 0.04 },
  { symbol: 'INFY.NS', name: 'Infosys', currency: 'INR', seed: 37, start: 1450, bias: 0.02 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', currency: 'INR', seed: 41, start: 1550, bias: 0.06 },
  { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', seed: 53, start: 160, bias: 0.1 },
];

/** Deterministic PRNG so the same symbol always renders the same sample history. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function businessDaysBack(end: Date, count: number): string[] {
  const days: string[] = [];
  const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (days.length < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days.reverse();
}

const REGIMES = [
  { mu: 0.28, vol: 0.17 }, // calm bull
  { mu: -0.22, vol: 0.3 }, // bear
  { mu: 0.0, vol: 0.14 }, // range-bound
  { mu: 0.1, vol: 0.34 }, // choppy / volatile
];

/** Synthetic OHLCV with regime switching so trend AND mean-reversion strategies both get a fair test. */
export function generateCandles(spec: SampleSpec, bars = 1300, end = new Date()): Candle[] {
  const rnd = mulberry32(spec.seed);
  const gauss = () => {
    const u = Math.max(rnd(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  const dates = businessDaysBack(end, bars);
  const out: Candle[] = [];
  let prev = spec.start;
  let regime = REGIMES[0];
  let left = 0;
  for (let i = 0; i < bars; i++) {
    if (left-- <= 0) {
      regime = REGIMES[Math.floor(rnd() * REGIMES.length)];
      left = 60 + Math.floor(rnd() * 140);
    }
    const dailyVol = regime.vol / Math.sqrt(252);
    const r = (regime.mu + spec.bias) / 252 + dailyVol * gauss();
    const o = prev * (1 + 0.003 * gauss());
    const c = o * Math.exp(r);
    const wick = dailyVol * 0.5;
    const h = Math.max(o, c) * (1 + Math.abs(gauss()) * wick);
    const l = Math.min(o, c) * (1 - Math.abs(gauss()) * wick);
    const v = Math.round(1_000_000 * Math.exp(0.4 * gauss()) * (1 + Math.abs(r) * 40));
    out.push({ t: dates[i], o: round(o), h: round(h), l: round(l), c: round(c), v });
    prev = c;
  }
  return out;
}

const round = (x: number) => Math.round(x * 100) / 100;
