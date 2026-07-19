import { Link } from 'react-router'
import { Users, Timer, Flame } from 'lucide-react'
import type { Pool } from '@/lib/skinn'
import { fmtMon, HABIT_MAX } from '@/lib/skinn'
import { Countdown, StatusPill, TypePill } from './Bits'
import { useNow } from '@/hooks/useSkinn'

export function PoolCard({ id, pool }: { id: number; pool: Pool }) {
  const now = useNow(5000)
  const open = pool.status === 0

  return (
    <Link to={`/pool/${id}`} className="block group">
      <div className="card-brut card-brut-hover p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypePill ptype={pool.ptype} />
            <StatusPill status={pool.status} />
          </div>
          <span className="font-mono text-xs text-muted-foreground">#{id}</span>
        </div>

        <h3 className="font-display text-xl leading-tight text-balance group-hover:text-flame transition-colors line-clamp-2">
          {pool.title}
        </h3>

        <div className="mt-auto pt-2 flex items-end justify-between border-t-2 border-dashed border-ink/20">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {pool.ptype === 2 ? 'staked' : 'pot'}
            </div>
            <div className="font-display text-2xl">
              {fmtMon(pool.pot)} <span className="text-sm text-flame">MON</span>
            </div>
          </div>
          <div className="text-right text-xs font-semibold space-y-1">
            {pool.ptype !== 2 && (
              <div className="flex items-center gap-1 justify-end text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {pool.checkedInCount > 0 ? `${pool.checkedInCount}/` : ''}{pool.joinedCount}
                {pool.ptype === 0 && pool.checkedInCount > 0 ? ' in' : ' staked'}
              </div>
            )}
            {open && pool.ptype === 0 && (
              <div className="flex items-center gap-1 justify-end text-flame">
                <Timer className="w-3.5 h-3.5" />
                <Countdown to={pool.deadline} done="settling" />
              </div>
            )}
            {open && pool.ptype === 1 && (
              <div className="flex items-center gap-1 justify-end text-flame">
                <Timer className="w-3.5 h-3.5" />
                <Countdown to={pool.deadline} done="expired" />
              </div>
            )}
            {open && pool.ptype === 2 && (
              <div className="flex items-center gap-1 justify-end text-moss">
                <Flame className="w-3.5 h-3.5" />
                {pool.doneCheckIns}/{pool.totalCheckIns} days
                {now > pool.lastCheckInAt + HABIT_MAX && ' · missed'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
