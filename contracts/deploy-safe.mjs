import { readFileSync } from 'node:fs'
import { createWalletClient, http, parseEther, defineChain } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import dotenv from 'dotenv'

dotenv.config()

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' } },
})

key = process.env.PRIVATE_KEY || generatePrivateKey()
const account = privateKeyToAccount(key)

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() })
const wallet = createWalletClient({ account, chain: monadTestnet, transport: http() })

const balance = await publicClient.getBalance({ address: account.address })
console.log('Deployer:', account.address, ' Balance:', balance.toString(), 'wei')
if (balance === 0n) {
  console.error('No funds. Fund the deployer from https://faucet.monad.xyz')
  process.exit(1)
}

const bin = readFileSync(new URL('./build/Skinn.bin', import.meta.url), 'utf8').trim()
const abi = JSON.parse(readFileSync(new URL('./build/Skinn.abi', import.meta.url), 'utf8'))

console.log('Deploying Skinn...')
const hash = await wallet.deployContract({ abi, bytecode: `0x${bin}` })
console.log(`Tx: ${hash}`)

const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log(`Contract: ${receipt.contractAddress}`)
console.log(`Explorer: https://testnet.monadexplorer.com/address/${receipt.contractAddress}`)

writeFileSync(new URL('./deployed.json', import.meta.url), JSON.stringify({
  address: receipt.contractAddress,
  chainId: monadTestnet.id,
  txHash: hash,
  deployer: account.address,
}, null, 2))
