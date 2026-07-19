import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addrHue, fmtCountdown, shortAddr } from '@/lib/skinn'
import { useNow } from '@/hooks/useSkinn'
import { cn } from '@/lib/utils'

export function TxButton({
  onClick, disabled, busy, children, variant = 'flame', className,
}: {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  children: ReactNode
  variant?: 'flame' | 'ink' | 'outline' | 'moss'
  className?: string
}) {
  const styles: Record<string, string> = {
    flame: 'bg-flame text-cream hover:bg-flame/90',
    ink: 'bg-ink text-cream hover:bg-ink/90',
    moss: 'bg-moss text-cream hover:bg-moss/90',
    outline: 'bg-cream text-ink hover:bg-secondary',
  }
  return (
    <Button
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'border-2 border-ink shadow-hard-sm font-semibold active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all',
        styles[variant],
        className,
      )}
    >
      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}

export function Pill({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'flame' | 'moss' | 'muted' | 'gold' }) {
  const tones: Record<string, string> = {
    ink: 'bg-ink text-cream',
    flame: 'bg-flame text-cream',
    moss: 'bg-moss text-cream',
    gold: 'bg-gold text-ink',
    muted: 'bg-secondary text-muted-foreground',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 border-ink text-[11px] font-bold uppercase tracking-wider', tones[tone])}>
      {children}
    </span>
  )
}

export function TypePill({ ptype }: { ptype: number }) {
  if (ptype === 0) return <Pill tone="flame">event</Pill>
  if (ptype === 1) return <Pill tone="ink">bet</Pill>
  return <Pill tone="moss">habit</Pill>
}

export function StatusPill({ status }: { status: number }) {
  if (status === 0) return <Pill tone="gold">open</Pill>
  if (status === 1) return <Pill tone="moss">settled</Pill>
  if (status === 2) return <Pill tone="muted">cancelled</Pill>
  return <Pill tone="flame">forfeited</Pill>
}

export function IdentiDot({ addr, size = 28 }: { addr: string; size?: number }) {
  const h = addrHue(addr)
  return (
    <span
      title={addr}
      className="inline-block rounded-full border-2 border-ink shrink-0"
      style={{
        width: size, height: size,
        background: `conic-gradient(from 40deg, hsl(${h} 70% 45%), hsl(${(h + 90) % 360} 80% 60%), hsl(${h} 70% 45%))`,
      }}
    />
  )
}

export function AddrChip({ addr, you }: { addr: string; you?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      <IdentiDot addr={addr} size={18} />
      {shortAddr(addr)}
      {you && <span className="font-body font-bold text-flame">(you)</span>}
    </span>
  )
}

/** Live countdown to a unix timestamp. Renders prefix + remaining, or `done` when passed. */
export function Countdown({ to, prefix = '', done = 'now' }: { to: number; prefix?: string; done?: string }) {
  const now = useNow()
  const left = to - now
  if (left <= 0) return <span>{done}</span>
  return (
    <span className="tabular-nums">
      {prefix}{fmtCountdown(left)}
    </span>
  )
}
