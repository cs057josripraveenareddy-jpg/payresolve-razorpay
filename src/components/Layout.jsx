import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, RefreshCw, Gavel, ShieldCheck } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recovery', label: 'Revenue Recovery', icon: RefreshCw },
  { to: '/judge-demo', label: 'Judge Demo', icon: Gavel },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar-background flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-sidebar-foreground leading-tight">PayResolve</h1>
              <p className="text-[11px] text-muted-foreground tracking-wide">AI Revenue Recovery</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-[11px] font-semibold text-sidebar-foreground mb-0.5">Synthetic Demo Data</p>
            <p className="text-[11px] text-muted-foreground">60 deterministic payments · Demo Simulation</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}