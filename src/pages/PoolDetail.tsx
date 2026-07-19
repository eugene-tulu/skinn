import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { Check, Copy, Eye, KeyRound, PartyPopper, Skull, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useContractAddress, usePool, useNow } from '@/hooks/useSkinn'
import { useTx } from '@/hooks/useTx'
import { AddrChip, Countdown, Pill, StatusPill, TxButton, TypePill } from '@/components/Bits'
import { SetupGate } from '@/components/SetupGate'
import { Input } from '@/components/ui/input'
import { fmtDate, fmtMon, loadEventCode, HABIT_MIN, HABIT_MAX } from '@/lib/skinn'
import { EXPLORER } from '@/lib/monad'
import { cn } from '@/lib/utils'

export function PoolDetail() {
  const { id: idStr } = useParams()
  const id = Number(idStr)
  const { address: contractAddr } = useContractAddress()
  const { address: me } = useAccount()
  const validId = Number.isFinite(id) && id >= 0
  const { pool, participants, checked, iJoined, iCheckedIn, myClaimable, isLoading, refetch } =
    usePool(contractAddr, validId ? id : 0)
  const { send, busy } = useTx()
  const now = useNow()
  const [code, setCode] = useState('')
  const [winner, setWinner] = useState('')
  const [copied, setCopied] = useState(false)

  if (!contractAddr) return <SetupGate onReady={() => window.location.reload()} />

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16"><div className="card-brut h-64 animate-pulse bg-secondary/50" /></div>
  }
  if (!pool || !validId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="font-display text-3xl mb-3">pool #{idStr} doesn’t exist</p>
        <Link to="/" className="text-flame font-bold underline">back to pools</Link>
      </div>
    )
  }

  const isCreator = me?.toLowerCase() === pool.creator.toLowerCase()
  const isCounter = me?.toLowerCase() === pool.counter.toLowerCase()
  const open = pool.status === 0
  const myCode = me ? loadEventCode(id, me) : null
  const opensAt = pool.lastCheckInAt + HABIT_MIN
  const closesAt = pool.lastCheckInAt + HABIT_MAX
  const habitWindowOpen = now >= opensAt && now <= closesAt
  const habitMissed = now > closesAt

  const act = async (functionName: string, args: readonly unknown[], value: bigint | undefined, success: string) => {
    const ok = await send({ contract: contractAddr, functionName, args, value, success })
    if (ok) setTimeout(refetch, 1200)
  }

  const share = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('link copied — send it to the group chat')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-flame">
        ← all pools
      </Link>

      {/* head */}
      <div className="card-brut p-6 md:p-8 mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <TypePill ptype={pool.ptype} />
          <StatusPill status={pool.status} />
          <span className="font-mono text-xs text-muted-foreground ml-auto">pool #{id}</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl leading-tight text-balance">{pool.title}</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">pot</div>
            <div className="font-display text-3xl">{fmtMon(pool.pot)} <span className="text-base text-flame">MON</span></div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {pool.ptype === 2 ? 'staked' : 'stake / person'}
            </div>
            <div className="font-display text-3xl">{fmtMon(pool.stake)} <span className="text-base text-flame">MON</span></div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {pool.ptype === 2 ? 'streak' : 'stakers'}
            </div>
            <div className="font-display text-3xl">
              {pool.ptype === 2 ? `${pool.doneCheckIns}/${pool.totalCheckIns}` : pool.joinedCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {pool.ptype === 0 ? 'check-in cutoff' : pool.ptype === 1 ? 'decision by' : 'status'}
            </div>
            <div className="font-semibold text-sm mt-2">
              {pool.ptype === 2
                ? (open ? (habitMissed ? 'window missed' : habitWindowOpen ? 'window OPEN' : 'waiting') : pool.status === 1 ? 'completed' : 'failed')
                : fmtDate(pool.deadline)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t-2 border-dashed border-ink/20 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground font-medium">
            host: <AddrChip addr={pool.creator} you={isCreator} />
          </span>
          {pool.ptype === 1 && (
            <span className="flex items-center gap-2 text-muted-foreground font-medium">
              arbiter: <AddrChip addr={pool.counter} you={isCounter} />
            </span>
          )}
          {pool.ptype === 2 && (
            <span className="flex items-center gap-2 text-muted-foreground font-medium">
              accountability buddy: <AddrChip addr={pool.counter} you={isCounter} />
            </span>
          )}
          <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-flame hover:underline">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} share pool
          </button>
        </div>
      </div>

      {/* outcome banners */}
      {pool.status === 1 && (
        <div className="card-brut p-6 mt-4 bg-moss/10 border-moss flex items-center gap-4">
          <PartyPopper className="w-8 h-8 text-moss shrink-0" />
          <div>
            <div className="font-display text-2xl text-moss">
              {pool.ptype === 1 && pool.winner !== '0x0000000000000000000000000000000000000000'
                ? 'winner takes the pot'
                : pool.ptype === 2 ? 'streak completed — stake returned' : 'settled — attendees got paid'}
            </div>
            {pool.ptype === 1 && pool.winner !== '0x0000000000000000000000000000000000000000' && (
              <div className="mt-1"><AddrChip addr={pool.winner} you={me?.toLowerCase() === pool.winner.toLowerCase()} /></div>
            )}
          </div>
        </div>
      )}
      {pool.status === 3 && (
        <div className="card-brut p-6 mt-4 bg-flame/10 flex items-center gap-4">
          <Skull className="w-8 h-8 text-flame shrink-0" />
          <div>
            <div className="font-display text-2xl text-flame">forfeited</div>
            <p className="text-sm font-medium text-muted-foreground">
              the streak broke. the accountability buddy walks away with {fmtMon(pool.pot)} MON.
            </p>
          </div>
        </div>
      )}
      {pool.status === 2 && (
        <div className="card-brut p-6 mt-4 bg-secondary">
          <div className="font-display text-2xl text-muted-foreground">cancelled — everyone refunded</div>
        </div>
      )}

      {/* actions */}
      {open && me && (
        <div className="card-brut p-6 md:p-8 mt-4">
          <h2 className="font-display text-2xl mb-4">your move</h2>
          <div className="space-y-4">

            {/* JOIN */}
            {pool.ptype !== 2 && !iJoined && now < pool.deadline && !(pool.ptype === 1 && isCounter) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground text-sm max-w-sm">
                  {pool.ptype === 0
                    ? 'stake to RSVP. show up, get it back — plus a cut of whoever flakes.'
                    : 'match the stake to take this bet. arbiter picks one winner.'}
                </p>
                <TxButton onClick={() => act('join', [BigInt(id)], pool.stake, 'you’re in. don’t flake.')} busy={busy}>
                  stake {fmtMon(pool.stake)} MON & join
                </TxButton>
              </div>
            )}

            {/* EVENT check-in */}
            {pool.ptype === 0 && iJoined && !iCheckedIn && now < pool.deadline && (
              <div className="rounded-xl border-2 border-dashed border-ink/30 p-4">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <KeyRound className="w-4 h-4 text-flame" /> check in
                  <span className="text-xs font-semibold text-muted-foreground ml-auto">
                    cutoff <Countdown to={pool.deadline} prefix="in " done="passed" />
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="code the host reveals"
                    className="border-2 border-ink bg-paper font-mono tracking-[0.25em] font-bold"
                  />
                  <TxButton
                    variant="moss"
                    busy={busy}
                    disabled={code.trim().length < 4}
                    onClick={() => act('checkIn', [BigInt(id), code.trim()], undefined, 'checked in. flake-proof.')}
                  >
                    i’m here
                  </TxButton>
                </div>
              </div>
            )}

            {pool.ptype === 0 && iCheckedIn && pool.status === 0 && (
              <div className="rounded-xl bg-moss/10 border-2 border-moss p-4 font-semibold text-moss flex items-center gap-2">
                <Check className="w-5 h-5" /> you’re checked in. settle happens after the cutoff.
              </div>
            )}

            {/* host code reveal */}
            {pool.ptype === 0 && isCreator && (
              <div className="rounded-xl bg-gold/20 border-2 border-ink p-4">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Eye className="w-4 h-4" /> your check-in code
                </div>
                {myCode ? (
                  <>
                    <div className="font-mono text-2xl font-bold tracking-[0.4em] my-1">{myCode}</div>
                    <p className="text-xs font-medium text-muted-foreground">
                      say this out loud at the venue. never before — anyone with the code can check in from their couch.
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground">
                    this pool wasn’t created on this device, so the code isn’t stored here. it’s whatever you set at creation — only its hash is onchain.
                  </p>
                )}
              </div>
            )}

            {/* EVENT settle */}
            {pool.ptype === 0 && now >= pool.deadline && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground text-sm max-w-sm">
                  cutoff passed. {pool.checkedInCount} of {pool.joinedCount} showed. anyone can trigger settlement —
                  attendees split the whole pot.
                </p>
                <TxButton onClick={() => act('settle', [BigInt(id)], undefined, 'settled. money moved.')} busy={busy}>
                  settle the pool
                </TxButton>
              </div>
            )}

            {/* BET arbiter */}
            {pool.ptype === 1 && isCounter && pool.joinedCount >= 2 && now < pool.deadline && (
              <div>
                <p className="font-medium text-muted-foreground text-sm mb-3">
                  you’re the arbiter. pick the winner — they take the whole {fmtMon(pool.pot)} MON pot.
                </p>
                <div className="flex gap-2">
                  <select
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    className="flex-1 h-10 rounded-md border-2 border-ink bg-paper px-3 font-mono text-sm"
                  >
                    <option value="">select winner…</option>
                    {participants.map((p) => (
                      <option key={p} value={p}>{p.slice(0, 10)}…{p.slice(-6)}</option>
                    ))}
                  </select>
                  <TxButton
                    variant="ink"
                    busy={busy}
                    disabled={!isAddress(winner)}
                    onClick={() => act('declareWinner', [BigInt(id), winner], undefined, 'winner declared. pot assigned.')}
                  >
                    <Trophy className="w-4 h-4 mr-2" /> declare
                  </TxButton>
                </div>
              </div>
            )}

            {pool.ptype === 1 && isCounter && pool.joinedCount < 2 && (
              <p className="font-medium text-muted-foreground text-sm">you’re the arbiter — waiting for someone to take the bet.</p>
            )}

            {/* BET expired */}
            {pool.ptype === 1 && now >= pool.deadline && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground text-sm max-w-sm">
                  the arbiter didn’t call it in time. trigger expiry and everyone gets their stake back.
                </p>
                <TxButton variant="outline" onClick={() => act('settleExpiredBet', [BigInt(id)], undefined, 'bet expired — stakes refunded.')} busy={busy}>
                  refund everyone
                </TxButton>
              </div>
            )}

            {/* HABIT actions */}
            {pool.ptype === 2 && isCreator && (
              <div>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {Array.from({ length: pool.totalCheckIns }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-7 h-7 rounded-lg border-2 border-ink flex items-center justify-center text-xs font-bold',
                        i < pool.doneCheckIns ? 'bg-moss text-cream' : 'bg-cream',
                      )}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
                {habitWindowOpen ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-moss text-sm">
                      window is OPEN — closes <Countdown to={closesAt} prefix="in " done="now" />
                    </p>
                    <TxButton variant="moss" busy={busy} onClick={() => act('habitCheckIn', [BigInt(id)], undefined, `day ${pool.doneCheckIns + 1} banked.`)}>
                      check in for day {pool.doneCheckIns + 1}
                    </TxButton>
                  </div>
                ) : habitMissed ? (
                  <p className="font-semibold text-flame text-sm">
                    you missed the window. your buddy can now claim the {fmtMon(pool.pot)} MON. brutal.
                  </p>
                ) : (
                  <p className="font-medium text-muted-foreground text-sm">
                    next check-in window opens <Countdown to={opensAt} prefix="in " done="soon" /> —
                    you’ll have 8 hours, then the money is your buddy’s.
                  </p>
                )}
              </div>
            )}

            {/* HABIT beneficiary forfeit claim */}
            {pool.ptype === 2 && isCounter && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground text-sm max-w-sm">
                  {habitMissed
                    ? 'they missed the window. the pot is yours for the taking.'
                    : 'you’re the accountability buddy. if they miss a day, come back and claim the pot.'}
                </p>
                {habitMissed && (
                  <TxButton onClick={() => act('claimForfeit', [BigInt(id)], undefined, 'forfeit claimed. accountability pays.')} busy={busy}>
                    claim {fmtMon(pool.pot)} MON
                  </TxButton>
                )}
              </div>
            )}

            {/* CANCEL */}
            {isCreator && (
              (pool.ptype === 0 && pool.checkedInCount === 0 && now < pool.deadline) ||
              (pool.ptype === 1 && pool.joinedCount === 1) ||
              (pool.ptype === 2 && pool.doneCheckIns === 0)
            ) && (
              <div className="pt-3 border-t-2 border-dashed border-ink/20">
                <button
                  disabled={busy}
                  onClick={() => act('cancel', [BigInt(id)], undefined, 'pool cancelled, stakes refunded.')}
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  cancel pool & refund everyone
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {open && !me && (
        <div className="card-brut p-6 mt-4 text-center text-muted-foreground font-medium">
          connect your wallet to join, check in, or settle.
        </div>
      )}

      {/* withdraw */}
      {me && myClaimable > 0n && (
        <div className="card-brut p-6 mt-4 bg-gold/20 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">waiting for you</div>
            <div className="font-display text-3xl">{fmtMon(myClaimable)} <span className="text-base text-flame">MON</span></div>
          </div>
          <TxButton variant="moss" busy={busy} onClick={() => act('withdraw', [], undefined, 'withdrawn. go you.')}>
            withdraw
          </TxButton>
        </div>
      )}

      {/* participants */}
      {pool.ptype !== 2 && participants.length > 0 && (
        <div className="card-brut p-6 mt-4">
          <h2 className="font-display text-2xl mb-4">who’s in</h2>
          <div className="space-y-2.5">
            {participants.map((p) => (
              <div key={p} className="flex items-center justify-between gap-3">
                <AddrChip addr={p} you={me?.toLowerCase() === p.toLowerCase()} />
                <div className="flex items-center gap-2">
                  {pool.ptype === 0 && (
                    checked[p.toLowerCase()]
                      ? <Pill tone="moss">showed</Pill>
                      : <Pill tone={pool.status === 0 ? 'muted' : 'flame'}>{pool.status === 0 ? 'pending' : 'flaked'}</Pill>
                  )}
                  {pool.ptype === 1 && pool.status === 1 && pool.winner.toLowerCase() === p.toLowerCase() && (
                    <Pill tone="moss"><Trophy className="w-3 h-3" /> winner</Pill>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground font-medium mt-8">
        every number on this page is read from the{' '}
        <a className="underline hover:text-flame" href={`${EXPLORER}/address/${contractAddr}`} target="_blank" rel="noreferrer">
          skinn contract
        </a>{' '}
        — nothing here is a database.
      </p>
    </div>
  )
}
