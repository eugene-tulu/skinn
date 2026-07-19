import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { monadTestnet, monadMainnet } from './monad'

export const wagmiConfig = createConfig({
  chains: [monadTestnet, monadMainnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
    [monadMainnet.id]: http('https://rpc.monad.xyz'),
  },
})