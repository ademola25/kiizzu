import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FileText, Bell, Settings } from 'lucide-react'
import { UserMenu } from './UserMenu'

const navItems = [
  { to: '/dashboard',     icon: Home,     label: 'Dashboard' },
  { to: '/documents',     icon: FileText, label: 'Documents' },
  { to: '/notifications', icon: Bell,     label: 'Notifications' },
  { to: '/settings',      icon: Settings, label: 'Settings' },
]

function pageTitle(pathname: string) {
  return navItems.find((n) => pathname.startsWith(n.to))?.label ?? ''
}

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-neutral-200/70 bg-white/60 backdrop-blur-sm">
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-500 grid place-items-center text-white font-bold text-sm shadow-[0_4px_12px_-2px_rgba(34,197,94,0.5)]">
              A
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight leading-none">Ark</div>
              <div className="text-[11px] text-neutral-500 mt-1 leading-none">Never miss a cheque</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-neutral-950 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 pb-6 pt-4">
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Made for Dubai tenants who pay rent in post-dated cheques.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 lg:px-12 h-16 bg-white/70 backdrop-blur-md border-b border-neutral-200/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500 grid place-items-center text-white font-bold text-sm">A</div>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm text-neutral-500">
                {pageTitle(location.pathname)}
              </span>
            </div>
          </div>

          <UserMenu />
        </header>

        {/* Content */}
        <main className="flex-1 px-6 lg:px-12 py-8 lg:py-12 pb-24 lg:pb-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex bg-white/95 backdrop-blur-md border-t border-neutral-200/70 z-50">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-primary-700' : 'text-neutral-500'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
