import { Clanker } from "clanker-sdk/v5";
import { createPublicClient, createWalletClient, custom, defineChain, getAddress } from "viem";

const ELYSIUM_ID = 99901;
const ELYSIUM_RPC = "https://rpc.elysium.kinetiq.xyz";
const elysium = defineChain({
  id: ELYSIUM_ID,
  name: "Elysium",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: [ELYSIUM_RPC] } },
  blockExplorers: { default: { name: "Elyscan", url: "https://elyscan.live" } },
});
const $ = (id) => document.getElementById(id);
const form = $("clanker-form");
if (form) {
  const status = $("cl-status");
  const deployButton = $("cl-deploy");
  const connectButton = $("cl-connect");
  const resultBox = $("cl-result");
  let connectedAddress = null;
  let busy = false;
  const setStatus = (message, type = "") => { status.textContent = message; status.dataset.state = type; };
  const shortAddress = (address) => address ? address.slice(0, 6) + "…" + address.slice(-4) : "";
  const walletProvider = () => window.ethereum?.providers?.length
    ? (window.ethereum.providers.find((provider) => provider.isMetaMask) || window.ethereum.providers[0])
    : window.ethereum;
  const switchNetwork = async (provider) => {
    const chainId = "0x" + ELYSIUM_ID.toString(16);
    try { await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] }); }
    catch (error) {
      if (error?.code !== 4902) throw error;
      await provider.request({ method: "wallet_addEthereumChain", params: [{
        chainId, chainName: "Elysium Mainnet",
        nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
        rpcUrls: [ELYSIUM_RPC], blockExplorerUrls: ["https://elyscan.live"],
      }] });
    }
    const active = await provider.request({ method: "eth_chainId" });
    if (Number.parseInt(active, 16) !== ELYSIUM_ID) throw new Error("Wallet belum berada di Elysium Mainnet.");
  };
  const connect = async () => {
    const provider = walletProvider();
    if (!provider) throw new Error("Wallet EVM tidak ditemukan. Buka website melalui browser yang memiliki MetaMask atau wallet EVM.");
    await switchNetwork(provider);
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new Error("Tidak ada akun wallet yang dipilih.");
    connectedAddress = getAddress(accounts[0]);
    connectButton.textContent = "Connected " + shortAddress(connectedAddress);
    window.lucide?.createIcons?.();
    setStatus("Wallet terhubung: " + shortAddress(connectedAddress) + ". Periksa formulir lalu setujui konfirmasi di wallet.", "success");
    return { provider, address: connectedAddress };
  };
  const syncPreview = () => {
    const name = $("cl-name").value.trim();
    const symbol = $("cl-symbol").value.trim().replace(/^\$/, "").toUpperCase();
    $("cl-preview-name").textContent = name || "Your token name";
    $("cl-preview-symbol").textContent = symbol ? "$" + symbol : "$TICKER";
    $("cl-preview-description").textContent = $("cl-description").value.trim() || "Your token description will appear here.";
    const image = $("cl-image").value.trim();
    $("cl-avatar").innerHTML = image && /^https:\/\//i.test(image) ? '<img alt="" src="' + image.replaceAll('"', "&quot;") + '">' : "✦";
  };
  ["cl-name", "cl-symbol", "cl-description", "cl-image"].forEach((id) => $(id).addEventListener("input", syncPreview));
  $("cl-confirm").addEventListener("change", () => { deployButton.disabled = !connectedAddress || !$("cl-confirm").checked || busy; });
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
    if (!connectedAddress) {
      try { await connect(); } catch (error) { setStatus(error?.message || "Wallet connection failed.", "error"); return; }
    }
    if (!/^https:\/\//i.test(image) && !/^ipfs:\/\//i.test(image)) { setStatus("Logo harus berupa URL HTTPS atau URI IPFS yang valid.", "error"); return; }
    if (xUrl && !/^https:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(xUrl)) { setStatus("Masukkan URL profil atau akun X/Twitter yang valid.", "error"); return; }
    if (!name || !/^[A-Z0-9]{2,12}$/.test(symbol)) { setStatus("Nama token wajib diisi. Simbol harus 2–12 karakter A–Z atau angka.", "error"); return; }
    if (!$("cl-confirm").checked) return;
    const provider = walletProvider();
    busy = true; deployButton.disabled = true; resultBox.hidden = true;
    try {
      await switchNetwork(provider);
      const account = getAddress((await provider.request({ method: "eth_accounts" }))[0]);
      if (account !== connectedAddress) throw new Error("Akun wallet berubah. Hubungkan ulang wallet sebelum melanjutkan.");
      const publicClient = createPublicClient({ chain: elysium, transport: custom(provider) });
      const wallet = createWalletClient({ account, chain: elysium, transport: custom(provider) });
      const clanker = new Clanker({ wallet, publicClient });
      setStatus("Memeriksa konfigurasi dan menyiapkan transaksi Clanker v5…");
      const payload = {
        chainId: ELYSIUM_ID, name, symbol, image, tokenAdmin: account,
        buyFee: 1, sellFee: 1, antiSnipeEnabled: true,
        metadata: { description, socialMediaUrls: xUrl ? [{ platform: "twitter", url: xUrl }] : [] },
        context: { interface: "MUISYLE", platform: "https://memeelysium.github.io/" },
      };
      const { txHash, waitForTransaction, error } = await clanker.deploy(payload);
      if (error) throw error;
      if (!txHash || typeof waitForTransaction !== "function") throw new Error("SDK tidak mengembalikan detail transaksi yang dapat diverifikasi.");
      setStatus("Transaksi dikirim. Menunggu konfirmasi jaringan Elysium…", "pending");
      const receipt = await waitForTransaction();
      if (receipt?.error) throw receipt.error;
      const tokenAddress = receipt?.address || receipt?.tokenAddress;
      if (!tokenAddress) throw new Error("Transaksi terkonfirmasi, tetapi alamat token tidak ditemukan pada respons SDK. Periksa hash transaksi di explorer.");
      resultBox.hidden = false;
      resultBox.innerHTML = '<span class="kicker">DEPLOYMENT CONFIRMED</span><h2>' + name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;") + ' ($' + symbol + ')</h2><p>Token berhasil dibuat melalui Clanker v5 di Elysium Mainnet.</p><code>' + tokenAddress + '</code><div class="clanker-result-links"><a class="btn btn-primary" target="_blank" rel="noreferrer" href="https://elyscan.live/token/' + tokenAddress + '">View token <i data-lucide="external-link"></i></a><a class="btn btn-secondary" target="_blank" rel="noreferrer" href="https://elyscan.live/tx/' + txHash + '">View transaction <i data-lucide="arrow-up-right"></i></a></div>';
      window.lucide?.createIcons?.();
      setStatus("Selesai. Konfirmasi deployment berhasil diterima dari SDK.", "success");
    } catch (error) {
      console.error("Clanker deployment error:", error);
      setStatus(error?.shortMessage || error?.message || "Deployment gagal. Tidak ada klaim token berhasil dibuat.", "error");
    } finally { busy = false; deployButton.disabled = !connectedAddress || !$("cl-confirm").checked; }
  });
  if (window.ethereum) {
    window.ethereum.on?.("accountsChanged", (accounts) => {
      connectedAddress = accounts?.[0] ? getAddress(accounts[0]) : null;
      deployButton.disabled = !connectedAddress || !$("cl-confirm").checked || busy;
      connectButton.textContent = connectedAddress ? "Connected " + shortAddress(connectedAddress) : "Connect wallet";
      setStatus(connectedAddress ? "Akun wallet diperbarui." : "Wallet terputus. Hubungkan kembali untuk melanjutkan.");
    });
    window.ethereum.on?.("chainChanged", () => {
      connectedAddress = null; deployButton.disabled = true; connectButton.textContent = "Reconnect wallet";
      setStatus("Jaringan wallet berubah. Hubungkan ulang ke Elysium Mainnet.");
    });
  }
}
