# skinn — stake on your word

[![Hackathon](https://img.shields.io/badge/Built%20for-BuildAnything%20Spark-blueviolet)](https://buildanything.xyz)
[![Monad](https://img.shields.io/badge/Monad%20testnet--10143-8A6D3B)](https://testnet.monadexplorer.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A commitment protocol on Monad. Create pools for events, bets, or habits. Stake MON on a promise—keep your word and get refunded, or lose your stake to the people you let down. **No admin. No take-backs. Just code.**

Live: https://skinn-ten.vercel.app

## How It Works

### 1. No-flake events (`createEvent`)
Host sets a stake, deadline, and secret check-in code (hash stored onchain). Guests stake to RSVP. At the event, reveal the code—check in before the cutoff or lose your stake. After the deadline, attendees split the pot including flakers' stakes.

### 2. Bets (`createBet`)
Creator sets terms, stake, and a trusted arbiter. Anyone matches the stake to take the other side. Arbiter calls `declareWinner`—winner sweeps the pot. Ghosted arbiter? After the deadline, `settleExpiredBet` refunds everyone.

### 3. Stake-backed habits (`createHabit`)
Stake MON on a daily streak (2–90 days). Check in once per 20–28 hour rolling window. Complete all check-ins → full refund. Miss a window → your accountability buddy claims the pot.

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

## Contract

`contracts/Skinn.sol` — 250-line Solidity contract (0.8.24), no dependencies, no owner, no upgradeability.

**Deployed:** `0xA75F47cef46CA9853De49F6A3646ccA54261Bc51` (Monad testnet, verified on MonadVision)

### Functions

| function | caller | purpose |
|----------|--------|---------|
| `createEvent` | anyone (payable) | opens an RSVP pool |
| `createBet` | anyone (payable) | opens a bet |
| `createHabit` | anyone (payable) | opens a habit streak |
| `join` | anyone (payable) | stakes into open pool |
| `checkIn` | staker | event attendance via code |
| `habitCheckIn` | habit creator | rolling window check-in |
| `declareWinner` | bet arbiter | assigns pot to winner |
| `settle` | anyone, after deadline | event payout |
| `settleExpiredBet` | anyone, after deadline | bet refund |
| `claimForfeit` | habit buddy | claims missed habit pot |
| `cancel` | creator, pre-activity | refunds everyone |
| `withdraw` | anyone | pulls claimable balance |

### Testing

```bash
forge test
```

## Stack

React 19 + TypeScript + Vite · Tailwind v3 + shadcn/ui · wagmi + viem · Para SDK · Solidity 0.8.24 · Foundry

## Project Structure

```
contracts/       Skinn.sol + deploy script
src/
  pages/         Home, Create, PoolDetail, Me
  hooks/         useSkinn, useTx
  lib/           chain config, ABI
```

## Configuration

Create `.env` with:

```bash
VITE_CONTRACT_ADDRESS=0xA75F47cef46CA9853De49F6A3646ccA54261Bc51
VITE_PARA_API_KEY=your-api-key
```

Get a Para API key at https://developer.getpara.com

## License

MIT