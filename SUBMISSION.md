# Spark hackathon submission — skinn

**Name**
skinn

**Description**
Stake MON on your word. No-flake event RSVPs, bets between friends, and
stake-backed daily habits — keep your promise or lose your money to the people
you let down.

**Problem**
Every group chat has the same failures: the dinner where half the table no-shows,
the gym buddy who ghosts, the "bet you $20" that never gets paid. Flaking is free,
so people flake. Existing fixes (nagging, social pressure, honor-system apps like
stickK clones) all rely on someone choosing to enforce — nobody ever does.

**Solution**
skinn makes flaking expensive with a contract, not a conscience:
- **Events**: stake to RSVP. The host reveals a secret code at the venue (only its
  hash is onchain). Check in with the code → split the flakers' stakes.
- **Bets**: both sides stake, a pre-agreed arbiter calls the winner, who sweeps
  the pot. Arbiter ghosts → automatic refunds.
- **Habits**: stake on a daily streak with an accountability buddy as beneficiary.
  Check in every 20–28h window → get it all back. Miss one → buddy takes the pot.

Escrow, refereeing, and payouts all happen in a single ~250-line ownerless
Solidity contract on Monad. The frontend has no backend — every number on the
page is read from the contract.

**Category**
Monad Testnet

**Contract address**
(deploy with `contracts/deploy.mjs` — see README)

**Demo flow for the video** (~2.5 min)
1. Connect wallet, claim MON from the faucet.
2. Create an event pool ("omakase friday"), show the secret code, copy the pool link.
3. Second wallet joins (stake in, pot grows on the home feed).
4. Check in with the code from the attendee wallet; fast-forward past the cutoff.
5. Settle → attendee splits the pot; withdraw to wallet. Show `totalSettledEver` tick up.
6. Quick tour: bet creation with an arbiter, and a 7-day gym habit with streak dots.
