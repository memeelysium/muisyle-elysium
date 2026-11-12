<div align="center">

<img src="assets/readme-logo.svg" width="180" alt="MUISYLE emblem" />

# MUISYLE

### MORE THAN A MEME. A WHOLE NEW UNIVERSE.

An independent, community-powered gateway to the Elysium ecosystem — discover tokens, explore launches, create culture, and participate in the MUISYLE community.

[![Explore MUISYLE](https://img.shields.io/badge/OPEN_WEBSITE-MUISYLE-38BDF8?style=for-the-badge&logo=googlechrome&logoColor=white)](https://memeelysium.github.io/muisyle-elysium/)
[![Repository](https://img.shields.io/badge/SOURCE-GITHUB-171923?style=for-the-badge&logo=github&logoColor=white)](https://github.com/memeelysium/muisyle-elysium)

<img src="https://img.shields.io/badge/STATUS-IN_DEVELOPMENT-8B7CF6?style=flat-square" alt="In development" />
<img src="https://img.shields.io/badge/HOSTING-GITHUB_PAGES-64748B?style=flat-square" alt="GitHub Pages" />
<img src="https://img.shields.io/badge/LAUNCH-CLANKER_V5-38BDF8?style=flat-square" alt="Clanker V5" />

</div>

---

## Live website

**Official website:** https://memeelysium.github.io/muisyle-elysium/

The site is a responsive, browser-based experience. The repository's GitHub Actions workflow builds the Vite project and publishes the `dist/` directory to GitHub Pages.

## What you can do

| Website area | What it does |
| --- | --- |
| **Overview** | Discover MUISYLE, its ecosystem links, and the main site experiences. |
| **Token Orbit** | Explore the token-focused area of the website and ecosystem resources. |
| **Launch History** | Browse public launch records collected by the MUISYLE history service. New records appear after successful supported launches are submitted and indexed. |
| **Launch Portal** | Prepare and deploy a token through the integrated Clanker V5 flow on supported EVM networks. |
| **Claim Fee** | Continue to the official Clanker tools to review and claim eligible creator rewards. |
| **Cosmic Missions** | Explore community participation and challenge content. |
| **Meme Lab** | Find creative prompts and make community-themed content. |
| **Community** | Find MUISYLE's community channels and project links. |

Some sections and integrations may evolve as development continues. Availability labels shown in the website are authoritative for what is currently enabled.

## Token launch portal

The Launch Portal currently integrates **Clanker V5**. A visitor connects an EVM-compatible wallet, enters token details, reviews the configuration, and approves the transaction in their own wallet.

### Supported launch networks

| Network | Chain ID | Gas token | Website status |
| --- | ---: | --- | --- |
| Elysium Mainnet | `99901` | HYPE | Available |
| Base Mainnet | `8453` | ETH | Available |
| Robinhood Chain | `4663` | ETH | Available |
| Solana | — | SOL | Coming soon; separate integration required |

### Launch configuration

The portal includes:

- Buy and sell fee selection from **1% to 10%**.
- Burn allocation settings, with the remaining allocation directed to creator rewards.
- An optional creator reward recipient address; if left blank, the connected deployer wallet is used.
- Optional project website and X profile metadata.
- Token image URL or upload from the device (PNG, JPG, WEBP, or GIF, up to 5 MB).

The selected fee applies equally to buys and sells. The burn and creator-reward split is configurable in the portal. The portal does not offer buyback configuration.

**Launch platform availability:** Clanker V5 is enabled. BANKR and ASCEND LAUNCH are displayed as coming soon and are not active deployment integrations.

### Important transaction notes

- Wallet connection and transaction signing are user-controlled.
- The website does not ask for or store wallet seed phrases or private keys.
- Network gas is paid by the connected wallet in the network's native gas token.
- Token deployment is an on-chain action and may be irreversible. Review the network, token metadata, fee, burn allocation, and reward recipient before signing.
- Never share your recovery phrase or private key with anyone.

## Logo upload and public launch history

Two supporting Cloudflare Workers provide optional backend services:

- **Logo upload:** the upload Worker accepts supported image files and stores them through the configured Pinata service, returning an IPFS URI. The Pinata JWT is stored as a Cloudflare Worker secret and must never be committed to this repository.
- **Launch History:** the history Worker accepts launch records after the launch flow confirms a successful deployment and exposes a public listing endpoint. It uses a Cloudflare KV namespace.

Launch History starts collecting records after the service is configured; it does not automatically import older launches. KV updates may take a short time to become visible. Worker configuration and RPC availability are operational dependencies, so the public history service should be monitored independently from the static website.

Setup instructions for the history Worker are in [workers/launch-history/README.md](workers/launch-history/README.md).

## Technology

- **Vite** — development build and production bundling.
- **HTML, CSS, JavaScript** — responsive website interface and client-side interactions.
- **Three.js** — selected cosmic visual effects.
- **Lucide** — interface icons.
- **viem** — EVM wallet, chain, and transaction utilities.
- **Clanker SDK V5** — token launch integration.
- **Cloudflare Workers and KV** — logo upload and public launch-history services.
- **Pinata / IPFS** — uploaded token logo storage.
- **GitHub Pages and GitHub Actions** — static website hosting and automated build/deployment.

## Run locally

You need a recent version of Node.js (the Pages workflow uses Node.js 22) and npm.

```bash
git clone https://github.com/memeelysium/muisyle-elysium.git
cd muisyle-elysium
npm install
npm run build
```

To start Vite's local development server:

```bash
npx vite
```

Open the local URL printed by Vite. Do not open `index.html` directly: the launch integration uses bundled modules and dependencies.

## Deployment

The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml):

1. Checks out the repository.
2. Sets up Node.js 22.
3. Installs npm dependencies.
4. Runs `npm run build`.
5. Publishes the generated `dist/` directory to GitHub Pages.

Push changes to `main` or run the workflow manually from the GitHub Actions tab. A successful build does not guarantee that external services (wallet providers, RPC endpoints, Cloudflare Workers, Pinata, or third-party launch services) are available; those dependencies must be tested separately.

## Project structure

```text
.
├── .github/workflows/       # GitHub Pages build and deployment
├── assets/                  # Brand, interface, and meme artwork
├── brand-kit/               # MUISYLE brand resources
├── src/
│   ├── clanker-launch.js    # Clanker V5 launch flow
│   ├── launch-history.js    # Public launch-history interface
│   ├── launch-history-config.js
│   └── logo-upload-config.js
├── supabase/                # Community profile SQL resources
├── workers/launch-history/  # Launch-history Worker source and setup
├── index.html               # Website pages and content
├── styles.css               # Layout and responsive styling
├── script.js                # Main navigation and interactions
├── three-scene.js           # Three.js visual experience
├── motion-effects.js        # Motion effects
├── chart-effects.js         # Chart effects
├── community-profile.js     # Community profile functionality
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## Security and project status

MUISYLE is an independent community project. It is not an official Elysium, Clanker, Base, or Robinhood product and is not endorsed by those teams.

This repository contains frontend code and Worker source/configuration. External services must be configured with their own credentials and secrets. Do not commit API tokens, JWTs, wallet private keys, seed phrases, or other secrets.

Blockchain interactions involve risk. Always verify contract addresses, network details, transaction parameters, and third-party links independently. Nothing on this website or in this repository is financial or investment advice.

## Community and contributions

- **Website:** [memeelysium.github.io/muisyle-elysium](https://memeelysium.github.io/muisyle-elysium/)
- **X:** [@memeelysium](https://x.com/memeelysium)
- **GitHub:** [memeelysium](https://github.com/memeelysium)

Suggestions, bug reports, and thoughtful contributions are welcome through GitHub Issues and Pull Requests.

---

<div align="center">

**MADE FOR THE CULTURE. POWERED BY COMMUNITY.**

*Stay curious. Stay cosmic.*

</div>
