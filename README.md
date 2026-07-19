# skinn — stake on your word

A no-flake machine on Monad. skinn turns promises into pots: stake MON on an RSVP,
a bet, or a daily habit. Keep your word and get your money back — break it and the
people you let down split your stake. No database, no admin, no take-backs.

Built for the **BuildAnything Spark hackathon**.

## Why

Group chats are full of broken plans: the dinner where 3 of 8 show, the gym buddy
who ghosts, the "bet you can't" that ends in "nah, I was joking". Every one of these
fails because flaking is free. skinn makes flaking expensive — with code, not with
social pressure. The contract is the escrow, the referee, and the payout rail.

## The three pool types

### 1. No-flake events (`createEvent`)
- Host picks a stake, a cutoff (event start), and a **secret check-in code**. Only
  `keccak256(code)` goes onchain.
- Everyone stakes to RSVP.
- At the venue the host says the code out loud. Attendees `checkIn(code)` before the cutoff.
- After the cutoff anyone can `settle`: **attendees split the entire pot** — flakers'
  stakes included. If literally nobody showed, everyone is refunded.

Why a code instead of host-marks-attendance or peer voting? One tap for attendees,
zero discretion for the host (they can't mark a couch-sitter as present without
handing them the code — and they'd be handing out their own money), and no
everyone-confirms-everyone friction.

### 2. Bets (`createBet`)
- Creator sets terms (in the title), a stake, a decision deadline, and an **arbiter**
  both sides trust. The arbiter can't join the bet.
- Anyone can match the stake and take the bet.
- Arbiter calls `declareWinner` — winner sweeps the pot.
- Arbiter ghosts? After the deadline, `settleExpiredBet` refunds everyone.

### 3. Stake-backed habits (`createHabit`)
- You stake MON on a daily streak (2–90 days) and name an **accountability buddy**.
- Check in once per rolling window: each check-in must land 20–28h after the last.
- Complete the streak → full refund. Miss a window → your buddy can `claimForfeit`
  and take the pot. Pick a buddy who'll enjoy that a little too much.

## Contract

`contracts/Skinn.sol` — a single ~250-line Solidity contract (0.8.24), no
dependencies, no owner, no upgradeability. MON never sits in a function anyone
else can call: all payouts use the pull pattern (`claimable` + `withdraw`).

| function | who | what |
|---|---|---|
| `createEvent / createBet / createHabit` | anyone (payable) | opens a pool, creator auto-stakes |
| `join` | anyone (payable) | stakes into an open event/bet |
| `checkIn` | staker, before cutoff | event attendance via code hash |
| `habitCheckIn` | habit creator | rolling 20–28h window |
| `declareWinner` | bet arbiter | assigns pot to winner |
| `settle` | anyone, after cutoff | event payout: attendees split pot |
| `settleExpiredBet` | anyone, after deadline | refunds when arbiter ghosts |
| `claimForfeit` | habit buddy | takes pot after a missed window |
| `cancel` | creator, pre-activity | refunds everyone |
| `withdraw` | anyone | pulls your claimable balance |

Tested with Foundry: 11 tests covering every path above (`forge test`).

## Run it

### 1. Deploy the contract (Monad testnet)

```bash
cd contracts
npm install            # viem for the deploy script
# grab testnet MON at https://faucet.monad.xyz
PRIVATE_KEY=0x… node deploy.mjs
# → prints the contract address, writes contracts/deployed.json
```

Mainnet when you're feeling brave: `NETWORK=mainnet PRIVATE_KEY=0x… node deploy.mjs`

### 2. Point the frontend at it

```bash
echo "VITE_CONTRACT_ADDRESS=0xYourContract" > .env
npm install
npm run dev            # or: npm run build → dist/
```

No env? The app will ask for the address on first load and remember it.

### 3. Use it

Connect a wallet on Monad testnet (chain id `10143`, RPC
`https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadexplorer.com`),
get MON from the faucet, and stake up.

## Stack

React 19 + TypeScript + Vite · Tailwind + shadcn/ui · wagmi + viem (all reads
straight from the contract, no backend) · Solidity 0.8.24 · Foundry tests.

## Repo layout

```
contracts/        Skinn.sol, compile artifacts, deploy.mjs
src/pages/        Home (feed+stats), Create (staking wizard), PoolDetail, Me
src/hooks/        useSkinn (contract reads), useTx (writes + receipts)
src/lib/          chain config, ABI, formatting, local code storage
```
