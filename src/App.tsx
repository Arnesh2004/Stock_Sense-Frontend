import { useState } from 'react';
import Dashboard from './Dashboard';
import StrategiesPage from './features/strategies/StrategiesPage';

type Page = 'dashboard' | 'strategies';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <>
      {/* Temporary switcher. We'll move this into your Sidebar next. */}
      <div className="flex gap-2 border-b border-[var(--ink)] bg-white px-4 py-2">
        {(['dashboard', 'strategies'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            aria-current={page === p ? 'page' : undefined}
            className={
              page === p
                ? 'bg-[var(--ink)] px-3 py-1 text-sm capitalize text-white'
                : 'border border-[var(--ink)] px-3 py-1 text-sm capitalize'
            }
          >
            {p}
          </button>
        ))}
      </div>

      {page === 'dashboard' ? (
        <Dashboard />
      ) : (
        <div className="p-6">
          <StrategiesPage />
        </div>
      )}
    </>
  );
}

export default App;