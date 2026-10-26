import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Layers, 
  PlayCircle, 
  History, 
  TrendingUp, 
  PlusCircle, 
  LogOut 
} from 'lucide-react';

type TabType = 'dashboard' | 'market' | 'strategies' | 'new-backtest' | 'backtests' | 'paper-trading';

interface MetricCardProps {
  label: string;
  value: string;
}

interface BacktestData {
  id: string;
  strategy: string;
  symbol: string;
  timeframe: string;
  returnVal: string;
  status: 'DONE' | 'RUNNING' | 'FAILED';
}

const RECENT_BACKTESTS: BacktestData[] = [
  { id: '1', strategy: 'SMA crossover (20/50)', symbol: 'BTC/USDT', timeframe: '1h', returnVal: '+18.4%', status: 'DONE' },
  { id: '2', strategy: 'RSI mean reversion', symbol: 'ETH/USDT', timeframe: '1h', returnVal: '-3.1%', status: 'DONE' },
  { id: '3', strategy: 'Bollinger breakout', symbol: 'BTC/USDT', timeframe: '1d', returnVal: '-', status: 'RUNNING' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [userEmail] = useState<string>('you@example.com');

  const sidebarItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'market' as TabType, label: 'Market', icon: BarChart3 },
    { id: 'strategies' as TabType, label: 'Strategies', icon: Layers },
    { id: 'new-backtest' as TabType, label: 'New backtest', icon: PlusCircle },
    { id: 'backtests' as TabType, label: 'Backtests', icon: History },
    { id: 'paper-trading' as TabType, label: 'Paper trading', icon: PlayCircle },
  ];

  return (
    <div className="flex h-screen w-full bg-white font-sans text-slate-800 antialiased">
      
      {/* SIDEBAR */}
      <aside className="flex w-64 flex-col border-r border-slate-300 bg-white px-4 py-6 justify-between shrink-0">
        <div>
          {/* Rebranded Header */}
          <div className="mb-8 px-2">
            <h1 className="border border-slate-950 px-6 py-2 text-xl font-bold tracking-tight text-slate-950 inline-block">
              StockSense
            </h1>
          </div>

          {/* Sidebar Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2 text-[10px] leading-relaxed text-slate-400 font-medium">
          Simulated results only. <br /> Not financial advice.
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-end border-b border-slate-300 px-8 gap-6 bg-white shrink-0">
          <span className="text-sm text-slate-500">{userEmail}</span>
          <button 
            onClick={() => alert('Log out click detected')}
            className="flex items-center gap-2 border border-slate-400 px-4 py-1.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </header>

        {/* CONTAINER VIEW CANVAS */}
        <main className="flex-1 overflow-y-auto bg-white p-8">
          {activeTab === 'dashboard' ? (
            <div className="mx-auto max-w-6xl space-y-8">
              
              {/* Dashboard Content Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <button 
                  onClick={() => setActiveTab('new-backtest')}
                  className="flex items-center gap-2 bg-slate-900 px-4 py-2 text-sm text-white transition-all hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  + New backtest
                </button>
              </div>

              {/* Metric Card Matrix Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="BACKTESTS RUN" value="12" />
                <MetricCard label="BEST RETURN" value="+18.4%" />
                <MetricCard label="LIVE PAPER SESSIONS" value="1" />
                <MetricCard label="DATA COVERAGE" value="BTC, ETH" />
              </div>

              {/* Table Wrapper Border Section */}
              <div className="border border-slate-400 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-400 px-6 py-4 bg-white">
                  <h3 className="font-bold text-slate-950">Recent backtests</h3>
                  <button 
                    onClick={() => setActiveTab('backtests')}
                    className="text-xs text-slate-500 hover:text-slate-950 transition-colors underline underline-offset-4"
                  >
                    View all
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-300 text-xs font-semibold text-slate-500">
                        <th className="px-6 py-3">Strategy</th>
                        <th className="px-6 py-3">Symbol</th>
                        <th className="px-6 py-3">TF</th>
                        <th className="px-6 py-3">Return</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {RECENT_BACKTESTS.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <span 
                              onClick={() => setActiveTab('backtests')}
                              className="cursor-pointer hover:underline text-slate-700"
                            >
                              {row.strategy}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">{row.symbol}</td>
                          <td className="px-6 py-4 text-slate-600 text-xs">{row.timeframe}</td>
                          <td className="px-6 py-4 font-medium text-xs text-slate-800">
                            {row.returnVal}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold tracking-wide text-slate-700">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* Interactive Placeholder Section */
            <div className="mx-auto max-w-6xl border border-dashed border-slate-400 bg-white p-12 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 text-sm font-bold text-slate-950 capitalize">{activeTab.replace('-', ' ')} Window</h3>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
                This area updates dynamically when clicking side options. Content layouts for the <span className="font-mono text-slate-700 font-bold">/{activeTab}</span> component layer go directly inside this view container.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="border border-slate-400 bg-[#F1F3F5] p-5">
      <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
