import {
  createPublicClient, createWalletClient, custom, defineChain, getAddress,
  stringToHex, zeroAddress, zeroHash, http, parseEventLogs, formatUnits,
} from "viem";

const ELYSIUM_ID = 99901;
const ELYSIUM_RPC = "https://rpc.montraxyz.com";
const MONTRA_REGISTRY = "0xF1E2FA75422F889e565F3142bdbf60B28dce2aa7";
const ZERO = zeroAddress;
const elysium = defineChain({
  id: ELYSIUM_ID,
  name: "Elysium Mainnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: [ELYSIUM_RPC] } },
  blockExplorers: { default: { name: "Elyscan", url: "https://elyscan.live" } },
});

const registryAbi = [{
  type: "function", name: "get", stateMutability: "view",
  inputs: [{ name: "key", type: "bytes32" }],
  outputs: [{ name: "", type: "address" }],
}];

const configComponents = [
  ["moduleSetId","uint256"], ["quote","address"], ["baseSupply","uint256"],
  ["tickSpacing","int24"], ["startTick","int24"], ["graduationTicks","uint24"],
  ["lpLineTicks","uint24"], ["totalFeePips","uint24"], ["totalFeeMinPips","uint24"],
  ["protocolFeePips","uint24"], ["lpFeePips","uint24"], ["earlyBuyFeeStartPips","uint24"],
  ["earlyBuyFeeWindow","uint32"], ["liquidityPolicy","address"], ["liquiditySealed","bool"],
  ["streamDuration","uint32"], ["pushBountyBps","uint16"], ["pushFloor","uint128"],
  ["enabled","bool"], ["exists","bool"],
].map(([name,type]) => ({ name, type }));

const profileComponents = [
  { name: "logo", type: "string" },
  { name: "description", type: "string" },
  { name: "socials", type: "tuple", components: [
    { name: "telegram", type: "string" }, { name: "twitter", type: "string" },
    { name: "discord", type: "string" }, { name: "website", type: "string" },
    { name: "extra", type: "string" },
  ] },
];
const permitComponents = [
  { name: "deadline", type: "uint256" }, { name: "v", type: "uint8" },
  { name: "r", type: "bytes32" }, { name: "s", type: "bytes32" },
];
const launchComponents = [
  { name: "name", type: "string" }, { name: "symbol", type: "string" },
  { name: "metadataURI", type: "string" },
  { name: "profile", type: "tuple", components: profileComponents },
  { name: "configId", type: "uint256" }, { name: "supply", type: "uint256" },
  { name: "salt", type: "bytes32" }, { name: "feeRecipients", type: "address[]" },
  { name: "feeShares", type: "uint16[]" }, { name: "firstBuyAmount", type: "uint256" },
  { name: "firstBuyMinOut", type: "uint256" },
  { name: "permit", type: "tuple", components: permitComponents },
];
const factoryAbi = [
  { type: "function", name: "configCount", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "getConfig", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ name: "cfg", type: "tuple", components: configComponents }] },
  { type: "function", name: "launchFee", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "launchEnabled", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "launch", stateMutability: "payable", inputs: [{ name: "p", type: "tuple", components: launchComponents }], outputs: [{ name: "token", type: "address" }, { name: "poolId", type: "bytes32" }] },
  { type: "event", name: "TokenLaunched", anonymous: false, inputs: [
    { name: "token", type: "address", indexed: true }, { name: "creator", type: "address", indexed: true },
    { name: "poolId", type: "bytes32", indexed: true }, { name: "configId", type: "uint256", indexed: false },
    { name: "quote", type: "address", indexed: false }, { name: "quoteIsCurrency0", type: "bool", indexed: false },
    { name: "supply", type: "uint256", indexed: false }, { name: "startTick", type: "int24", indexed: false },
    { name: "feeRecipient", type: "address", indexed: false }, { name: "feeLocked", type: "bool", indexed: false },
    { name: "firstBuyIn", type: "uint256", indexed: false }, { name: "firstBuyOut", type: "uint256", indexed: false },
  ] },
];

const $ = (id) => document.getElementById(id);
const form = $("clanker-form");
if (form && $("cl-platform")) {
  const platform = $("cl-platform");
  const status = $("cl-status");
  const deployButton = $("cl-deploy");
  const connectButton = $("cl-connect");
  const resultBox = $("cl-result");
  const montraSettings = $("montra-settings");
  const montraPreview = $("montra-preview-card");
  const clankerPreview = $("clanker-preview-card");
  const clankerFacts = $("clanker-facts");
  const networkField = $("cl-network-field");
  let montraRows = [];
  let montraFactory = null;
  let loadingRows = false;
  let deploying = false;

  const setStatus = (message, type = "") => { status.textContent = message; status.dataset.state = type; };
  const walletProvider = () => window.ethereum?.providers?.length
    ? (window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum.providers[0])
    : window.ethereum;
  const switchToElysium = async (provider) => {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + ELYSIUM_ID.toString(16) }] });
    } catch (error) {
      if (error?.code !== 4902) throw error;
      await provider.request({ method: "wallet_addEthereumChain", params: [{
        chainId: "0x" + ELYSIUM_ID.toString(16), chainName: elysium.name,
        nativeCurrency: elysium.nativeCurrency, rpcUrls: [ELYSIUM_RPC],
        blockExplorerUrls: ["https://elyscan.live"],
      }] });
    }
    const active = await provider.request({ method: "eth_chainId" });
    if (Number.parseInt(active, 16) !== ELYSIUM_ID) throw new Error("Wallet harus berada di Elysium Mainnet.");
  };
  const safeUrl = (value, label) => {
    if (!value) return "";
    let parsed;
    try { parsed = new URL(value); } catch { throw new Error(label + " harus berupa URL HTTPS yang valid."); }
    if (parsed.protocol !== "https:") throw new Error(label + " harus menggunakan HTTPS.");
    return parsed.href;
  };
  const formatSupply = (value) => Number(value).toLocaleString("en-US");
  const syncMontraPreview = () => {
    const name = $("cl-name").value.trim();
    const symbol = $("cl-symbol").value.trim().replace(/^\$/, "").toUpperCase();
    $("montra-preview-name").textContent = name || "Your token name";
    $("montra-preview-symbol").textContent = symbol ? "$" + symbol : "$TICKER";
    $("montra-preview-description").textContent = $("cl-montra-description").value.trim() || "Your token description will appear here.";
    const supply = $("cl-montra-supply").value;
    $("montra-preview-supply").textContent = supply && Number.isSafeInteger(Number(supply)) ? formatSupply(supply) : "—";
    const image = $("cl-image").value.trim();
    const avatar = $("montra-avatar");
    avatar.replaceChildren();
    let safeImage = "";
    try {
      const parsed = image.startsWith("ipfs://") ? new URL("https://ipfs.filebase.io/ipfs/" + image.slice(7)) : new URL(image);
      if (parsed.protocol === "https:") safeImage = parsed.href;
    } catch { /* fallback icon */ }
    if (safeImage) {
      const img = document.createElement("img");
      img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.src = safeImage;
      img.onerror = () => { avatar.textContent = "✦"; };
      avatar.appendChild(img);
    } else avatar.textContent = "✦";
    const selected = montraRows.find((row) => String(row.id) === $("cl-montra-config").value);
    $("montra-preview-fee").textContent = selected ? selected.fee + "%" : "—";
  };
  const setPlatform = () => {
    const isMontra = platform.value === "montra";
    montraSettings.hidden = !isMontra;
    montraPreview.hidden = !isMontra;
    clankerPreview.hidden = isMontra;
    clankerFacts.hidden = isMontra;
    networkField.hidden = isMontra;
    form.querySelector(".clanker-advanced").hidden = isMontra;
    form.querySelector(".clanker-form-head .clanker-version").textContent = isMontra ? "MONTRA LAUNCHPAD" : "POWERED BY CLANKER V5";
    if (isMontra) {
      $("cl-network").value = "elysium";
      $("cl-network").dispatchEvent(new Event("change"));
      $("cl-network-title").textContent = "ELYSIUM MAINNET";
      $("cl-network-details").textContent = "Chain ID 99901 · Gas token HYPE · MONTRA";
      $("cl-network-explorer").href = "https://elyscan.live/";
      setStatus("MONTRA dipilih. Fee tiers sedang dibaca langsung dari kontrak resmi.", "pending");
      loadMontraRows();
    } else {
      setStatus("Clanker V5 dipilih. Pengaturan Clanker tersedia seperti biasa.");
    }
    syncMontraPreview();
  };

  async function loadMontraRows() {
    if (loadingRows || montraRows.length) return;
    loadingRows = true;
    const client = createPublicClient({ chain: elysium, transport: http(ELYSIUM_RPC) });
    try {
      const registry = MONTRA_REGISTRY;
      montraFactory = await client.readContract({
        address: registry, abi: registryAbi, functionName: "get",
        args: [stringToHex("factory", { size: 32 })],
      });
      if (!montraFactory || montraFactory.toLowerCase() === ZERO) throw new Error("Alamat LaunchFactory tidak ditemukan pada registry MONTRA.");
      const [count, enabled, launchFee] = await Promise.all([
        client.readContract({ address: montraFactory, abi: factoryAbi, functionName: "configCount" }),
        client.readContract({ address: montraFactory, abi: factoryAbi, functionName: "launchEnabled" }),
        client.readContract({ address: montraFactory, abi: factoryAbi, functionName: "launchFee" }),
      ]);
      if (!enabled) throw new Error("MONTRA sedang menonaktifkan peluncuran token.");
      const rows = await Promise.all(Array.from({ length: Number(count) }, (_, id) =>
        client.readContract({ address: montraFactory, abi: factoryAbi, functionName: "getConfig", args: [BigInt(id)] })
          .then((cfg) => ({ id, ...cfg }))
      ));
      montraRows = rows.filter((row) => row.exists && row.enabled && row.quote.toLowerCase() === ZERO.toLowerCase())
        .map((row) => ({ ...row, fee: Number(row.totalFeePips) / 10000 }))
        .sort((a,b) => a.fee - b.fee);
      const select = $("cl-montra-config");
      select.replaceChildren();
      if (!montraRows.length) throw new Error("Tidak ada fee tier HYPE yang aktif di MONTRA saat ini.");
      for (const row of montraRows) {
        const option = document.createElement("option");
        option.value = String(row.id);
        option.textContent = row.fee + "% · HYPE";
        select.appendChild(option);
      }
      const defaultRow = montraRows.find((row) => row.fee === 1) || montraRows[0];
      select.value = String(defaultRow.id);
      $("cl-montra-supply").value = String(defaultRow.baseSupply / 10n ** 18n);
      syncMontraPreview();
      $("cl-montra-launch-fee").textContent = formatUnits(launchFee, 18) + " HYPE";
      setStatus("MONTRA siap. Fee tiers dan biaya launch dibaca langsung dari kontrak Elysium.", "success");
    } catch (error) {
      $("cl-montra-config").replaceChildren(new Option("Fee tier tidak tersedia", ""));
      setStatus(error?.shortMessage || error?.message || "Gagal membaca konfigurasi MONTRA.", "error");
    } finally { loadingRows = false; }
  }

  platform.addEventListener("change", setPlatform);
  $("cl-montra-config").addEventListener("change", () => {
    const row = montraRows.find((item) => String(item.id) === $("cl-montra-config").value);
    if (row) $("cl-montra-supply").value = String(row.baseSupply / 10n ** 18n);
    syncMontraPreview();
  });
  ["cl-name","cl-symbol","cl-image","cl-montra-description","cl-montra-supply"].forEach((id) => $(id).addEventListener("input", syncMontraPreview));
  $("cl-image").addEventListener("change", syncMontraPreview);

  form.addEventListener("submit", async (event) => {
    if (platform.value !== "montra") return;
    event.preventDefault();
    if (deploying) return;
    const name = $("cl-name").value.trim();
    const symbol = $("cl-symbol").value.trim().replace(/^\$/, "").toUpperCase();
    const image = $("cl-image").value.trim();
    const description = $("cl-montra-description").value.trim();
    let website = "", twitter = "";
    try {
      website = safeUrl($("cl-montra-website").value.trim(), "Website");
      twitter = safeUrl($("cl-montra-x").value.trim(), "X/Twitter");
    } catch (error) { setStatus(error.message, "error"); return; }
    const supplyText = $("cl-montra-supply").value.trim();
    const selected = montraRows.find((row) => String(row.id) === $("cl-montra-config").value);
    if (!montraFactory || !selected) { setStatus("Fee tier MONTRA belum siap. Coba pilih platform MONTRA kembali.", "error"); return; }
    if (!name || name.length > 48) { setStatus("Nama token wajib diisi (maksimal 48 karakter).", "error"); return; }
    if (!/^[A-Z0-9]{2,16}$/.test(symbol)) { setStatus("Simbol harus 2–16 karakter A–Z atau angka.", "error"); return; }
    if (!/^https:\/\//i.test(image) && !/^ipfs:\/\/[A-Za-z0-9]+$/i.test(image)) { setStatus("Logo harus berupa URL HTTPS atau CID IPFS yang valid.", "error"); return; }
    if ($("cl-upload-status").dataset.state === "pending") { setStatus("Tunggu proses upload logo selesai terlebih dahulu.", "pending"); return; }
    if (!/^\d+$/.test(supplyText)) { setStatus("Supply harus berupa bilangan bulat.", "error"); return; }
    const supplyWhole = BigInt(supplyText);
    if (supplyWhole < 1000000000n || supplyWhole > 1000000000000000n) { setStatus("Supply MONTRA harus antara 1 miliar dan 1 kuadriliun.", "error"); return; }
    if (!$("cl-confirm").checked) { setStatus("Centang konfirmasi sebelum melanjutkan.", "error"); return; }
    let recipient = "";
    const recipientInput = $("cl-montra-recipient").value.trim();
    if (recipientInput) {
      try { recipient = getAddress(recipientInput); }
      catch { setStatus("Alamat penerima fee tidak valid. Masukkan alamat EVM 0x yang benar.", "error"); return; }
    }
    const provider = walletProvider();
    if (!provider) { setStatus("Wallet EVM tidak ditemukan. Buka website melalui browser wallet.", "error"); return; }

    deploying = true; deployButton.disabled = true; resultBox.hidden = true;
    let txHash = null;
    try {
      setStatus("Menghubungkan wallet dan memeriksa jaringan Elysium…", "pending");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts?.[0]) throw new Error("Tidak ada akun wallet yang dipilih.");
      const account = getAddress(accounts[0]);
      await switchToElysium(provider);
      const publicClient = createPublicClient({ chain: elysium, transport: http(ELYSIUM_RPC) });
      const wallet = createWalletClient({ account, chain: elysium, transport: custom(provider) });

      setStatus("Mengunggah metadata token ke layanan MONTRA…", "pending");
      const metadataBody = {
        name, symbol, description, image,
        attributes: [
          { trait_type: "launch_provider", value: "montra" },
          { trait_type: "chain", value: "elysium" },
        ],
        ...(website ? { website, external_url: website } : {}),
        ...(twitter ? { twitter } : {}),
      };
      const metadataResponse = await fetch("https://api.montraxyz.com/api/metadata", {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(metadataBody),
      });
      const metadataResult = await metadataResponse.json();
      if (!metadataResponse.ok || !metadataResult.uri) throw new Error(metadataResult.error || "MONTRA gagal menyimpan metadata token.");
      if (!/^(ipfs:\/\/|https:\/\/)/i.test(metadataResult.uri)) throw new Error("MONTRA mengembalikan metadata URI yang tidak valid.");

      const launchFee = await publicClient.readContract({ address: montraFactory, abi: factoryAbi, functionName: "launchFee" });
      $("cl-montra-launch-fee").textContent = formatUnits(launchFee, 18) + " HYPE";
      const launchEnabled = await publicClient.readContract({ address: montraFactory, abi: factoryAbi, functionName: "launchEnabled" });
      if (!launchEnabled) throw new Error("MONTRA menonaktifkan peluncuran sebelum transaksi dikirim.");
      const liveRow = await publicClient.readContract({ address: montraFactory, abi: factoryAbi, functionName: "getConfig", args: [BigInt(selected.id)] });
      if (!liveRow.enabled || !liveRow.exists || liveRow.quote.toLowerCase() !== ZERO.toLowerCase()) throw new Error("Fee tier yang dipilih sudah tidak aktif. Muat ulang pilihan tier.");
      const params = {
        name, symbol, metadataURI: metadataResult.uri,
        profile: {
          logo: image, description,
          socials: { telegram: "", twitter, discord: "", website, extra: "" },
        },
        configId: BigInt(selected.id),
        supply: supplyWhole * 10n ** 18n,
        salt: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map((v) => v.toString(16).padStart(2, "0")).join(""),
        feeRecipients: recipient ? [recipient] : [],
        feeShares: recipient ? [10000] : [],
        firstBuyAmount: 0n, firstBuyMinOut: 0n,
        permit: { deadline: 0n, v: 0, r: zeroHash, s: zeroHash },
      };
      const value = launchFee;
      setStatus("Mensimulasikan peluncuran MONTRA. Periksa detail transaksi di wallet sebelum menyetujui…", "pending");
      const { request } = await publicClient.simulateContract({
        account, address: montraFactory, abi: factoryAbi, functionName: "launch",
        args: [params], value,
      });
      txHash = await wallet.writeContract(request);
      setStatus("Transaksi MONTRA terkirim. Menunggu konfirmasi Elysium…", "pending");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Transaksi gagal. Periksa hash di Elyscan sebelum mencoba kembali.");
      const events = parseEventLogs({ abi: factoryAbi, eventName: "TokenLaunched", logs: receipt.logs, strict: false });
      const launched = events.find((item) => item.args?.creator?.toLowerCase() === account.toLowerCase());
      const tokenAddress = launched?.args?.token;
      if (!tokenAddress) throw new Error("Transaksi terkonfirmasi, tetapi event TokenLaunched tidak ditemukan. Periksa transaksi di Elyscan.");
      resultBox.hidden = false;
      resultBox.innerHTML = '<span class="kicker">MONTRA LAUNCH CONFIRMED</span><h2>' + name.replace(/[&<>"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])) + ' ($' + symbol + ')</h2><p>Token dan liquidity pool MONTRA berhasil dibuat di Elysium Mainnet.</p><code>' + tokenAddress + '</code><div class="clanker-result-links"><a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="https://montraxyz.com/token/' + tokenAddress.toLowerCase() + '">View on MONTRA <i data-lucide="external-link"></i></a><a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="https://elyscan.live/tx/' + txHash + '">View transaction <i data-lucide="arrow-up-right"></i></a></div>';
      window.lucide?.createIcons?.();
      setStatus("Selesai. Event TokenLaunched telah diverifikasi dari receipt transaksi.", "success");
    } catch (error) {
      console.error("MONTRA deployment error:", error);
      if (txHash) {
        resultBox.hidden = false;
        resultBox.innerHTML = '<span class="kicker">TRANSACTION SUBMITTED · CHECK STATUS</span><h2>Verification pending</h2><p>Transaksi sudah dikirim. Jangan kirim transaksi kedua sebelum memeriksa status hash.</p><a class="btn btn-secondary" target="_blank" rel="noreferrer" href="https://elyscan.live/tx/' + txHash + '">Check transaction on Elyscan</a>';
        setStatus("Transaksi sudah dikirim tetapi belum terverifikasi. Periksa hash transaksi sebelum mencoba lagi.", "pending");
      } else {
        setStatus(error?.shortMessage || error?.message || "Peluncuran MONTRA gagal sebelum transaksi dikirim.", "error");
      }
    } finally {
      deploying = false;
      deployButton.disabled = !window.ethereum || !$("cl-confirm").checked;
    }
  });
  setPlatform();
}
