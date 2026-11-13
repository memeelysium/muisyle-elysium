<div align="center">

<img src="assets/readme-logo.svg" width="180" alt="MUISYLE emblem" />

# MUISYLE

### MORE THAN A MEME. A WHOLE NEW UNIVERSE.

**OFFICIAL TOKEN — MULISYE (Mulisyle)**

- **Network:** Elysium Mainnet
- **Contract Address:** `0x2117FAF8600E88cB15383FdA942098FeDE3ACcCC`
- **Explorer:** [View MULISYE on Elyscan](https://elyscan.live/token/0x2117FAF8600E88cB15383FdA942098FeDE3ACcCC)


An independent community project for exploring the Elysium ecosystem, discovering token information, creating community content, and launching tokens through an integrated Clanker V5 interface.

[![Open Website](https://img.shields.io/badge/OPEN_WEBSITE-MUISYLE-38BDF8?style=for-the-badge&logo=googlechrome&logoColor=white)](https://memeelysium.github.io/muisyle-elysium/)
[![Source Code](https://img.shields.io/badge/SOURCE-GITHUB-171923?style=for-the-badge&logo=github&logoColor=white)](https://github.com/memeelysium/muisyle-elysium)

<img src="https://img.shields.io/badge/STATUS-ACTIVE_DEVELOPMENT-8B7CF6?style=flat-square" alt="Active development" />
<img src="https://img.shields.io/badge/HOSTING-GITHUB_PAGES-64748B?style=flat-square" alt="GitHub Pages" />
<img src="https://img.shields.io/badge/LAUNCH-INTEGRATION_CLANKER_V5-38BDF8?style=flat-square" alt="Clanker V5" />

</div>

---

## Official website

**https://memeelysium.github.io/muisyle-elysium/**

MUISYLE is a browser-based community interface. The site is built with Vite and deployed to GitHub Pages through GitHub Actions.

## Explore MUISYLE

| Section | Description |
| --- | --- |
| **Overview** | Introduction to MUISYLE and shortcuts to the website's main areas. |
| **Token Orbit** | A community-curated directory of selected Elysium ecosystem tokens, with links to inspect contracts on Elyscan. Listings are informational and are not endorsements. |
| **Launch History** | A public archive of launch records submitted after the integrated launch flow receives on-chain confirmation. |
| **Launch Portal** | A token deployment interface integrated with Clanker V5 on supported EVM networks. |
| **Claim Fee** | Opens the official Clanker rewards interface so eligible creators can review and claim rewards. |
| **Cosmic Missions** | Community creative challenges. |
| **Meme Lab** | A simple caption-prompt tool for creating and sharing community content. |
| **Community** | Links to MUISYLE's X account, GitHub, and ecosystem resources. |

Some areas and external integrations may change as the project develops. Features that depend on third-party services may be temporarily unavailable.

## Token Launch Portal

The Launch Portal integrates **Clanker V5**. Users provide token details, connect an EVM-compatible wallet, review the configuration, and approve the deployment transaction in their wallet.

### Networks configured in the launch interface

| Network | Chain ID | Native gas token |
| --- | ---: | --- |
| Elysium Mainnet | `99901` | HYPE |
| Base Mainnet | `8453` | ETH |
| Robinhood Chain | `4663` | ETH |
| Solana | — | Not available through this Clanker V5 integration |

Network availability also depends on the connected wallet, RPC service, and Clanker deployment support. The presence of a network selector does not guarantee that every wallet provider supports that network. Solana requires a separate Solana wallet and launch integration and is not enabled in this portal.

### Launch options

The interface provides:

- Buy and sell fee selection from **1% to 10%**.
- A configurable burn allocation; the remaining share is assigned to creator rewards.
- An optional creator reward recipient address. If left blank, the connected deployer wallet is used.
- Optional project website and X profile metadata.
- Token logo upload from a device or an HTTPS/IPFS image reference.
- A live token preview and a required review confirmation before deployment.

The selected fee applies to both buys and sells. Burn and creator allocations are calculated from the tax remaining after Clanker's protocol fee, not from the full trade amount. Clanker V5 anti-snipe protection may temporarily increase the total fee to as much as 99% during the first 20 seconds before it decays to the selected tax. Review all settings and the wallet transaction before signing.

### Wallet and transaction safety

- Wallet connection and transaction approval remain under the user's control.
- The launch interface does not ask users to enter or share their seed phrase or private key.
- Network gas is paid by the connected wallet in the network's native gas token.
- Token deployment is an on-chain transaction and may be irreversible.
- If a transaction is submitted but its status cannot be verified, check the transaction in the relevant block explorer before attempting another deployment.
- Never share your recovery phrase or private key with anyone.

Wallet login methods and embedded-wallet capabilities may depend on the version of the website and its configured authentication provider. Do not assume that a social-login or wallet-export feature is available in every build of this repository unless it is present and tested in the deployed application.

## Public Launch History

The Launch History page reads records from the MUISYLE Cloudflare Worker:

`https://muisyle-launch-history.pemujarahasiailahi.workers.dev/launches`

After Clanker V5 confirms a deployment, the frontend attempts to submit the token address, transaction hash, network, and project metadata to the history service. A successful on-chain launch can still occur even if the history submission fails; in that case, the transaction should be checked directly in the block explorer.

The archive only contains records collected by the service after it was configured. It does not automatically import older launches. The public listing depends on the Worker and its Cloudflare KV storage being configured and available.

Worker setup documentation: [workers/launch-history/README.md](workers/launch-history/README.md).

## Token logo upload

The launch form can upload supported image files through a separate Cloudflare Worker and the configured Pinata/IPFS service.

- Supported formats: PNG, JPG/JPEG, WEBP, and GIF.
- Maximum file size: 5 MB.
- The upload service returns an IPFS URI for use as token metadata.

The Pinata credential must be stored as a Cloudflare Worker secret. Never place JWTs, API tokens, or other secrets in this repository or frontend code.

## Technology

- **Vite** — development server and production build.
- **HTML, CSS, and JavaScript** — website interface and client-side interactions.
- **Three.js** — selected visual effects.
- **Lucide** — interface icons.
- **viem** — EVM wallet, chain, and transaction utilities.
- **Clanker SDK V5** — token launch integration.
- **Cloudflare Workers and KV** — logo upload and public launch-history services.
- **Pinata / IPFS** — token image storage.
- **GitHub Pages and GitHub Actions** — static hosting and automated deployment.

## Run locally

Requirements: Node.js (the Pages workflow uses Node.js 22) and npm.

```bash
git clone https://github.com/memeelysium/muisyle-elysium.git
cd muisyle-elysium
npm install
npm run build
npx vite
```

Open the local URL printed by Vite. Do not open `index.html` directly because the launch integration uses bundled modules and dependencies.

## Deployment

The GitHub Actions workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the Vite project and publishes the generated `dist/` directory to GitHub Pages.

The deployment workflow:

1. Checks out the repository.
2. Sets up Node.js 22.
3. Installs npm dependencies.
4. Runs `npm run build`.
5. Publishes `dist/` to GitHub Pages.

Push changes to the `main` branch or manually run the workflow from the GitHub Actions tab. A successful static build does not guarantee that external services such as wallet providers, RPC endpoints, Cloudflare Workers, Pinata, or Clanker are available. Test those integrations separately.

## Repository structure

```text
.
├── .github/workflows/        # GitHub Pages build and deployment
├── assets/                   # Brand and interface artwork
├── brand-kit/                # MUISYLE brand resources
├── src/
│   ├── clanker-launch.js     # Clanker V5 launch flow
│   ├── launch-history.js     # Public launch-history interface
│   ├── launch-history-config.js
│   └── logo-upload-config.js
├── workers/launch-history/   # Launch-history Worker source and setup
├── supabase/                 # Legacy/community profile resources
├── index.html                # Website pages and content
├── styles.css                # Layout and responsive styling
├── script.js                 # Main navigation and interactions
├── three-scene.js            # Three.js visual experience
├── motion-effects.js          # Motion effects
├── chart-effects.js           # Chart effects
├── community-profile.js      # Community profile functionality
├── package.json              # Dependencies and scripts
└── vite.config.js             # Vite configuration
```

## Independence, security, and risk

MUISYLE is an independent community project. It is not an official Elysium, Clanker, Base, Robinhood, or other network/provider product, and it is not endorsed by those teams.

Blockchain assets and transactions involve risk. Token prices, liquidity, trading activity, and creator rewards are not guaranteed. Always verify network details, contract addresses, transaction parameters, and third-party links independently. Nothing on this website or in this repository is financial advice.

This repository contains frontend code and Worker source/configuration. External services may require separate setup and credentials. Do not commit secrets, private keys, seed phrases, access tokens, or service credentials.

## Community and contributions

- **Website:** [memeelysium.github.io/muisyle-elysium](https://memeelysium.github.io/muisyle-elysium/)
- **X:** [@memeelysium](https://x.com/memeelysium)
- **GitHub:** [memeelysium](https://github.com/memeelysium)

Bug reports, suggestions, and thoughtful contributions are welcome through GitHub Issues and Pull Requests.

---

<div align="center">

**MADE FOR THE CULTURE. POWERED BY COMMUNITY.**

*Stay curious. Stay cosmic.*

</div>
