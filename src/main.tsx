import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ParaProvider } from '@getpara/react-sdk'
import { monadTestnet, monadMainnet } from './lib/monad'
import { http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Environment } from '@getpara/core-sdk'
import './index.css'
import App from './App.tsx'

const paraApiKey = import.meta.env.VITE_PARA_API_KEY as string | undefined
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ParaProvider
          paraClientConfig={{
            apiKey: paraApiKey ?? '',
            env: Environment.BETA,
          }}
          externalWalletConfig={{
            evmConnector: {
              config: {
                chains: [monadTestnet, monadMainnet],
                transports: {
                  [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
                  [monadMainnet.id]: http('https://rpc.monad.xyz'),
                },
              },
            },
          }}
        >
          <App />
        </ParaProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)