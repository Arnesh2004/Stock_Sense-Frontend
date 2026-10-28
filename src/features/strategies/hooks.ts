import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Candle, Params, RuleSet, StrategyDef } from './types';
import { BUILTIN_STRATEGIES } from './lib/strategies';
import { SEED_RULES, ruleToStrategy } from './lib/ruleEngine';
import { loadCandles } from './lib/marketApi';
import type { DataSource } from './lib/marketApi';

/** localStorage-backed state. Wrapped in try/catch: storage can be blocked or full. */
function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

/**
 * Strategy library state: built-ins + user rule-builder strategies + saved parameter defaults.
 * Swap the localStorage calls for API calls (GET/POST /strategies) when the backend is ready.
 */
export function useStrategyLibrary() {
  const [rules, setRules] = usePersistentState<RuleSet[]>('stocksense.rules.v1', SEED_RULES);
  const [saved, setSaved] = usePersistentState<Record<string, Params>>('stocksense.params.v1', {});

  const strategies: StrategyDef[] = useMemo(
    () => [...BUILTIN_STRATEGIES, ...rules.map(ruleToStrategy)],
    [rules],
  );

  const saveRule = useCallback(
    (rule: RuleSet) =>
      setRules((prev) => {
        const next = { ...rule, updatedAt: new Date().toISOString().slice(0, 10) };
        return prev.some((r) => r.id === rule.id) ? prev.map((r) => (r.id === rule.id ? next : r)) : [...prev, next];
      }),
    [setRules],
  );
  const deleteRule = useCallback((id: string) => setRules((prev) => prev.filter((r) => r.id !== id)), [setRules]);
  const saveParams = useCallback((id: string, p: Params) => setSaved((prev) => ({ ...prev, [id]: p })), [setSaved]);
  const resetParams = useCallback(
    (id: string) =>
      setSaved((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }),
    [setSaved],
  );

  return { strategies, rules, saved, saveRule, deleteRule, saveParams, resetParams };
}

export function useCandles(symbol: string) {
  const [state, setState] = useState<{ candles: Candle[]; source: DataSource; loading: boolean }>({
    candles: [],
    source: 'sample',
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loadCandles(symbol).then((r) => alive && setState({ ...r, loading: false }));
    return () => {
      alive = false;
    };
  }, [symbol]);
  return state;
}
