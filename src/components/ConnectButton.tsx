import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { ACTIVE_CHAIN, FAUCET_URL } from '@/lib/monad'
import { fmtMon, shortAddr } from '@/lib/skinn'
import { Wallet, LogOut, Droplets } from 'lucide-react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { data: balance } = useBalance({ address, chainId: ACTIVE_CHAIN.id })

  if (isConnected && chainId !== ACTIVE_CHAIN.id) {
    return (
      <Button
        onClick={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
        disabled={switching}
        className="bg-flame text-cream border-2 border-ink shadow-hard-sm hover:bg-flame/90 font-semibold"
      >
        {switching ? 'switching…' : `switch to ${ACTIVE_CHAIN.name.toLowerCase()}`}
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          title="get testnet MON"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-ink bg-cream font-mono text-xs shadow-hard-sm hover:bg-secondary transition-colors"
        >
          <Droplets className="w-3.5 h-3.5 text-flame" />
          {balance ? fmtMon(balance.value, 3) : '0'} MON
        </a>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-ink bg-ink text-cream font-mono text-xs shadow-hard-sm">
          <span className="w-2 h-2 rounded-full bg-moss inline-block" />
          {shortAddr(address)}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => disconnect()}
          title="disconnect"
          className="border-2 border-ink bg-cream shadow-hard-sm hover:bg-secondary"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="bg-ink text-cream border-2 border-ink shadow-hard-sm hover:bg-ink/90 font-semibold"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isPending ? 'connecting…' : 'connect wallet'}
    </Button>
  )
}
