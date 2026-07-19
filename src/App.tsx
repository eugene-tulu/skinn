import { Routes, Route } from 'react-router'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { wagmiConfig } from '@/lib/wagmi'
import { Header } from '@/components/Header'
import { Home } from '@/pages/Home'
import { Create } from '@/pages/Create'
import { PoolDetail } from '@/pages/PoolDetail'
import { Me } from '@/pages/Me'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/pool/:id" element={<PoolDetail />} />
              <Route path="/me" element={<Me />} />
            </Routes>
          </main>
          <footer className="border-t-2 border-ink py-6">
            <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
              <span className="font-display text-base text-ink">skinn<span className="text-flame">.</span></span>
              <span>no databases. no take-backs. just stakes on monad.</span>
              <span>built for the spark hackathon</span>
            </div>
          </footer>
        </div>
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
