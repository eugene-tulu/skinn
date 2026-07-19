import { useAccount, useReadContracts } from 'wagmi'
import { HandCoins } from 'lucide-react'
import { useContractAddress, usePools, useClaimable } from '@/hooks/useSkinn'
import { useTx } from '@/hooks/useTx'
import { TxButton } from '@/components/Bits'
import { PoolCard } from '@/components/PoolCard'
import { SetupGate } from '@/components/SetupGate'
import { SKINN_ABI } from '@/lib/abi'
import { ACTIVE_CHAIN } from '@/lib/monad'
import { fmtMon, type Pool } from '@/lib/skinn'

export function Me() {
  const { address: contractAddr } = useContractAddress()
  const { address: me, isConnected } = useAccount()
  const claimable = useClaimable(contractAddr)
  const { send, busy } = useTx()
  const { pools, isLoading } = usePools(contractAddr, 50)

  const joinedRes = useReadContracts({
    contracts:
      contractAddr && me && pools.length > 0
        ? pools.map(({ id }) => ({
            address: contractAddr,
            abi: SKINN_ABI,
            chainId: ACTIVE_CHAIN.id,
            functionName: 'joined',
            args: [BigInt(id), me],
          }) as const)
        : [],
    query: { enabled: !!contractAddr && !!me && pools.length > 0, refetchInterval: 12_000 },
  })

  if (!contractAddr) return <SetupGate onReady={() => window.location.reload()} />

  if (!isConnected || !me) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl mb-3">my skinn</h1>
        <p className="text-muted-foreground font-medium">connect your wallet to see your stakes, streaks and payouts.</p>
      </div>
    )
  }

  const myPools: { id: number; pool: Pool; role: 'host' | 'staker' }[] = []
  pools.forEach(({ id, pool }, i) => {
    const isCreator = pool.creator.toLowerCase() === me.toLowerCase()
    const didJoin = isCreator || Boolean(joinedRes.data?.[i]?.result)
    if (didJoin) myPools.push({ id, pool, role: isCreator ? 'host' : 'staker' })
  })

  const active = myPools.filter((p) => p.pool.status === 0)
  const past = myPools.filter((p) => p.pool.status !== 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl mb-8">my skinn</h1>

      {/* payout card */}
      <div className="card-brut p-6 md:p-8 mb-10 flex flex-wrap items-center justify-between gap-4 bg-gold/20">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <HandCoins className="w-4 h-4" /> claimable balance
          </div>
          <div className="font-display text-5xl mt-1">
            {fmtMon(claimable)} <span className="text-xl text-flame">MON</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            winnings and refunds pile up here — pull them whenever.
          </p>
        </div>
        <TxButton
          variant="moss"
          className="px-8 py-6 text-lg"
          busy={busy}
          disabled={claimable === 0n}
          onClick={async () => {
            await send({ contract: contractAddr, functionName: 'withdraw', success: 'withdrawn. treat yourself.' })
          }}
        >
          withdraw
        </TxButton>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="card-brut p-5 h-44 animate-pulse bg-secondary/50" />)}
        </div>
      ) : myPools.length === 0 ? (
        <div className="card-brut p-10 text-center text-muted-foreground font-medium">
          no skinn in the game yet. go make a promise expensive.
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="font-display text-2xl mb-4">live</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {active.map(({ id, pool }) => <PoolCard key={id} id={id} pool={pool} />)}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 className="font-display text-2xl mb-4 text-muted-foreground">history</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
                {past.map(({ id, pool }) => <PoolCard key={id} id={id} pool={pool} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
