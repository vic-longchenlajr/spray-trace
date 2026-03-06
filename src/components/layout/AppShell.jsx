import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◫' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function AppShell({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link to="/" className="text-lg font-bold text-accent no-underline tracking-tight">
            SprayTrace
          </Link>
          <div className="text-xs text-text-muted mt-0.5">Deflector Distribution Tracker</div>
        </div>
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline mb-0.5 transition-colors ${
                location.pathname === item.path
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-muted hover:bg-surface-light hover:text-text'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border text-xs text-text-muted">
          v{__APP_VERSION__}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
