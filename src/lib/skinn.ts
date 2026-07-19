import { formatEther, type Address, type Hex } from 'viem'

export const POOL_TYPES = ['event', 'bet', 'habit'] as const
export const STATUSES = ['open', 'settled', 'cancelled', 'forfeited'] as const

export type Pool = {
  ptype: number
  status: number
  creator: Address
  counter: Address
  stake: bigint
  deadline: number
  createdAt: number
  codeHash: Hex
  totalCheckIns: number
  doneCheckIns: number
  lastCheckInAt: number
  joinedCount: number
  checkedInCount: number
  pot: bigint
  winner: Address
  title: string
}

export const HABIT_MIN = 20 * 3600
export const HABIT_MAX = 28 * 3600

export function fmtMon(value: bigint, digits = 4): string {
  const n = Number(formatEther(value))
  if (n === 0) return '0'
  if (n < 0.0001) return '<0.0001'
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function fmtCountdown(secs: number): string {
  if (secs <= 0) return '0s'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

/** Deterministic ink color from an address for identi-dots. */
export function addrHue(addr: string): number {
  let h = 0
  for (let i = 2; i < 10; i++) h = (h * 16 + parseInt(addr[i], 16)) % 360
  return h
}

// ---- local storage: the host's plaintext check-in codes (never onchain) ----

const codeKey = (poolId: number, who: string) => `skinn:code:${poolId}:${who.toLowerCase()}`

export function saveEventCode(poolId: number, who: string, code: string) {
  localStorage.setItem(codeKey(poolId, who), code)
}

export function loadEventCode(poolId: number, who: string): string | null {
  return localStorage.getItem(codeKey(poolId, who))
}

/** Random 6-char check-in code, unambiguous alphabet. */
export function genCode(): string {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => abc[b % abc.length]).join('')
}
