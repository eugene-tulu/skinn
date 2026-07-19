import { useState } from 'react'
import { toast } from 'sonner'
import { useWriteContract, usePublicClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { SKINN_ABI } from '@/lib/abi'
import { EXPLORER } from '@/lib/monad'

async function estimateWithBuffer(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  req: { to: `0x${string}`; data: `0x${string}`; value?: bigint }
): Promise<bigint> {
  try {
    const estimated = await publicClient.estimateGas({
      to: req.to,
      data: req.data,
      value: req.value,
    })
    return (estimated * 105n) / 100n
  } catch {
    return 300000n
  }
}

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
  for (const [, v] of Object.entries(FRIENDLY)) {
    if (msg.includes(v)) return v
  }
  if (/reject|denied/i.test(msg)) return FRIENDLY.UserRejected
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg
}

export type SendSyncRequest = {
  to: `0x${string}`
  data?: `0x${string}`
  functionName?: string
  abi?: readonly unknown[]
  args?: readonly unknown[]
  value?: bigint
  gasLimit?: bigint
}

export type AsyncRequest = {
  contract: `0x${string}`
  functionName: string
  args?: readonly unknown[]
  value?: bigint
  success: string
  gasLimit?: bigint
}

function explorerLink(hash: `0x${string}`) {
  return `${EXPLORER}/tx/${hash}`
}

export function useTx() {
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const [busy, setBusy] = useState(false)

  const sendAsync = async (req: AsyncRequest): Promise<boolean> => {
    if (!publicClient) return false
    setBusy(true)
    const toastId = toast.loading('confirm in your wallet…')
    try {
      const data = encodeFunctionData({
        abi: SKINN_ABI,
        functionName: req.functionName,
        args: req.args,
      } as never) as `0x${string}`
      
      const gasLimit = req.gasLimit ?? (await estimateWithBuffer(publicClient, { to: req.contract, data, value: req.value }))
      const hash = await writeContractAsync({
        address: req.contract,
        abi: SKINN_ABI,
        functionName: req.functionName,
        args: req.args,
        value: req.value,
        gas: gasLimit,
      } as never)
      toast.loading('onchain — waiting for confirmation…', { id: toastId })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'reverted') throw new Error('transaction reverted onchain')
      toast.success(req.success, {
        id: toastId,
        action: { label: 'view tx', onClick: () => window.open(explorerLink(hash), '_blank') },
      })
      return true
    } catch (e) {
      toast.error(parseError(e), { id: toastId })
      return false
    } finally {
      setBusy(false)
    }
  }

  const sendSync = async (req: SendSyncRequest): Promise<boolean> => {
    if (!publicClient) return false
    setBusy(true)
    const toastId = toast.loading('confirm in your wallet…')
    try {
      const data = req.data ?? (req.functionName
        ? (encodeFunctionData({
            abi: req.abi ?? SKINN_ABI,
            functionName: req.functionName,
            args: req.args,
          } as never) as `0x${string}`)
        : undefined)

      if (!data) throw new Error('sendSync: neither data nor functionName provided')

      const hash = await (publicClient as any).sendRawTransaction({
        raw: data as `0x${string}`,
      })
      toast.success(req.functionName ?? 'sent', {
        id: toastId,
        action: { label: 'view tx', onClick: () => window.open(explorerLink(hash), '_blank') },
      })
      return true
    } catch (e) {
      toast.error(parseError(e), { id: toastId })
      return false
    } finally {
      setBusy(false)
    }
  }

  const estimate = async (req: AsyncRequest): Promise<bigint> => {
    if (!publicClient) return 300000n
    const data = encodeFunctionData({
      abi: SKINN_ABI,
      functionName: req.functionName,
      args: req.args,
    } as never) as `0x${string}`
    return estimateWithBuffer(publicClient, { to: req.contract, data, value: req.value })
  }

  const send = sendAsync

  return { sendAsync, sendSync, estimate, send, busy }
}