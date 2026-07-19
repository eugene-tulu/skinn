import { getAddress, type Address } from 'viem'

const ENV_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined
const LS_KEY = 'skinn:contract'

/** Resolve the Skinn contract address: build-time env wins, then user override. */
export function getContractAddress(): Address | null {
  const raw = ENV_ADDRESS || localStorage.getItem(LS_KEY) || ''
  try {
    return raw ? getAddress(raw) : null
  } catch {
    return null
  }
}

export function setContractAddress(raw: string): Address | null {
  try {
    const addr = getAddress(raw)
    localStorage.setItem(LS_KEY, addr)
    return addr
  } catch {
    return null
  }
}

export function hasEnvAddress(): boolean {
  return Boolean(ENV_ADDRESS)
}
