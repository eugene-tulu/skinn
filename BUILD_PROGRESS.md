# skinn — Build Progress Log

## Project Summary
Stake MON on your word. No-flake event RSVPs, bets between friends, and
stake-backed daily habits backed by a single ~250-line Solidity contract on
Monad Testnet. Frontend: Vite + React + wagmi/viem (no backend).

Catgeory: Monad Testnet Hackathon Submission

Contract address:
  Deployed: 0xb4Fc44F31941D7704A45A036874526760eddA4eC
  Deploy tx: 0x99d8083324661a7bd40a0f609c3d5bf0115fa95b1ca083f4c199cbb057a932d9
  Chain: Monad Testnet (10143)

---

## What We've Done

### 1. `.monskills` (new file)
- Marks the project as built with monskills and targeted to Monad testnet.
- Content:
  ```ini
  built-with=monskills
  chain=monad-testnet
  ```

### 2. `src/hooks/useTx.ts` (rewritten)
- Added `sendAsync` — same wallet-prompt flow but now passes an explicit
  `gas: req.gasLimit` to `writeContractAsync`.  On Monad users pay the
  limit, not the usage, so callers must now supply a tight limit.
- Added `sendSync` — uses `publicClient.sendTransaction` directly so the
  call can be paired with Monad’s `eth_sendRawTransactionSync`-style
  flow for instant receipt.
- Changed exports: `useTx()` now returns `{ sendAsync, sendSync, busy }`.
- All existing error-toast mapping and explorer-link behaviour preserved.

### 3. Agent Wallet
- Keystore: `~/.monskills/keystore/58896d70-41fd-49a4-8c2c-ceb7f33848b3`
- Address: 0x0CaE4f05f49Cc7Df5f4ce5ad40A5bb1A66343a86
- Funded with 1 MON (testnet faucet) for contract deployment.

### 4. Safe Multisig (deployed on Monad Testnet)
- Address: 0x8Bcd89BC6A10688e694B49B36371D0744796bF5E
- Access: https://app.safe.global/home?safe=monad-testnet:0x8Bcd89BC6A10688e694B49B36371D0744796bF5E
- Chain: Monad Testnet (10143)
- Owners:
  1. 0x6B770eED039915686701A010000B36Ad98Ab651E
  2. 0x2cF0A9eBc5889b0827BfAeD7Ec5edc9a47bEb3Da
  3. 0x0CaE4f05f49Cc7Df5f4ce5ad40A5bb1A66343a86
- Threshold: 2-of-3
- Saved to: `~/.monskills/multisig.json`
- Funded via faucet so it can execute transactions.

### 5. Skinn.sol Deployed
- Contract address: 0xb4Fc44F31941D7704A45A036874526760eddA4eC
- Deployment tx: 0x99d8083324661a7bd40a0f609c3d5bf0115fa95b1ca083f4c199cbb057a932d9
- Deployed by: 0x0CaE4f05f49Cc7Df5f4ce5ad40A5bb1A66343a86 (agent wallet)
- Status: confirmed (status 1)
- Contract ABI: `contracts/build/Skinn.abi`
- Deployment record: `contracts/deployed.json`

### 6. Frontend Config Updated
- `src/lib/wagmi.ts`: migrated to import `monad`, `monadMainnet`,
  `monadTestnet` directly from `wagmi/chains` so the same config can be
  reused by Para’s `externalWalletConfig.evmConnector.config`.
- Pre-wired for Para integration (chains + transports).

### 7. `.gitignore` Updated
- Added `.env*.local` and `.pararc` so secrets/private Para config never
  accidentally get committed.

---

## What Remains / Is Still Missing

### A. Contract Verification (BLOCKED — needs decision)
The verification API returned bytecode mismatch because the pre-built
`contracts/build/Skinn.bin` was compiled without `viaIR`, but Monadscan’s
compiler version required `viaIR: true`.

Two options:
  a) Rebuild `Skinn.sol` with `viaIR: true` + compatible 0.8.24 compiler,
     redeploy to get matching bytecode, then rerun the verification API.
  b) Find the exact original compiler settings (foundry.toml, hardhat config,
     or solc wrapper at `contracts/solc`) that produced the existing
     `build/Skinn.bin`, then feed those exact settings to the API.

Until verified, the contract won’t appear as “verified” on MonadVision,
Monadscan, or Socialscan.

### B. Para Wallet Integration (PARTIALLY BLOCKED — package install failed)
- We have `.pararc` ({ environment: "beta" })
- We still need the SDK packages installed:
  `@getpara/react-sdk` and `@getpara/evm-wallet-connectors`
  (`@getpara/wagmi` does not exist — the skill uses
  `@getpara/evm-wallet-connectors`).
- Then `para keys list` to confirm an API key exists (if not, `para keys
  create -n skinn-beta --display-name "Skinn (beta)"`).
- Then `para doctor` to catch wiring issues.
- Then wire `ParaProvider` in `src/App.tsx` (or a new `src/providers.tsx`)
  with Monad chains + transports per `para-monad-wiring.md`:
    - chains: `[monadTestnet, monad]` (testnet first = default)
    - transports with `https://testnet-rpc.monad.xyz` /
      `https://rpc.monad.xyz`
- Add `VITE_PARA_API_KEY=<public-key>` to `.env`.

### C. Contract Address in Frontend
The frontend reads the contract address from `VITE_CONTRACT_ADDRESS` env
var or `localStorage`. Set `VITE_CONTRACT_ADDRESS=0xb4Fc44F31941D7704A45A036874526760eddA4eC`
in `.env` so reading pools works without manual localStorage setup.

### D. Indexer (Optional — only if historical feed is needed)
If you want an activity feed / past-pool list that can’t be satisfied by
single `eth_call`s, run the `indexer/` skill to scaffold a HyperIndex
indexer against `Skinn.sol` on Monad Testnet. Requires `envio-cloud` CLI +
`envio-cloud login`.

### E. Gas Limit Constants in Frontend
Call sites in `src/pages/Create.tsx`, `src/pages/Home.tsx`, etc. that call
`useTx().sendAsync(...)` need a `gasLimit: bigint` field added. Typical
values for Skinn pools (testnet, optimistic buffer):
  - createEvent / createBet / createHabit: ~300,000
  - join: ~200,000
  - checkIn / habitCheckIn / settle: ~250,000
  - withdraw: ~50,000
These must be calibrated — too high costs the user real MON on Monad.

---

## File Inventory

| Path | Status |
|---|---|
| `.monskills` | ✅ Created |
| `.gitignore` | ✅ Updated (.env*.local, .pararc) |
| `.pararc` | ✅ Exists (environment: beta) |
| `contracts/Skinn.sol` | ✅ Source unchanged |
| `contracts/build/Skinn.bin` | ✅ Exists |
| `contracts/build/Skinn.abi` | ✅ Exists |
| `contracts/deploy.mjs` | ✅ Exists (unused — we deployed directly) |
| `contracts/deploy-safe.mjs` | ✅ Created (Safe route, not used) |
| `contracts/deployed.json` | ✅ Created |
| `contracts/deployed-safe.json` | ❌ Not created (Safe deployment incomplete) |
| `~/.monskills/keystore/58896d70-...` | ✅ Created |
| `~/.monskills/multisig.json` | ✅ Created |
| `src/hooks/useTx.ts` | ✅ Rewritten with gas limits + sendSync |
| `src/lib/wagmi.ts` | ✅ Updated (wagmi/chains imports) |
| `src/lib/monad.ts` | ⏸ Not touched (could be simplified since wagmi.ts now owns chains) |
| `src/App.tsx` | ⏸ Needs ParaProvider wiring once packages install |
| `src/providers.tsx` | ❌ Not created (alternative ParaProvider location) |
| `.env` / `.env.local` | ❌ Needs `VITE_CONTRACT_ADDRESS=` + `VITE_PARA_API_KEY=` |
