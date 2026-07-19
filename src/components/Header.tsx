import { Link, NavLink } from 'react-router'
import { ConnectButton } from './ConnectButton'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'pools' },
  { to: '/create', label: 'stake up' },
  { to: '/me', label: 'my skinn' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-2 border-ink">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2 select-none">
          <span className="font-display text-3xl tracking-tight leading-none">
            skinn<span className="text-flame">.</span>
          </span>
          <span className="hidden md:inline text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            stake on your word
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive ? 'bg-ink text-cream' : 'hover:bg-secondary',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <ConnectButton />
      </div>
    </header>
  )
}
