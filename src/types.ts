export type TabType = 'dashboard' | 'market' | 'strategies' | 'new-backtest' | 'backtests' | 'paper-trading';

export interface MetricCardProps {
  label: string;
  value: string;
}

export interface BacktestData {
  id: string;
  strategy: string;
  symbol: string;
  timeframe: string;
  returnVal: string;
  status: 'DONE' | 'RUNNING' | 'FAILED';
}
