import { LAUNCH_HISTORY_ENDPOINT } from "./launch-history-config.js";

const list = document.getElementById("launch-history-list");
const status = document.getElementById("history-status");
const refresh = document.getElementById("history-refresh");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const imageUrl = (value) => {
  if (typeof value !== "string") return "";
  if (/^ipfs:\/\/[A-Za-z0-9]+(?:\/[^\s]*)?$/i.test(value)) return "https://gateway.pinata.cloud/ipfs/" + value.slice(7);
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; }
};
const dateLabel = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Date unavailable";
};
async function loadHistory() {
  if (!list || !status) return;
  if (!LAUNCH_HISTORY_ENDPOINT) {
    status.dataset.state = "error";
    status.textContent = "Launch History is not connected to the Cloudflare Worker yet. The archive will appear once setup is complete.";
    list.innerHTML = '<div class="history-empty">Public Launch History is being configured.<br>Come back soon to explore MUISYLE launches.</div>';
    return;
  }
  status.dataset.state = "";
  status.textContent = "Loading verified launches…";
  list.replaceChildren();
  try {
    const endpoint = LAUNCH_HISTORY_ENDPOINT.replace(/\/$/, "") + (LAUNCH_HISTORY_ENDPOINT.endsWith("/launches") ? "" : "/launches");
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data?.ok || !Array.isArray(data.launches)) throw new Error(data?.error || "History service unavailable.");
    if (!data.launches.length) {
      status.textContent = "No tokens have been recorded yet. The first MUISYLE launch will appear here once verified.";
      list.innerHTML = '<div class="history-empty">No verified launches yet.<br>Be the first to launch through the MUISYLE portal.</div>';
      return;
    }
    status.textContent = data.count + " verified launch" + (data.count === 1 ? "" : "es") + " · newest first";
    list.innerHTML = data.launches.map((item) => {
      const explorer = /^https:\/\//.test(item.explorer || "") ? item.explorer.replace(/\/$/, "") : "";
      const tokenUrl = explorer ? explorer + "/token/" + encodeURIComponent(item.tokenAddress) : "#";
      const txUrl = explorer ? explorer + "/tx/" + encodeURIComponent(item.txHash) : "#";
      const image = imageUrl(item.image);
      const avatar = image
        ? '<div class="history-avatar"><img loading="lazy" src="' + escapeHtml(image) + '" alt=""></div>'
        : '<div class="history-avatar">' + escapeHtml((item.symbol || "✦").slice(0, 2)) + "</div>";
      return '<article class="history-card">' + avatar + '<div class="history-main"><h3>' + escapeHtml(item.name) + '</h3><span class="history-symbol">$' + escapeHtml(item.symbol) + '</span><div class="history-meta"><span>' + escapeHtml(item.network) + '</span><span>VERIFIED ON-CHAIN</span></div><small>' + escapeHtml(dateLabel(item.createdAt)) + '</small><code class="history-address">' + escapeHtml(item.tokenAddress) + '</code><div class="history-links"><a href="' + tokenUrl + '" target="_blank" rel="noopener noreferrer">TOKEN EXPLORER ↗</a><a href="' + txUrl + '" target="_blank" rel="noopener noreferrer">TRANSACTION ↗</a></div></div></article>';
    }).join("");
  } catch (error) {
    status.dataset.state = "error";
    status.textContent = "Failed to load Launch History: " + (error?.message || "service unavailable");
    list.innerHTML = '<div class="history-empty">The public launch archive could not be reached.<br>Try refreshing in a moment.</div>';
  }
}
refresh?.addEventListener("click", loadHistory);
if (list) loadHistory();
