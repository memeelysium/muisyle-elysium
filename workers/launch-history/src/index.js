const CHAINS = {
  8453: {
    name: "Base",
    rpc: "https://mainnet.base.org",
    factory: "0x572e88d3cd7f23e4241eb6cedd96667271bf09a0",
    explorer: "https://basescan.org",
  },
  4663: {
    name: "Robinhood Chain",
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    factory: "0xca111dcdd2ce924c3378d6514fdcbc46217bca16",
    explorer: "https://robinhoodchain.blockscout.com",
  },
};
const ALLOWED_ORIGIN = "https://memeelysium.github.io";
const json = (data, status = 200, origin = ALLOWED_ORIGIN) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  },
});
const validAddress = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
const validHash = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
const safeText = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeUrl = (value) => {
  const v = safeText(value, 500);
  if (!v) return "";
  if (/^ipfs:\/\/[A-Za-z0-9]+(?:\/[^\s]*)?$/i.test(v)) return v;
  try { const u = new URL(v); return u.protocol === "https:" ? u.href : ""; } catch { return ""; }
};
async function rpc(chain, method, params) {
  const response = await fetch(chain.rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error("Blockchain RPC unavailable.");
  const data = await response.json();
  if (data.error || data.result == null) throw new Error("Blockchain verification failed.");
  return data.result;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return json({ ok: false, error: "Origin not allowed." }, 403);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      },
    });
    if (!env.LAUNCH_HISTORY) return json({ ok: false, error: "KV binding LAUNCH_HISTORY is not configured." }, 503);
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/launches") {
      try {
        const listed = await env.LAUNCH_HISTORY.list({ prefix: "launch:", limit: 1000 });
        const records = (await Promise.all(listed.keys.map((key) => env.LAUNCH_HISTORY.get(key.name, "json"))))
          .filter(Boolean)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 200);
        return json({ ok: true, count: records.length, launches: records });
      } catch { return json({ ok: false, error: "Could not read launch history." }, 500); }
    }
    if (request.method !== "POST" || url.pathname !== "/launches") {
      return json({ ok: false, error: "Not found." }, 404);
    }
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }
    const chainId = Number(body.chainId);
    const chain = CHAINS[chainId];
    const txHash = safeText(body.txHash, 66).toLowerCase();
    const tokenAddress = safeText(body.tokenAddress, 42);
    const deployer = safeText(body.deployer, 42);
    const name = safeText(body.name, 48);
    const symbol = safeText(body.symbol, 16).replace(/^\$/, "").toUpperCase();
    if (!chain || !validHash(txHash) || !validAddress(tokenAddress) || !validAddress(deployer) ||
        !name || !/^[A-Z0-9]{2,16}$/.test(symbol)) {
      return json({ ok: false, error: "Launch details are invalid or the network is unsupported." }, 400);
    }
    const key = "launch:" + chainId + ":" + txHash;
    if (await env.LAUNCH_HISTORY.get(key)) return json({ ok: true, duplicate: true });
    try {
      const receipt = await rpc(chain, "eth_getTransactionReceipt", [txHash]);
      if (receipt.status !== "0x1" || (receipt.to || "").toLowerCase() !== chain.factory) {
        return json({ ok: false, error: "Transaction is not a successful Clanker V5 factory launch." }, 422);
      }
      const tokenTopic = "0x" + tokenAddress.slice(2).toLowerCase().padStart(64, "0");
      const launchEvent = (receipt.logs || []).some((log) =>
        (log.address || "").toLowerCase() === chain.factory &&
        Array.isArray(log.topics) && log.topics.length >= 2 &&
        log.topics[1].toLowerCase() === tokenTopic
      );
      if (!launchEvent) return json({ ok: false, error: "Clanker factory launch event does not match the submitted token." }, 422);
      const code = await rpc(chain, "eth_getCode", [tokenAddress, "latest"]);
      if (!code || code === "0x") return json({ ok: false, error: "Token contract code was not found on-chain." }, 422);
      const block = await rpc(chain, "eth_getBlockByNumber", [receipt.blockNumber, false]);
      const createdAt = Number.parseInt(block.timestamp, 16);
      if (!Number.isFinite(createdAt)) throw new Error("Block timestamp unavailable.");
      const record = {
        chainId, network: chain.name, explorer: chain.explorer,
        txHash, tokenAddress, deployer, name, symbol,
        image: safeUrl(body.image), description: safeText(body.description, 500),
        websiteUrl: safeUrl(body.websiteUrl), xUrl: safeUrl(body.xUrl),
        createdAt, verified: true,
      };
      await env.LAUNCH_HISTORY.put(key, JSON.stringify(record));
      return json({ ok: true, launch: record });
    } catch (error) {
      return json({ ok: false, error: error?.message || "Could not verify this launch." }, 502);
    }
  },
};
