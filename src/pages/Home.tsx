import { Link } from 'react-router'
import { ArrowRight, CalendarCheck, Swords, Repeat, HandCoins } from 'lucide-react'
import { usePools, useStats, useContractAddress } from '@/hooks/useSkinn'
import { PoolCard } from '@/components/PoolCard'
import { fmtMon } from '@/lib/skinn'
import { SetupGate } from '@/components/SetupGate'

const MODES = [
  {
    icon: CalendarCheck,
    name: 'no-flake events',
    desc: 'RSVP with a stake. Host reveals a code at the venue. Show up, split the flakers’ money. Flake, fund the people who didn’t.',
    tone: 'bg-flame text-cream',
  },
  {
    icon: Swords,
    name: 'settle-anything bets',
    desc: '“Bet you can’t quit vaping for a month.” Both sides stake, a friend you both pick calls it. Winner sweeps the pot.',
    tone: 'bg-ink text-cream',
  },
  {
    icon: Repeat,
    name: 'streak-or-pay habits',
    desc: 'Stake on a daily habit. Check in every day. Miss one, and your accountability buddy takes the pot. Ouch. That’s the point.',
    tone: 'bg-moss text-cream',
  },
]

export function Home() {
  const { address: contractAddr } = useContractAddress()
  const { pools, isLoading } = usePools(contractAddr)
  const stats = useStats(contractAddr)

  if (!contractAddr) return <SetupGate onReady={() => window.location.reload()} />

  return (
    <div>
      {/* hero */}
      <section className="border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-ink bg-gold text-xs font-bold uppercase tracking-widest mb-6 shadow-hard-sm">
            <HandCoins className="w-3.5 h-3.5" /> live on monad testnet
          </div>
          <h1 className="font-display text-[13vw] sm:text-7xl md:text-8xl leading-[0.95] text-balance">
            show up.
            <br />
            <span className="text-flame">or pay up.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground font-medium">
            skinn turns promises into pots. Stake MON on an RSVP, a bet, or a daily habit —
            keep your word and get it back, break it and the people you let down split your money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-flame text-cream border-2 border-ink shadow-hard font-bold active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              put some skinn in <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cream border-2 border-ink shadow-hard font-bold hover:bg-secondary transition-colors"
            >
              browse pools
            </a>
          </div>

          {/* live stats */}
          <div className="mt-12 grid grid-cols-3 max-w-lg gap-3">
            {[
              { label: 'pools created', value: stats.poolCount === null ? '—' : String(stats.poolCount) },
              { label: 'MON staked', value: stats.totalStaked === null ? '—' : fmtMon(stats.totalStaked) },
              { label: 'MON settled', value: stats.totalSettled === null ? '—' : fmtMon(stats.totalSettled) },
            ].map((s) => (
              <div key={s.label} className="card-brut p-3 text-center">
                <div className="font-display text-2xl md:text-3xl">{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* modes */}
      <section className="border-b-2 border-ink bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="font-display text-3xl md:text-4xl mb-8">three ways to mean it</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {MODES.map((m) => (
              <div key={m.name} className="card-brut card-brut-hover p-6">
                <div className={`w-11 h-11 rounded-xl border-2 border-ink flex items-center justify-center mb-4 ${m.tone}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl mb-2">{m.name}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* feed */}
      <section id="pools">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl">fresh stakes</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              read straight from the contract
            </span>
          </div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card-brut p-5 h-44 animate-pulse bg-secondary/50" />
              ))}
            </div>
          ) : pools.length === 0 ? (
            <div className="card-brut p-10 text-center">
              <p className="font-display text-2xl mb-2">no pools yet. suspicious.</p>
              <p className="text-muted-foreground font-medium mb-6">be the first to put money behind a promise.</p>
              <Link to="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-flame text-cream border-2 border-ink shadow-hard font-bold">
                create pool #0 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools.map(({ id, pool }) => (
                <PoolCard key={id} id={id} pool={pool} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
