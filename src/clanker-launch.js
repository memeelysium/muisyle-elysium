import { Clanker } from "clanker-sdk/v5";
import { createPublicClient, createWalletClient, custom, defineChain, getAddress } from "viem";
import { base } from "viem/chains";

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
  elysium: { id: ELYSIUM_ID, chain: elysium, title: "ELYSIUM MAINNET", detail: "Chain ID 99901 · Gas token HYPE · Clanker v5", gas: "HYPE", explorer: "https://elyscan.live", label: "Elysium · 99901" },
  base: { id: base.id, chain: base, title: "BASE MAINNET", detail: "Chain ID 8453 · Gas token ETH · Clanker v5", gas: "ETH", explorer: "https://basescan.org", label: "Base · 8453" },
  robinhood: { id: ROBINHOOD_ID, chain: robinhood, title: "ROBINHOOD CHAIN", detail: "Chain ID 4663 · Gas token ETH · Clanker v5", gas: "ETH", explorer: "https://robinhoodchain.blockscout.com", label: "Robinhood · 4663" },
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
  const walletProvider = () => window.ethereum?.providers?.length
    ? (window.ethereum.providers.find((provider) => provider.isMetaMask) || window.ethereum.providers[0])
    : window.ethereum;
  const selectedNetwork = () => NETWORKS[$("cl-network").value] || NETWORKS.elysium;
  const syncNetworkUI = () => {
    const network = selectedNetwork();
    $("cl-network-title").textContent = network.title;
    $("cl-network-details").textContent = network.detail;
    $("cl-network-explorer").href = network.explorer;
    $("cl-preview-network").textContent = network.title + " · CLANKER V5";
    $("cl-fact-network").textContent = network.label;
    $("cl-fact-gas").textContent = "Paid in " + network.gas;
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
    if (Number.parseInt(active, 16) !== network.id) throw new Error("Wallet belum berada di " + network.chain.name + ".");
  };
  const connect = async () => {
    const provider = walletProvider();
    if (!provider) throw new Error("Wallet EVM tidak ditemukan. Buka website melalui browser yang memiliki MetaMask atau wallet EVM.");
    // Request account access first; only then ask the wallet to switch networks.
    // This avoids prompting a network change before the user has approved the site connection.
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new Error("Tidak ada akun wallet yang dipilih.");
    connectedAddress = getAddress(accounts[0]);
    await switchNetwork(provider, selectedNetwork());
    activeProvider = provider;
    connectButton.textContent = "Connected " + shortAddress(connectedAddress);
    window.lucide?.createIcons?.();
    setStatus("Wallet terhubung: " + shortAddress(connectedAddress) + ". Periksa formulir lalu setujui konfirmasi di wallet.", "success");
    return { provider, address: connectedAddress };
  };
  $("cl-network").addEventListener("change", async () => {
    syncNetworkUI();
    if (!activeProvider || !connectedAddress) return;
    try {
      await switchNetwork(activeProvider, selectedNetwork());
      setStatus("Wallet siap di " + selectedNetwork().chain.name + ".", "success");
    } catch (error) {
      connectedAddress = null;
      deployButton.disabled = true;
      connectButton.textContent = "Connect wallet";
      setStatus(error?.shortMessage || error?.message || "Gagal mengganti jaringan wallet.", "error");
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
      uploadStatus.textContent = "Pilih PNG, JPG, WEBP atau GIF dengan ukuran maksimal 5 MB.";
      uploadStatus.dataset.state = "error"; logoFile.value = ""; return;
    }
    const endpoint = window.MUISYLE_LOGO_UPLOAD_ENDPOINT;
    if (!endpoint || !/^https:\/\//i.test(endpoint)) {
      uploadStatus.textContent = "Upload belum dikonfigurasi. Worker Cloudflare harus dipublikasikan dan endpoint diatur terlebih dahulu.";
      uploadStatus.dataset.state = "error"; return;
    }
    uploadStatus.textContent = "Mengunggah logo ke IPFS…"; uploadStatus.dataset.state = "pending";
    const data = new FormData(); data.append("file", file, file.name);
    try {
      const response = await fetch(endpoint, { method: "POST", body: data, headers: { "Accept": "application/json" } });
      const result = await response.json();
      if (!response.ok || !/^ipfs:\/\/[A-Za-z0-9]+$/.test(result.uri || "")) throw new Error(result.error || "Upload gagal.");
      $("cl-image").value = result.uri; syncPreview();
      uploadStatus.textContent = "Logo tersimpan di IPFS: " + result.uri; uploadStatus.dataset.state = "success";
    } catch (error) {
      uploadStatus.textContent = error.message || "Gagal mengunggah logo. Coba lagi."; uploadStatus.dataset.state = "error";
    }
  });

  $("cl-confirm").addEventListener("change", () => { deployButton.disabled = needsReconciliation || !connectedAddress || !$("cl-confirm").checked || busy; });
  connectButton.addEventListener("click", async () => {
    try { await connect(); deployButton.disabled = !$("cl-confirm").checked || busy; }
    catch (error) { setStatus(error?.shortMessage || error?.message || "Wallet connection failed.", "error"); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if ($("cl-platform")?.value === "montra") return;
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
    if (!/^https:\/\//i.test(image) && !/^ipfs:\/\/[A-Za-z0-9]+$/i.test(image)) { setStatus("Logo harus berupa URL HTTPS atau CID IPFS yang valid. Unggah logo melalui galeri atau masukkan URL.", "error"); return; }
    if (websiteUrl && !/^https:\/\//i.test(websiteUrl)) { setStatus("Website proyek harus menggunakan URL HTTPS yang valid.", "error"); return; }
    if (xUrl && !/^https:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(xUrl)) { setStatus("Masukkan URL profil atau akun X/Twitter yang valid.", "error"); return; }
    let rewardRecipient = connectedAddress;
    if (rewardRecipientInput) { try { rewardRecipient = getAddress(rewardRecipientInput); } catch { setStatus("Alamat wallet penerima fee/reward tidak valid. Gunakan alamat EVM 0x yang benar.", "error"); return; } }
    if (!name || !/^[A-Z0-9]{2,12}$/.test(symbol)) { setStatus("Nama token wajib diisi. Simbol harus 2–12 karakter A–Z atau angka.", "error"); return; }
    if (!$("cl-confirm").checked) return;
    const provider = walletProvider();
    busy = true; deployButton.disabled = true; resultBox.hidden = true;
    let submittedTxHash = null;
    try {
      const network = selectedNetwork();
      await switchNetwork(provider, network);
      const account = getAddress((await provider.request({ method: "eth_accounts" }))[0]);
      if (account !== connectedAddress) throw new Error("Akun wallet berubah. Hubungkan ulang wallet sebelum melanjutkan.");
      const publicClient = createPublicClient({ chain: network.chain, transport: custom(provider) });
      const wallet = createWalletClient({ account, chain: network.chain, transport: custom(provider) });
      const clanker = new Clanker({ wallet, publicClient });
      setStatus("Memeriksa konfigurasi dan menyiapkan transaksi Clanker v5…");
      const payload = {
        chainId: network.id, name, symbol, image, tokenAdmin: account,
        buyFee: Number($("cl-fee").value), sellFee: Number($("cl-fee").value), burn: Number($("cl-burn").value), antiSnipeEnabled: true,
        rewards: { recipients: [{ recipient: rewardRecipient, admin: account, bps: 10000 }] },
        metadata: { description, socialMediaUrls: [...(xUrl ? [{ platform: "x", url: xUrl }] : []), ...(websiteUrl ? [{ platform: "website", url: websiteUrl }] : [])] },
        context: { interface: "MUISYLE" },
      };
      const { txHash, waitForTransaction, error } = await clanker.deploy(payload);
      if (error) {
        if (error?.data?.rawName === "SendUncertain") {
          needsReconciliation = true;
          setStatus("Pengiriman transaksi belum dapat dipastikan. Periksa transaksi pending di wallet sebelum mencoba deploy lagi.", "pending");
          return;
        }
        throw error;
      }
      if (!txHash || typeof waitForTransaction !== "function") throw new Error("SDK tidak mengembalikan detail transaksi yang dapat diverifikasi.");
      submittedTxHash = txHash;
      setStatus("Transaksi dikirim. Menunggu konfirmasi jaringan " + network.chain.name + "…", "pending");
      const receipt = await waitForTransaction();
      if (receipt?.error) throw receipt.error;
      const rawTokenAddress = receipt?.address || receipt?.tokenAddress;
      let tokenAddress;
      try { tokenAddress = getAddress(rawTokenAddress); }
      catch { throw new Error("Transaksi terkonfirmasi, tetapi alamat token dari SDK tidak valid. Periksa hash transaksi di explorer."); }
      if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error("SDK mengembalikan hash transaksi yang tidak valid. Periksa transaksi secara manual di explorer.");
      resultBox.hidden = false;
      const safeName = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
      resultBox.innerHTML = '<span class="kicker">DEPLOYMENT CONFIRMED</span><h2>' + safeName + ' ($' + symbol + ')</h2><p>Token berhasil dibuat melalui Clanker v5 di ' + network.chain.name + '.</p><code>' + tokenAddress + '</code><div class="clanker-result-links"><a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="' + network.explorer + '/token/' + tokenAddress + '">View token <i data-lucide="external-link"></i></a><a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="' + network.explorer + '/tx/' + txHash + '">View transaction <i data-lucide="arrow-up-right"></i></a></div>';
      window.lucide?.createIcons?.();
      setStatus("Selesai. Konfirmasi deployment berhasil diterima dari SDK.", "success");
    } catch (error) {
      console.error("Clanker deployment error:", error);
      if (submittedTxHash) {
        needsReconciliation = true;
        const safeHash = /^0x[0-9a-fA-F]{64}$/.test(submittedTxHash) ? submittedTxHash : "";
        resultBox.hidden = false;
        resultBox.innerHTML = '<span class="kicker">TRANSACTION SUBMITTED · CHECK STATUS</span><h2>Verification pending</h2><p>Transaksi sudah dikirim, tetapi SDK belum dapat memverifikasi hasil launch. Jangan kirim transaksi kedua sebelum memeriksa statusnya.</p>' + (safeHash ? '<a class="btn btn-secondary" target="_blank" rel="noreferrer" href="' + selectedNetwork().explorer + '/tx/' + safeHash + '">Check transaction on explorer</a>' : "");
        setStatus("Transaksi sudah dikirim tetapi belum terverifikasi. Jangan deploy ulang sebelum memeriksa hash transaksi.", "pending");
      } else {
        setStatus(error?.shortMessage || error?.message || "Deployment gagal sebelum transaksi dikirim.", "error");
      }
    } finally { busy = false; deployButton.disabled = needsReconciliation || !connectedAddress || !$("cl-confirm").checked; }
  });
  const eventProvider = activeProvider || walletProvider();
  if (eventProvider) {
    eventProvider.on?.("accountsChanged", (accounts) => {
      connectedAddress = accounts?.[0] ? getAddress(accounts[0]) : null;
      deployButton.disabled = !connectedAddress || !$("cl-confirm").checked || busy;
      connectButton.textContent = connectedAddress ? "Connected " + shortAddress(connectedAddress) : "Connect wallet";
      setStatus(connectedAddress ? "Akun wallet diperbarui." : "Wallet terputus. Hubungkan kembali untuk melanjutkan.");
    });
    eventProvider.on?.("chainChanged", (chainId) => {
      const activeChainId = Number.parseInt(chainId, 16);
      if (activeChainId === selectedNetwork().id) {
        deployButton.disabled = needsReconciliation || !connectedAddress || !$("cl-confirm").checked || busy;
        setStatus("Wallet terhubung ke " + selectedNetwork().chain.name + ".", "success");
        return;
      }
      connectedAddress = null;
      deployButton.disabled = true;
      connectButton.textContent = "Reconnect wallet";
      setStatus("Jaringan wallet berubah. Hubungkan ulang ke " + selectedNetwork().chain.name + ".");
    });
  }
}
