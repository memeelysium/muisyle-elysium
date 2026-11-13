import { LAUNCH_HISTORY_ENDPOINT } from "./launch-history-config.js";

const directory = document.getElementById("creator-directory");
const directoryStatus = document.getElementById("creator-directory-status");
const creatorCount = document.getElementById("creator-count");
const searchForm = document.getElementById("creator-search-form");
const searchInput = document.getElementById("creator-search-input");
const searchStatus = document.getElementById("creator-search-status");
const detail = document.getElementById("creator-profile-detail");

const isAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(String(value || ""));
const shortAddress = (value) => value ? value.slice(0, 8) + "…" + value.slice(-6) : "Unknown creator";
const dateLabel = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) + " UTC"
    : "Date unavailable";
};
const make = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
};
const safeExplorer = (item, kind, value) => {
  const base = typeof item.explorer === "string" && /^https:\/\//.test(item.explorer)
    ? item.explorer.replace(/\/$/, "") : "";
  if (!base || !isAddress(item.tokenAddress) || !/^0x[0-9a-fA-F]{64}$/.test(item.txHash || "")) return "";
  return base + (kind === "tx" ? "/tx/" : "/token/") + encodeURIComponent(value);
};
const externalLink = (label, href) => {
  if (!href || !/^https:\/\//.test(href)) return null;
  const link = make("a", "", label + " ↗");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
};

let launches = [];
let creators = [];

function aggregate(records) {
  const map = new Map();
  records.forEach((item) => {
    if (!isAddress(item.deployer) || item.verified !== true) return;
    const key = item.deployer.toLowerCase();
    if (!map.has(key)) map.set(key, { address: item.deployer, launches: [] });
    map.get(key).launches.push(item);
  });
  return [...map.values()].map((creator) => {
    creator.launches.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    creator.networks = [...new Set(creator.launches.map((item) => item.network).filter(Boolean))];
    creator.latest = Number(creator.launches[0]?.createdAt || 0);
    return creator;
  }).sort((a, b) => b.launches.length - a.launches.length || b.latest - a.latest);
}

function renderDirectory() {
  directory.replaceChildren();
  creatorCount.textContent = creators.length + " CREATOR" + (creators.length === 1 ? "" : "S");
  if (!creators.length) {
    directory.append(make("div", "creator-empty", "No verified creator profiles yet. A creator appears here after a launch is confirmed and recorded by MUISYLE."));
    return;
  }
  creators.forEach((creator, index) => {
    const card = make("a", "creator-card");
    card.href = "?page=creator&address=" + encodeURIComponent(creator.address);
    const avatar = make("span", "creator-avatar", creator.address.slice(2, 4).toUpperCase());
    const main = make("span", "creator-card-main");
    main.append(make("strong", "", "Creator " + String(index + 1).padStart(2, "0")));
    main.append(make("code", "", shortAddress(creator.address)));
    const stats = make("span", "creator-card-stats");
    const launchesStat = make("span");
    launchesStat.append(make("b", "", String(creator.launches.length)), document.createTextNode(" verified launch" + (creator.launches.length === 1 ? "" : "es")));
    const networksStat = make("span");
    networksStat.append(make("b", "", String(creator.networks.length)), document.createTextNode(" network" + (creator.networks.length === 1 ? "" : "s")));
    stats.append(launchesStat, networksStat);
    main.append(stats);
    card.append(avatar, main, make("span", "creator-open", "VIEW ↗"));
    directory.append(card);
  });
}

function renderDetail(address) {
  detail.replaceChildren();
  detail.hidden = true;
  if (!address) return;
  detail.hidden = false;
  const creator = creators.find((item) => item.address.toLowerCase() === address.toLowerCase());
  if (!creator) {
    detail.append(make("div", "creator-empty", "No verified MUISYLE launches were found for this wallet address. Check the address or explore the creator directory below."));
    searchStatus.textContent = "No creator activity found for that address.";
    return;
  }
  searchInput.value = creator.address;
  searchStatus.textContent = "Showing verified creator activity for " + shortAddress(creator.address) + ".";
  const head = make("div", "creator-profile-head");
  head.append(make("div", "creator-profile-avatar", creator.address.slice(2, 4).toUpperCase()));
  const title = make("div", "creator-profile-title");
  title.append(make("h2", "", "MUISYLE Creator"));
  title.append(make("code", "", creator.address));
  title.append(make("span", "creator-verified", "✓ VERIFIED DEPLOYER · ON-CHAIN RECORDS"));
  head.append(title);
  detail.append(head);

  const stats = make("div", "creator-stat-grid");
  [
    [creator.launches.length, "Verified launches"],
    [creator.networks.length, "Networks"],
    [dateLabel(creator.latest), "Latest launch"],
  ].forEach(([value, label]) => {
    const stat = make("div", "creator-stat");
    stat.append(make("strong", "", String(value)), make("span", "", label));
    stats.append(stat);
  });
  detail.append(stats);
  const actions = make("div", "creator-profile-actions");
  const copy = make("a", "", "COPY WALLET ADDRESS");
  copy.href = "#";
  copy.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(creator.address);
      searchStatus.textContent = "Wallet address copied.";
    } catch {
      searchStatus.textContent = "Copy is unavailable in this browser. Select the wallet address above.";
    }
  });
  actions.append(copy);
  detail.append(actions);

  const tokenList = make("div", "creator-token-list");
  creator.launches.forEach((item) => {
    const token = make("article", "creator-token");
    const info = make("div");
    info.append(make("strong", "", (item.name || "Unnamed token") + " · $" + (item.symbol || "—")));
    info.append(make("small", "", (item.network || "Unknown network") + " · " + dateLabel(item.createdAt)));
    info.append(make("small", "", isAddress(item.tokenAddress) ? item.tokenAddress : "Contract address unavailable"));
    const links = make("div", "creator-token-links");
    const tokenLink = externalLink("TOKEN EXPLORER", safeExplorer(item, "token", item.tokenAddress));
    const txLink = externalLink("TRANSACTION", safeExplorer(item, "tx", item.txHash));
    const clankerLink = isAddress(item.tokenAddress)
      ? externalLink("CLANKER", "https://www.clanker.world/clanker/" + encodeURIComponent(item.tokenAddress)) : null;
    [tokenLink, txLink, clankerLink].filter(Boolean).forEach((link) => links.append(link));
    token.append(info, links);
    tokenList.append(token);
  });
  detail.append(make("h3", "", "Verified launches"));
  detail.append(tokenList);
}

async function loadCreators() {
  if (!directory || !directoryStatus) return;
  if (!LAUNCH_HISTORY_ENDPOINT) {
    directoryStatus.dataset.state = "error";
    directoryStatus.textContent = "Creator Profiles are waiting for the MUISYLE Launch History service.";
    renderDirectory();
    return;
  }
  directoryStatus.textContent = "Loading verified creator activity…";
  try {
    const endpoint = LAUNCH_HISTORY_ENDPOINT.replace(/\/$/, "").replace(/\/launches$/, "") + "/launches";
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data?.ok !== true || !Array.isArray(data.launches)) {
      throw new Error(data?.error || "Creator activity is unavailable.");
    }
    launches = data.launches;
    creators = aggregate(launches);
    directoryStatus.textContent = launches.length + " verified launch record" + (launches.length === 1 ? "" : "s") + " across " + creators.length + " creator wallet" + (creators.length === 1 ? "" : "s") + ".";
    renderDirectory();
    const requestedAddress = new URLSearchParams(location.search).get("address") || "";
    if (requestedAddress && isAddress(requestedAddress)) renderDetail(requestedAddress);
    else if (requestedAddress) searchStatus.textContent = "Enter a valid EVM wallet address.";
  } catch (error) {
    directoryStatus.dataset.state = "error";
    directoryStatus.textContent = "Could not load creator activity: " + (error?.message || "service unavailable");
    directory.append(make("div", "creator-empty", "The public creator directory could not be reached. Try again in a moment."));
  }
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const address = searchInput.value.trim();
  if (!isAddress(address)) {
    searchStatus.textContent = "Enter a valid EVM wallet address (0x followed by 40 hexadecimal characters).";
    return;
  }
  const url = "?page=creator&address=" + encodeURIComponent(address);
  history.pushState({ page: "creator" }, "", url);
  renderDetail(address);
});
loadCreators();
