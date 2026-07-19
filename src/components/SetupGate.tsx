import { useState } from 'react'
import { setContractAddress } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Terminal } from 'lucide-react'

/** Shown when the app has no contract address configured yet. */
export function SetupGate({ onReady }: { onReady: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const save = () => {
    const addr = setContractAddress(value.trim())
    if (!addr) {
      setError('that doesn’t look like a contract address')
      return
    }
    onReady()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <div className="card-brut p-8">
        <div className="w-11 h-11 rounded-xl border-2 border-ink bg-flame text-cream flex items-center justify-center mb-5">
          <Terminal className="w-5 h-5" />
        </div>
        <h1 className="font-display text-3xl mb-3">one step: point skinn at its contract</h1>
        <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
          this build doesn’t have a contract address baked in yet. deploy the staking contract to monad testnet
          (one command), then paste the address here.
        </p>
        <div className="rounded-xl border-2 border-ink bg-ink text-cream font-mono text-xs p-4 mb-6 overflow-x-auto">
          <div className="text-cream/50"># from the contracts/ folder</div>
          <div>PRIVATE_KEY=0xyourkey node deploy.mjs</div>
        </div>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            placeholder="0x… contract address"
            className="border-2 border-ink font-mono text-sm bg-cream"
          />
          <Button onClick={save} className="bg-flame text-cream border-2 border-ink shadow-hard-sm hover:bg-flame/90 font-bold shrink-0">
            connect
          </Button>
        </div>
        {error && <p className="text-destructive text-sm font-semibold mt-2">{error}</p>}
      </div>
    </div>
  )
}
