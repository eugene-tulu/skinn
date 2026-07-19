import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ACTIVE_CHAIN, monadMainnet, monadTestnet } from './monad'

export const wagmiConfig = createConfig({
  chains: [ACTIVE_CHAIN],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [monadTestnet.id]: http(),
    [monadMainnet.id]: http(),
  },
})
