import React from 'react'
import { createRoot } from 'react-dom/client'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from '@reown/appkit/networks'
import './wallet.css'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID?.trim()

// Kinetiq Elysium mainnet (Chain ID 99901)
const elysium = defineChain({
  id: 99901,
  caipNetworkId: 'eip155:99901',
  chainNamespace: 'eip155',
  name: 'Kinetiq Elysium',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.elysium.kinetiq.xyz'] }
  }
})

const networks = [elysium]

if (projectId && projectId !== 'YOUR_PROJECT_ID') {
  const wagmiAdapter = new WagmiAdapter({ networks, projectId, ssr: false })
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    defaultNetwork: elysium,
    metadata: {
      name: 'MUISYLE',
      description: 'MUISYLE — More than a meme. A whole new vibe.',
      url: 'https://memeelysium.github.io',
      icons: ['https://memeelysium.github.io/muisyle-elysium/assets/muisyle-profile.jpg']
    },
    themeMode: 'dark',
    themeVariables: { '--w3m-accent': '#75e6ed', '--w3m-border-radius-master': '12px' },
    features: { analytics: true, email: false, socials: [] }
  })
}

function WalletEntry() {
  if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    return <a className="wallet-setup-link" href="https://dashboard.reown.com" target="_blank" rel="noreferrer" title="Add your Reown Project ID to enable wallet connections">WALLET SETUP</a>
  }
  return <appkit-button />
}

const mount = document.getElementById('wallet-connect-root')
if (mount) createRoot(mount).render(<WalletEntry />)
