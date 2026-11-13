import { LAUNCH_HISTORY_ENDPOINT } from "./launch-history-config.js";

const $ = (id) => document.getElementById(id);
const status = $("muisyle-stats-status");
const countNode = $("muisyle-stat-launches");
const networksNode = $("muisyle-stat-networks");
const latestNode = $("muisyle-stat-latest");
const latestDetail = $("muisyle-stat-latest-detail");

function latestLabel(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

async function loadMuisyleStats() {
  if (!LAUNCH_HISTORY_ENDPOINT) {
    if (status) status.textContent = "Launch History service is not configured.";
    return;
  }
  try {
    const endpoint = LAUNCH_HISTORY_ENDPOINT.replace(/\\/$/, "") + (LAUNCH_HISTORY_ENDPOINT.endsWith("/launches") ? "" : "/launches");
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data?.ok || !Array.isArray(data.launches)) throw new Error(data?.error || "Launch service unavailable");
    const launches = data.launches.filter((item) => item && item.verified === true);
    const networks = [...new Set(launches.map((item) => item.network).filter(Boolean))];
    const latest = launches.reduce((best, item) => Number(item.createdAt) > Number(best?.createdAt) ? item : best, null);
    if (countNode) countNode.textContent = launches.length.toLocaleString();
    if (networksNode) networksNode.textContent = networks.length.toLocaleString();
    if (latestNode) latestNode.textContent = latest ? latestLabel(latest.createdAt) : "No records";
    if (latestDetail) latestDetail.textContent = latest ? [latest.name, latest.network].filter(Boolean).join(" · ") : "No verified launches recorded yet";
    if (status) status.textContent = "Verified records loaded · " + launches.length.toLocaleString() + " launch record(s)";
  } catch (error) {
    if (status) status.textContent = "MUISYLE launch statistics are temporarily unavailable. " + (error?.message || "");
    if (countNode) countNode.textContent = "Unavailable";
    if (networksNode) networksNode.textContent = "Unavailable";
    if (latestNode) latestNode.textContent = "Unavailable";
    if (latestDetail) latestDetail.textContent = "Could not verify the launch archive";
  }
}

loadMuisyleStats();
