import type { Candle, SymbolSpec } from '../types';
import { SAMPLE_SYMBOLS, generateCandles } from './sampleData';

const API = import.meta.env.VITE_API_URL as string | undefined;

export const SYMBOLS: SymbolSpec[] = SAMPLE_SYMBOLS.map(({ symbol, name, currency }) => ({ symbol, name, currency }));

export type DataSource = 'api' | 'sample';

interface ApiBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Loads OHLCV history for a symbol.
 * Contract with the FastAPI backend:  GET {VITE_API_URL}/market/{symbol}/ohlcv -> ApiBar[] (oldest first)
 * Falls back to deterministic sample data when the API is not configured or unreachable.
 */
export async function loadCandles(symbol: string): Promise<{ candles: Candle[]; source: DataSource }> {
  if (API) {
    try {
      const res = await fetch(`${API}/market/${encodeURIComponent(symbol)}/ohlcv`);
      if (res.ok) {
        const rows = (await res.json()) as ApiBar[];
        const candles = rows
          .map((r) => ({ t: r.date.slice(0, 10), o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume }))
          .filter((c) => [c.o, c.h, c.l, c.c].every(Number.isFinite))
          .sort((a, b) => a.t.localeCompare(b.t));
        if (candles.length > 250) return { candles, source: 'api' };
      }
    } catch {
      /* fall through to sample data */
    }
  }
  const spec = SAMPLE_SYMBOLS.find((s) => s.symbol === symbol) ?? SAMPLE_SYMBOLS[0];
  return { candles: generateCandles(spec), source: 'sample' };
}
