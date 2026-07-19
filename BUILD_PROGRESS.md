# skinn — Build Progress Log

## Project Summary
Stake MON on your word. No-flake event RSVPs, bets between friends, and stake-backed daily habits backed by a single ~250-line Solidity contract on Monad Testnet. Frontend: Vite + React + wagmi/viem (no backend).

Category: Monad Testnet Hackathon Submission

Contract address: `0xA75F47cef46CA9853De49F6A3646ccA54261Bc51` (Monad testnet, verified on MonadVision)

---

## What We've Done

### 1. Contract Deployment
- Contract: `contracts/Skinn.sol` (252 lines, Solidity 0.8.24)
- Deployed: `0xA75F47cef46CA9853De49F6A3646ccA54261Bc51`
- Transaction: `0xd734c80f4774a4ca9162ce39692467a43d8709d916ef094621b6792d7c539f76`
- Verified: ✅ on MonadVision
- Deployment record: `contracts/deployed.json`

### 2. Frontend Setup
- React 19 + TypeScript + Vite (no backend)
- wagmi + viem for contract interactions
- Para SDK already installed and configured
- Tailwind v3 + shadcn/ui components

### 3. Transaction Hook (`src/hooks/useTx.ts`)
- `sendAsync`: wallet-prompt flow with explicit `gasLimit` support for Monad's gas model
- `sendSync`: `publicClient.sendRawTransaction` for sync-style flows
- `estimate`: gas estimation with 5% buffer
- Error-to-toast mapping preserved

### 4. Configuration
- `.env` with `VITE_CONTRACT_ADDRESS` and `VITE_PARA_API_KEY`
- `.gitignore` excludes `.env`, `.env*.local`, `.pararc`
- Chain config in `src/lib/monad.ts` with testnet/mainnet support

---

## What Remains

### A. Gas Limit Calibration
Call sites in `src/pages/Create.tsx`, `src/pages/Home.tsx` that call `useTx().sendAsync(...)` need explicit `gasLimit` values:
- createEvent / createBet / createHabit: `~300,000`
- join: `~200,000`
- checkIn / habitCheckIn / settle: `~250,000`
- withdraw: `~50,000`

### B. Optional: Para Provider Wiring
Currently using injected connector only. To add Para:
1. Wrap app with `ParaProvider` in `src/App.tsx`
2. Add EVM connectors via `@getpara/evm-wallet-connectors`
3. Configure chains: `[monadTestnet, monad]` with respective RPCs

---

## File Inventory

| Path | Status |
|---|---|
| `contracts/Skinn.sol` | ✅ Complete |
| `contracts/deployed.json` | ✅ Created |
| `contracts/build/Skinn.abi` | ✅ Exists |
| `contracts/build/Skinn.bin` | ✅ Exists |
| `src/hooks/useTx.ts` | ✅ Rewritten with gas support |
| `src/lib/wagmi.ts` | ✅ Configured for Monad |
| `src/App.tsx` | ✅ Missing ParaProvider (optional) |
| `package.json` | ✅ Para SDK installed |
| `.pararc` | ✅ Exists |
| `.gitignore` | ✅ Secrets excluded |
| `.monskills` | ✅ Created (chain=monad-testnet)