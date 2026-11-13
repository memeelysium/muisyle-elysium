import { Clanker } from "clanker-sdk/v5";
import { createPublicClient, createWalletClient, custom, defineChain, getAddress, http } from "viem";
import { base } from "viem/chains";
import { LAUNCH_HISTORY_ENDPOINT } from "./launch-history-config.js";

const ELYSIUM_ID = 99901;
const ELYSIUM_RPC = "https://rpc.elysium.kinetiq.xyz";
const ROBINHOOD_ID = 4663;
const ROBINHOOD_RPC = "https://rpc.mainnet.chain.robinhood.com";
const elysium = defineChain({
  id: ELYSIUM_ID,
  name: "Elysium Mainnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: [ELYSIUM_RPC] } },
  blockExplorers: { default: { name: "Elyscan", url: "https://elyscan.live" } },
});
const robinhood = defineChain({
  id: ROBINHOOD_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [ROBINHOOD_RPC] } },
  blockExplorers: { default: { name: "Robinhood Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});
const NETWORKS = {
  elysium: {
    id: ELYSIUM_ID, chain: elysium, rpcUrl: ELYSIUM_RPC, title: "ELYSIUM MAINNET",
    detail: "Chain ID 99901 · Gas token HYPE · Clanker v5", gas: "HYPE",
    explorer: "https://elyscan.live", label: "Elysium · 99901",
    pairs: [
      { value: "native", label: "HYPE · Native", display: "HYPE" },
      { value: "usdc", label: "USDC · Stablecoin", display: "USDC", token: "0xb47c4C8F73F009CC0C0d3f92B388d13E293F0B65" },
    ],
  },
  base: {
    id: base.id, chain: base, rpcUrl: "https://mainnet.base.org", title: "BASE MAINNET",
    detail: "Chain ID 8453 · Gas token ETH · Clanker v5", gas: "ETH",
    explorer: "https://basescan.org", label: "Base · 8453",
    pairs: [
      { value: "native", label: "ETH · Native", display: "ETH" },
      { value: "usdc", label: "USDC · Stablecoin", display: "USDC", token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    ],
  },
  robinhood: {
    id: ROBINHOOD_ID, chain: robinhood, rpcUrl: ROBINHOOD_RPC, title: "ROBINHOOD CHAIN",
    detail: "Chain ID 4663 · Gas token ETH · Clanker v5", gas: "ETH",
    explorer: "https://robinhoodchain.blockscout.com", label: "Robinhood · 4663",
    pairs: [
      { value: "native", label: "ETH · Native", display: "ETH" },
      { value: "usdg", label: "USDG · Stablecoin", display: "USDG", token: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" },
    ],
  },
};
const $ = (id) => document.getElementById(id);
const form = $("clanker-form");
if (form) {
  const status = $("cl-status");
  const deployButton = $("cl-deploy");
  const connectButton = $("cl-connect");
  const resultBox = $("cl-result");
  let connectedAddress = null;
  let activeProvider = null;
  let busy = false;
  let needsReconciliation = false;
  const setStatus = (message, type = "") => { status.textContent = message; status.dataset.state = type; };
  const shortAddress = (address) => address ? address.slice(0, 6) + "…" + address.slice(-4) : "";
  const walletProvider = () => (window.ethereum || window.MUISYLE_PRIVY_PROVIDER)?.providers?.length
    ? ((window.ethereum || window.MUISYLE_PRIVY_PROVIDER).providers.find((provider) => provider.isMetaMask) || (window.ethereum || window.MUISYLE_PRIVY_PROVIDER).providers[0])
    : (window.ethereum || window.MUISYLE_PRIVY_PROVIDER);
  const listenedProviders = new WeakSet();
  const attachProviderListeners = (provider) => {
    if (!provider || typeof provider.on !== "function" || listenedProviders.has(provider)) return;
    listenedProviders.add(provider);
    provider.on("accountsChanged", (accounts) => {
      try { connectedAddress = accounts?.[0] ? getAddress(accounts[0]) : null; }
      catch { connectedAddress = null; }
      deployButton.disabled = !connectedAddress || !$('cl-confirm').checked || busy;
      connectButton.textContent = connectedAddress ? "Connected " + shortAddress(connectedAddress) : "Connect wallet";
      setStatus(connectedAddress ? "Wallet account updated." : "Wallet disconnected. Reconnect to continue.");
    });
    provider.on("chainChanged", (chainId) => {
      const activeChainId = Number.parseInt(chainId, 16);
      if (activeChainId === selectedNetwork().id) {
        deployButton.disabled = needsReconciliation || !connectedAddress || !$('cl-confirm').checked || busy;
        setStatus("Wallet connected to " + selectedNetwork().chain.name + ".", "success");
        return;
      }
      connectedAddress = null;
      deployButton.disabled = true;
      connectButton.textContent = "Reconnect wallet";
      setStatus("The wallet network changed. Reconnect to " + selectedNetwork().chain.name + ".");
    });
  };
  const selectedNetwork = () => NETWORKS[$("cl-network").value] || NETWORKS.elysium;
  const selectedPair = () => selectedNetwork().pairs.find((pair) => pair.value === $("cl-pair").value) || selectedNetwork().pairs[0];
  const syncNetworkUI = () => {
    const network = selectedNetwork();
    const pairSelect = $("cl-pair");
    const previousPair = pairSelect.value;
    pairSelect.replaceChildren(...network.pairs.map((pair) => {
      const option = document.createElement("option");
      option.value = pair.value;
      option.textContent = pair.label;
      return option;
    }));
    pairSelect.value = network.pairs.some((pair) => pair.value === previousPair) ? previousPair : network.pairs[0].value;
    $("cl-network-title").textContent = network.title;
    $("cl-network-details").textContent = network.detail;
    $("cl-network-explorer").href = network.explorer;
    $("cl-preview-network").textContent = network.title + " · CLANKER V5";
    $("cl-fact-network").textContent = network.label;
    $("cl-fact-gas").textContent = "Paid in " + network.gas;
    $("cl-fact-pair").textContent = selectedPair().display;
  };
  const switchNetwork = async (provider, network = selectedNetwork()) => {
    const chainId = "0x" + network.id.toString(16);
    try { await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] }); }
    catch (error) {
      if (error?.code !== 4902) throw error;
      await provider.request({ method: "wallet_addEthereumChain", params: [{
        chainId, chainName: network.chain.name,
        nativeCurrency: network.chain.nativeCurrency,
        rpcUrls: network.chain.rpcUrls.default.http,
        blockExplorerUrls: [network.explorer],
      }] });
    }
    const active = await provider.request({ method: "eth_chainId" });
    if (Number.parseInt(active, 16) !== network.id) throw new Error("Wallet is not connected to " + network.chain.name + ".");
  };
  const connect = async () => {
    const provider = walletProvider();
    if (!provider) throw new Error("No EVM wallet detected. Open this website in a browser with MetaMask or another EVM wallet.");
    // Request account access first; only then ask the wallet to switch networks.
    // This avoids prompting a network change before the user has approved the site connection.
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new Error("No wallet account was selected.");
    connectedAddress = getAddress(accounts[0]);
    await switchNetwork(provider, selectedNetwork());
    activeProvider = provider;
    attachProviderListeners(provider);
    connectButton.textContent = "Connected " + shortAddress(connectedAddress);
    window.lucide?.createIcons?.();
    setStatus("Wallet connected: " + shortAddress(connectedAddress) + ". Review the form, then approve the confirmation in your wallet.", "success");
    return { provider, address: connectedAddress };
  };
  $("cl-pair").addEventListener("change", () => {
    $("cl-fact-pair").textContent = selectedPair().display;
  });
  $("cl-network").addEventListener("change", async () => {
    syncNetworkUI();
    if (!activeProvider || !connectedAddress) return;
    try {
      await switchNetwork(activeProvider, selectedNetwork());
      setStatus("Wallet is ready on " + selectedNetwork().chain.name + ".", "success");
    } catch (error) {
      connectedAddress = null;
      deployButton.disabled = true;
      connectButton.textContent = "Connect wallet";
      setStatus(error?.shortMessage || error?.message || "Failed to switch the wallet network.", "error");
    }
  });
  syncNetworkUI();
  const syncPreview = () => {
    const name = $("cl-name").value.trim();
    const symbol = $("cl-symbol").value.trim().replace(/^\$/, "").toUpperCase();
    $("cl-preview-name").textContent = name || "Your token name";
    $("cl-preview-symbol").textContent = symbol ? "$" + symbol : "$TICKER";
    $("cl-preview-description").textContent = $("cl-description").value.trim() || "Your token description will appear here.";
    const image = $("cl-image").value.trim();
    const avatar = $("cl-avatar");
    avatar.replaceChildren();
    let safeImage = "";
    try { const parsed = image.startsWith("ipfs://") ? new URL("https://gateway.pinata.cloud/ipfs/" + image.slice(7)) : new URL(image); if (parsed.protocol === "https:") safeImage = parsed.href; } catch { /* keep fallback */ }
    if (safeImage) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = safeImage;
      img.onerror = () => { avatar.textContent = "✦"; };
      avatar.appendChild(img);
    } else avatar.textContent = "✦";
  };
  ["cl-name", "cl-symbol", "cl-description", "cl-image"].forEach((id) => $(id).addEventListener("input", syncPreview));
  const feeSelect = $("cl-fee");
  const feePreview = $("cl-preview-fee");
  feeSelect.addEventListener("change", () => { feePreview.textContent = feeSelect.value + "% / " + feeSelect.value + "%"; });
  const burnSelect = $("cl-burn");
  const burnPreview = $("cl-preview-burn-share");
  const creatorSharePreview = $("cl-preview-creator-share");
  const syncTokenomicsPreview = () => {
    const burn = Number(burnSelect.value);
    burnPreview.textContent = burn + "%";
    creatorSharePreview.textContent = (100 - burn) + "%";
  };
  burnSelect.addEventListener("change", syncTokenomicsPreview);
  syncTokenomicsPreview();
  const logoFile = $("cl-logo-file");
  const uploadStatus = $("cl-upload-status");
  logoFile.addEventListener("change", async () => {
    const file = logoFile.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      uploadStatus.textContent = "Choose a PNG, JPG, WEBP, or GIF file up to 5 MB.";
      uploadStatus.dataset.state = "error"; logoFile.value = ""; return;
    }
    const endpoint = window.MUISYLE_LOGO_UPLOAD_ENDPOINT;
    if (!endpoint || !/^https:\/\//i.test(endpoint)) {
      uploadStatus.textContent = "Logo upload is not configured. Deploy the Cloudflare Worker and set its endpoint first.";
      uploadStatus.dataset.state = "error"; return;
    }
    uploadStatus.textContent = "Uploading logo to IPFS…"; uploadStatus.dataset.state = "pending";
    const data = new FormData(); data.append("file", file, file.name);
    try {
      const response = await fetch(endpoint, { method: "POST", body: data, headers: { "Accept": "application/json" } });
      const result = await response.json();
      if (!response.ok || !/^ipfs:\/\/[A-Za-z0-9]+$/.test(result.uri || "")) throw new Error(result.error || "Upload failed.");
      $("cl-image").value = result.uri; syncPreview();
      uploadStatus.textContent = "Logo saved to IPFS: " + result.uri; uploadStatus.dataset.state = "success";
    } catch (error) {
      uploadStatus.textContent = error.message || "Logo upload failed. Please try again."; uploadStatus.dataset.state = "error";
    }
  });

  $("cl-confirm").addEventListener("change", () => { deployButton.disabled = needsReconciliation || !connectedAddress || !$("cl-confirm").checked || busy; });
  connectButton.addEventListener("click", async () => {
    try { await connect(); deployButton.disabled = !$("cl-confirm").checked || busy; }
    catch (error) { setStatus(error?.shortMessage || error?.message || "Wallet connection failed.", "error"); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
      if (busy) return;
    const name = $("cl-name").value.trim();
    const symbol = $("cl-symbol").value.trim().replace(/^\$/, "").toUpperCase();
    const image = $("cl-image").value.trim();
    const description = $("cl-description").value.trim();
    const xUrl = $("cl-x").value.trim();
    const rewardRecipientInput = $("cl-reward-recipient").value.trim();
    const websiteUrl = $("cl-website").value.trim();
    if (!connectedAddress) {
      try { await connect(); } catch (error) { setStatus(error?.message || "Wallet connection failed.", "error"); return; }
    }
    if (!/^https:\/\//i.test(image) && !/^ipfs:\/\/[A-Za-z0-9]+$/i.test(image)) { setStatus("The logo must be a valid HTTPS URL or IPFS CID. Upload an image from your gallery or enter a URL.", "error"); return; }
    if (websiteUrl && !/^https:\/\//i.test(websiteUrl)) { setStatus("The project website must use a valid HTTPS URL.", "error"); return; }
    if (xUrl && !/^https:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(xUrl)) { setStatus("Enter a valid X/Twitter profile URL.", "error"); return; }
    let rewardRecipient = connectedAddress;
    if (rewardRecipientInput) { try { rewardRecipient = getAddress(rewardRecipientInput); } catch { setStatus("The fee/reward recipient wallet address is invalid. Enter a valid EVM 0x address.", "error"); return; } }
    if (!name || name.length > 40 || !/^[A-Z0-9]{2,12}$/.test(symbol)) { setStatus("A token name is required (maximum 40 characters). The symbol must be 2–12 characters using A–Z or numbers.", "error"); return; }
    if (!$("cl-confirm").checked) return;
    const provider = walletProvider();
    busy = true; deployButton.disabled = true; resultBox.hidden = true;
    let submittedTxHash = null;
    try {
      const network = selectedNetwork();
      await switchNetwork(provider, network);
      const account = getAddress((await provider.request({ method: "eth_accounts" }))[0]);
      if (account !== connectedAddress) throw new Error("The connected wallet account has changed. Reconnect your wallet to continue.");
      const publicClient = createPublicClient({ chain: network.chain, transport: http(network.rpcUrl) });
      const wallet = createWalletClient({ account, chain: network.chain, transport: custom(provider) });
      const clanker = new Clanker({ wallet, publicClient });
      setStatus("Checking configuration and preparing the Clanker v5 transaction…");
      const payload = {
        chainId: network.id, name, symbol, image, tokenAdmin: account,
        buyFee: Number($("cl-fee").value), sellFee: Number($("cl-fee").value), burn: Number($("cl-burn").value), antiSnipeEnabled: true,
        ...(selectedPair().token ? { pool: { pairedToken: selectedPair().token } } : {}),
        rewards: { recipients: [{ recipient: rewardRecipient, admin: account, bps: 10000 }] },
        metadata: { description, socialMediaUrls: [...(xUrl ? [{ platform: "x", url: xUrl }] : []), ...(websiteUrl ? [{ platform: "website", url: websiteUrl }] : [])] },
        context: { interface: "MUISYLE" },
      };
      const { txHash, waitForTransaction, error } = await clanker.deploy(payload);
      if (error) {
        if (String(error?.data?.rawName || "").toUpperCase() === "SEND_UNCERTAIN") {
          needsReconciliation = true;
          setStatus("The wallet or network could not confirm whether the transaction was sent. Do not retry yet. Check your wallet activity and the block explorer first; reconnect only after confirming no launch is pending.", "pending");
          return;
        }
        throw error;
      }
      if (!txHash || typeof waitForTransaction !== "function") throw new Error("The SDK did not return verifiable transaction details.");
      submittedTxHash = txHash;
      setStatus("Transaction submitted. Waiting for confirmation on " + network.chain.name + "…", "pending");
      const receipt = await waitForTransaction();
      if (receipt?.error) throw receipt.error;
      const rawTokenAddress = receipt?.address || receipt?.tokenAddress;
      let tokenAddress;
      try { tokenAddress = getAddress(rawTokenAddress); }
      catch { throw new Error("The transaction was confirmed, but the token address returned by the SDK is invalid. Check the transaction hash in the explorer."); }
      if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error("The SDK returned an invalid transaction hash. Check the transaction manually in the explorer.");
      let historySaved = false;
      let historyMessage = "Launch History is not configured yet; the token was still launched successfully.";
      if (LAUNCH_HISTORY_ENDPOINT) {
        try {
          const historyResponse = await fetch(LAUNCH_HISTORY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              chainId: network.id, network: network.chain.name, explorer: network.explorer,
              txHash, tokenAddress, deployer: account, name, symbol, image, description, websiteUrl, xUrl,
            }),
          });
          const historyData = await historyResponse.json();
          if (!historyResponse.ok || !historyData?.ok) throw new Error(historyData?.error || "History service rejected this launch.");
          historySaved = true;
          historyMessage = "The token has also been added to the public MUISYLE Launch History.";
        } catch (historyError) {
          console.warn("Launch History sync failed:", historyError);
          historyMessage = "The token was launched successfully, but saving it to Launch History failed. The transaction hash can still be verified in the explorer.";
        }
      }
      resultBox.hidden = false;
      const safeName = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
      resultBox.innerHTML = '<span class="kicker">DEPLOYMENT CONFIRMED</span><h2>' + safeName + ' ($' + symbol + ')</h2><p>Token was successfully created through Clanker v5 on ' + network.chain.name + '.</p><code>' + tokenAddress + '</code><div class="clanker-result-links"><a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="' + network.explorer + '/token/' + tokenAddress + '">View token <i data-lucide="external-link"></i></a><a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="' + network.explorer + '/tx/' + txHash + '">View transaction <i data-lucide="arrow-up-right"></i></a></div>';
      const historyNote = document.createElement("p");
      historyNote.className = "history-sync-note";
      historyNote.textContent = historyMessage;
      resultBox.appendChild(historyNote);
      window.lucide?.createIcons?.();
      setStatus(historySaved ? "Done. The launch is confirmed and listed in MUISYLE Launch History." : "Launch confirmed. " + historyMessage, "success");
    } catch (error) {
      console.error("Clanker deployment error:", error);
      if (submittedTxHash) {
        needsReconciliation = true;
        const safeHash = /^0x[0-9a-fA-F]{64}$/.test(submittedTxHash) ? submittedTxHash : "";
        resultBox.hidden = false;
        resultBox.innerHTML = '<span class="kicker">TRANSACTION SUBMITTED · CHECK STATUS</span><h2>Verification pending</h2><p>The transaction has been submitted, but the SDK cannot verify the launch result yet. Do not submit a second transaction before checking its status.</p>' + (safeHash ? '<a class="btn btn-secondary" target="_blank" rel="noreferrer" href="' + selectedNetwork().explorer + '/tx/' + safeHash + '">Check transaction on explorer</a>' : "");
        setStatus("The transaction has been submitted but is not yet verified. Do not deploy again before checking the transaction hash.", "pending");
      } else {
        setStatus(error?.shortMessage || error?.message || "Deployment failed before the transaction was submitted.", "error");
      }
    } finally { busy = false; deployButton.disabled = needsReconciliation || !connectedAddress || !$("cl-confirm").checked; }
  });
  attachProviderListeners(walletProvider());
  window.addEventListener("muisyle:privy-wallet-ready", () => {
    const provider = walletProvider();
    attachProviderListeners(provider);
  });
}
