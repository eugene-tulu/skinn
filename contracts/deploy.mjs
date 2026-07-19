// Deploy Skinn.sol to Monad testnet (or mainnet via env).
// Usage:
//   PRIVATE_KEY=0x... node deploy.mjs            # testnet
//   NETWORK=mainnet PRIVATE_KEY=0x... node deploy.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createWalletClient, createPublicClient, http, formatEther, defineChain } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' } },
})

const monadMainnet = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'MonadVision', url: 'https://monadvision.com' } },
})

const chain = process.env.NETWORK === 'mainnet' ? monadMainnet : monadTestnet

let key = process.env.PRIVATE_KEY
if (!key) {
  key = generatePrivateKey()
  console.log('Generated throwaway deployer key:', key)
}
const account = privateKeyToAccount(key)
console.log('Deployer:', account.address)
console.log('Chain:', chain.name, `(id ${chain.id})`)

const publicClient = createPublicClient({ chain, transport: http() })
const wallet = createWalletClient({ account, chain, transport: http() })

const balance = await publicClient.getBalance({ address: account.address })
console.log('Balance:', formatEther(balance), 'MON')
if (balance === 0n) {
  console.error('\nNo funds. Get testnet MON at https://faucet.monad.xyz for', account.address)
  process.exit(1)
}

const bin = readFileSync(new URL('./build/Skinn.bin', import.meta.url), 'utf8').trim()
const abi = JSON.parse(readFileSync(new URL('./build/Skinn.abi', import.meta.url), 'utf8'))

console.log('Deploying…')
const hash = await wallet.deployContract({ abi, bytecode: `0x${bin}` })
console.log('Tx:', hash)
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('Contract address:', receipt.contractAddress)
console.log('Explorer:', `${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`)

writeFileSync(new URL('./deployed.json', import.meta.url), JSON.stringify({
  address: receipt.contractAddress, chainId: chain.id, deployTx: hash,
  deployer: account.address, deployedAt: new Date().toISOString(),
}, null, 2))
