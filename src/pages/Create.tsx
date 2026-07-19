import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAccount, useChainId } from 'wagmi'
import { isAddress, keccak256, parseEther, stringToBytes } from 'viem'
import { CalendarCheck, Swords, Repeat, RefreshCw, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useContractAddress, useStats } from '@/hooks/useSkinn'
import { useTx } from '@/hooks/useTx'
import { TxButton } from '@/components/Bits'
import { SetupGate } from '@/components/SetupGate'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACTIVE_CHAIN } from '@/lib/monad'
import { genCode, saveEventCode } from '@/lib/skinn'
import { cn } from '@/lib/utils'

type Mode = 'event' | 'bet' | 'habit'

const MODE_META: Record<Mode, { icon: typeof CalendarCheck; name: string; blurb: string }> = {
  event: {
    icon: CalendarCheck,
    name: 'event rsvp',
    blurb: 'everyone stakes to RSVP. you get a secret code — reveal it at the venue. attendees split the flakers’ stakes.',
  },
  bet: {
    icon: Swords,
    name: 'a bet',
    blurb: 'you and a friend (or five) stake on an outcome. a mutually-picked arbiter calls the winner, who sweeps the pot.',
  },
  habit: {
    icon: Repeat,
    name: 'a habit',
    blurb: 'stake on a daily streak — gym, run, no doomscrolling. check in once a day. miss one, your buddy takes the pot.',
  },
}

export function Create() {
  const { address: contractAddr } = useContractAddress()
  const { address: me } = useAccount()
  const chainId = useChainId()
  const navigate = useNavigate()
  const { send, busy } = useTx()
  const { poolCount } = useStats(contractAddr)

  const [mode, setMode] = useState<Mode>('event')
  const [title, setTitle] = useState('')
  const [stake, setStake] = useState('0.05')
  const [when, setWhen] = useState('')
  const [code, setCode] = useState(genCode())
  const [counter, setCounter] = useState('')
  const [days, setDays] = useState('7')
  const [copied, setCopied] = useState(false)

  const stakeWei = useMemo(() => {
    try { return parseEther(stake || '0') } catch { return 0n }
  }, [stake])

  const deadline = when ? Math.floor(new Date(when).getTime() / 1000) : 0
  const nowSec = Math.floor(Date.now() / 1000)

  const problems: string[] = []
  if (!me) problems.push('connect your wallet first')
  else if (chainId !== ACTIVE_CHAIN.id) problems.push(`switch to ${ACTIVE_CHAIN.name.toLowerCase()}`)
  if (title.trim().length < 3) problems.push('give it a title (3+ chars)')
  if (stakeWei <= 0n) problems.push('stake must be more than 0')
  if (mode !== 'habit' && deadline <= nowSec) problems.push('pick a time in the future')
  if (mode !== 'event' && !isAddress(counter)) problems.push(mode === 'bet' ? 'paste the arbiter’s address' : 'paste your accountability buddy’s address')
  if (mode !== 'event' && isAddress(counter) && me && counter.toLowerCase() === me.toLowerCase()) problems.push('that can’t be your own address')
  if (mode === 'event' && code.trim().length < 4) problems.push('code needs 4+ characters')
  if (mode === 'habit') {
    const d = Number(days)
    if (!Number.isInteger(d) || d < 2 || d > 90) problems.push('streak must be 2–90 days')
  }

  const submit = async () => {
    if (!contractAddr || !me || problems.length > 0 || poolCount === null) return
    const newId = poolCount
    let ok = false
    if (mode === 'event') {
      const hash = keccak256(stringToBytes(code.trim()))
      ok = await send({
        contract: contractAddr,
        functionName: 'createEvent',
        args: [title.trim(), deadline, hash],
        value: stakeWei,
        success: 'event staked. share the link, reveal the code at the venue.',
      })
      if (ok) saveEventCode(newId, me, code.trim())
    } else if (mode === 'bet') {
      ok = await send({
        contract: contractAddr,
        functionName: 'createBet',
        args: [title.trim(), counter, deadline],
        value: stakeWei,
        success: 'bet is live. now wait for a taker.',
      })
    } else {
      ok = await send({
        contract: contractAddr,
        functionName: 'createHabit',
        args: [title.trim(), Number(days), counter],
        value: stakeWei,
        success: 'habit armed. first check-in window opens in 20h.',
      })
    }
    if (ok) navigate(`/pool/${newId}`)
  }

  if (!contractAddr) return <SetupGate onReady={() => window.location.reload()} />

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl mb-2">stake up</h1>
      <p className="text-muted-foreground font-medium mb-8">pick your poison. the stake locks in the contract — no takesies-backsies.</p>

      {/* mode picker */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const M = MODE_META[m]
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'text-left p-4 rounded-xl border-2 border-ink transition-all',
                mode === m ? 'bg-ink text-cream shadow-hard' : 'bg-cream shadow-hard-sm hover:bg-secondary',
              )}
            >
              <M.icon className={cn('w-5 h-5 mb-2', mode === m && 'text-flame')} />
              <div className="font-display text-lg leading-tight">{M.name}</div>
            </button>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-8 border-l-4 border-flame pl-3">
        {MODE_META[mode].blurb}
      </p>

      <div className="card-brut p-6 space-y-5">
        <div>
          <Label className="font-bold text-xs uppercase tracking-widest">
            {mode === 'bet' ? 'the bet (terms)' : mode === 'habit' ? 'the habit' : 'the event'}
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
            placeholder={
              mode === 'bet' ? '“i can beat you at chess, loser buys dinner”'
              : mode === 'habit' ? '“gym every morning, 6am”'
              : '“omakase friday 8pm — 6 seats”'
            }
            className="mt-1.5 border-2 border-ink bg-paper font-medium"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label className="font-bold text-xs uppercase tracking-widest">
              {mode === 'habit' ? 'total stake (MON)' : 'stake per person (MON)'}
            </Label>
            <Input
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              type="number" min="0" step="0.01"
              className="mt-1.5 border-2 border-ink bg-paper font-mono"
            />
          </div>

          {mode !== 'habit' && (
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest">
                {mode === 'event' ? 'check-in cutoff (event start)' : 'decision deadline'}
              </Label>
              <Input
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                type="datetime-local"
                className="mt-1.5 border-2 border-ink bg-paper font-mono"
              />
            </div>
          )}

          {mode === 'habit' && (
            <div>
              <Label className="font-bold text-xs uppercase tracking-widest">streak length (days)</Label>
              <Input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                type="number" min="2" max="90" step="1"
                className="mt-1.5 border-2 border-ink bg-paper font-mono"
              />
            </div>
          )}
        </div>

        {mode === 'event' && (
          <div>
            <Label className="font-bold text-xs uppercase tracking-widest">secret check-in code</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="border-2 border-ink bg-paper font-mono text-lg tracking-[0.3em] font-bold"
              />
              <TxButton variant="outline" onClick={() => setCode(genCode())} className="px-3">
                <RefreshCw className="w-4 h-4" />
              </TxButton>
              <TxButton
                variant="outline"
                className="px-3"
                onClick={() => {
                  navigator.clipboard.writeText(code)
                  setCopied(true)
                  toast.success('code copied')
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </TxButton>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-2">
              only the code’s hash goes onchain. memorize it or save it — you’ll say it out loud at the venue,
              and that’s the only way anyone can check in.
            </p>
          </div>
        )}

        {mode !== 'event' && (
          <div>
            <Label className="font-bold text-xs uppercase tracking-widest">
              {mode === 'bet' ? 'arbiter address (calls the winner)' : 'accountability buddy (gets paid if you flake)'}
            </Label>
            <Input
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              placeholder="0x…"
              className="mt-1.5 border-2 border-ink bg-paper font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground font-medium mt-2">
              {mode === 'bet'
                ? 'pick someone both sides trust. they can’t join the bet, and if they ghost past the deadline everyone gets refunded.'
                : 'choose someone who will enjoy taking your money a little too much. that’s the incentive.'}
            </p>
          </div>
        )}

        <div className="pt-2 border-t-2 border-dashed border-ink/20">
          <TxButton onClick={submit} busy={busy} disabled={problems.length > 0} className="w-full py-6 text-lg">
            stake {stake || '0'} MON & create pool
          </TxButton>
          {problems.length > 0 && (
            <p className="text-xs font-semibold text-destructive mt-2 text-center">{problems[0]}</p>
          )}
        </div>
      </div>
    </div>
  )
}
