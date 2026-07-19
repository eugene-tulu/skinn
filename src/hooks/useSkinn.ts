import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { SKINN_ABI } from '@/lib/abi'
import { getContractAddress } from '@/lib/config'
import { ACTIVE_CHAIN } from '@/lib/monad'
import type { Pool } from '@/lib/skinn'

export function useContractAddress() {
  const [addr, setAddr] = useState(getContractAddress())
  return {
    address: addr,
    refresh: () => setAddr(getContractAddress()),
  }
}

/** Ticking unix-seconds clock for countdowns. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const contract = (address: `0x${string}`) =>
  ({ address, abi: SKINN_ABI, chainId: ACTIVE_CHAIN.id }) as const

export function useStats(contractAddr: `0x${string}` | null) {
  const res = useReadContracts({
    contracts: contractAddr
      ? [
          { ...contract(contractAddr), functionName: 'poolCount' },
          { ...contract(contractAddr), functionName: 'totalStakedEver' },
          { ...contract(contractAddr), functionName: 'totalSettledEver' },
        ]
      : [],
    query: { refetchInterval: 12_000, enabled: !!contractAddr },
  })
  const [poolCount, staked, settled] = res.data ?? []
  return {
    poolCount: poolCount?.result !== undefined ? Number(poolCount.result) : null,
    totalStaked: (staked?.result as bigint | undefined) ?? null,
    totalSettled: (settled?.result as bigint | undefined) ?? null,
    isLoading: res.isLoading,
  }
}

/** Fetch the latest `limit` pools, newest first. */
export function usePools(contractAddr: `0x${string}` | null, limit = 30) {
  const { poolCount } = useStats(contractAddr)

  const ids: number[] = []
  if (poolCount !== null) {
    const start = Math.max(0, poolCount - limit)
    for (let i = poolCount - 1; i >= start; i--) ids.push(i)
  }

  const res = useReadContracts({
    contracts:
      contractAddr && ids.length > 0
        ? ids.map((id) => ({ ...contract(contractAddr), functionName: 'pools', args: [BigInt(id)] }))
        : [],
    query: { refetchInterval: 12_000, enabled: !!contractAddr && ids.length > 0 },
  })

  const pools: { id: number; pool: Pool }[] = []
  if (res.data) {
    res.data.forEach((r, i) => {
      if (r.status === 'success' && r.result) {
        pools.push({ id: ids[i], pool: r.result as unknown as Pool })
      }
    })
  }
  return { pools, poolCount, isLoading: res.isLoading || poolCount === null }
}

export function usePool(contractAddr: `0x${string}` | null, id: number) {
  const { address: me } = useAccount()

  const poolRes = useReadContract({
    ...contract(contractAddr ?? '0x0000000000000000000000000000000000000000'),
    functionName: 'pools',
    args: [BigInt(id)],
    query: { enabled: !!contractAddr, refetchInterval: 10_000 },
  })

  const participantsRes = useReadContract({
    ...contract(contractAddr ?? '0x0000000000000000000000000000000000000000'),
    functionName: 'getParticipants',
    args: [BigInt(id)],
    query: { enabled: !!contractAddr, refetchInterval: 10_000 },
  })

  const participants = (participantsRes.data as `0x${string}`[] | undefined) ?? []

  const statusRes = useReadContracts({
    contracts:
      contractAddr && participants.length > 0
        ? participants.flatMap((p) => [
            { ...contract(contractAddr), functionName: 'checkedIn', args: [BigInt(id), p] },
          ])
        : [],
    query: { enabled: !!contractAddr && participants.length > 0, refetchInterval: 10_000 },
  })

  const checked: Record<string, boolean> = {}
  if (statusRes.data) {
    statusRes.data.forEach((r, i) => {
      if (r.status === 'success') checked[participants[i].toLowerCase()] = Boolean(r.result)
    })
  }

  const meRes = useReadContracts({
    contracts:
      contractAddr && me
        ? [
            { ...contract(contractAddr), functionName: 'joined', args: [BigInt(id), me] },
            { ...contract(contractAddr), functionName: 'checkedIn', args: [BigInt(id), me] },
            { ...contract(contractAddr), functionName: 'claimable', args: [me] },
          ]
        : [],
    query: { enabled: !!contractAddr && !!me, refetchInterval: 10_000 },
  })

  const pool = poolRes.data as unknown as Pool | undefined
  return {
    pool: pool && pool.createdAt !== 0 ? pool : undefined,
    participants,
    checked,
    iJoined: Boolean(meRes.data?.[0]?.result),
    iCheckedIn: Boolean(meRes.data?.[1]?.result),
    myClaimable: (meRes.data?.[2]?.result as bigint | undefined) ?? 0n,
    isLoading: poolRes.isLoading,
    refetch: () => {
      poolRes.refetch(); participantsRes.refetch(); statusRes.refetch(); meRes.refetch()
    },
  }
}

export function useClaimable(contractAddr: `0x${string}` | null) {
  const { address: me } = useAccount()
  const res = useReadContract({
    ...contract(contractAddr ?? '0x0000000000000000000000000000000000000000'),
    functionName: 'claimable',
    args: me ? [me] : undefined,
    query: { enabled: !!contractAddr && !!me, refetchInterval: 10_000 },
  })
  return (res.data as bigint | undefined) ?? 0n
}
