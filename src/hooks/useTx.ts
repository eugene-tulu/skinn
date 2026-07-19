import { useState } from 'react'
import { toast } from 'sonner'
import { usePublicClient, useWriteContract } from 'wagmi'
import { SKINN_ABI } from '@/lib/abi'
import { EXPLORER } from '@/lib/monad'

const FRIENDLY: Record<string, string> = {
  WrongValue: 'wrong stake amount — match the pool stake exactly',
  AlreadyJoined: 'you already staked into this pool',
  AlreadyCheckedIn: 'already checked in',
  BadCode: 'wrong check-in code',
  TooLate: 'too late — the window has closed',
  TooEarly: 'too early — not yet',
  NotOpen: 'pool is no longer open',
  NotJoined: 'you have no stake in this pool',
  NotArbiter: 'only the arbiter can call this',
  NotBeneficiary: 'only the beneficiary can claim a forfeit',
  NotCreator: 'only the creator can do that',
  NotAllowed: 'not allowed in the current state',
  NothingToWithdraw: 'nothing to withdraw',
  UserRejected: 'transaction rejected in wallet',
}

function parseError(e: unknown): string {
  const anyE = e as { shortMessage?: string; message?: string; cause?: { reason?: string } }
  const msg = anyE?.shortMessage || anyE?.cause?.reason || anyE?.message || 'transaction failed'
  for (const [k, v] of Object.entries(FRIENDLY)) {
    if (msg.includes(k)) return v
  }
  if (/reject|denied/i.test(msg)) return FRIENDLY.UserRejected
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg
}

export type TxRequest = {
  contract: `0x${string}`
  functionName: string
  args?: readonly unknown[]
  value?: bigint
  success: string
}

export function useTx() {
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const [busy, setBusy] = useState(false)

  const send = async (req: TxRequest): Promise<boolean> => {
    if (!publicClient) return false
    setBusy(true)
    const toastId = toast.loading('confirm in your wallet…')
    try {
      // The request is validated at the call sites; cast keeps the const-ABI
      // generics from over-constraining a dynamic dispatch helper.
      const hash = await writeContractAsync({
        address: req.contract,
        abi: SKINN_ABI,
        functionName: req.functionName,
        args: req.args,
        value: req.value,
      } as never)
      toast.loading('onchain — waiting for confirmation…', { id: toastId })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'reverted') throw new Error('transaction reverted onchain')
      toast.success(req.success, {
        id: toastId,
        action: { label: 'view tx', onClick: () => window.open(`${EXPLORER}/tx/${hash}`, '_blank') },
      })
      return true
    } catch (e) {
      toast.error(parseError(e), { id: toastId })
      return false
    } finally {
      setBusy(false)
    }
  }

  return { send, busy }
}
