import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { defineChain } from "viem";
import { base } from "viem/chains";
import { PrivyProvider, usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import "./privy-auth.css";

const APP_ID = "cmwdxfcfn00h10gjsjgb6kv01";

const elysium = defineChain({
  id: 99901,
  name: "Elysium Mainnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.elysium.kinetiq.xyz"] } },
  blockExplorers: { default: { name: "Elyscan", url: "https://elyscan.live" } },
});

const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Robinhood Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

function AuthPanel() {
  const { ready, authenticated, user, login, logout, exportWallet } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [walletError, setWalletError] = useState("");
  const creationStarted = useRef(false);

  const xAccount = user?.linkedAccounts?.find((account) =>
    account?.type === "twitter" || account?.type === "x"
  );
  const xProfileImage = xAccount?.profilePictureUrl || xAccount?.profile_picture_url ||
    xAccount?.profileImageUrl || user?.twitter?.profilePictureUrl || "";
  const xDisplayName = xAccount?.name || xAccount?.username || user?.twitter?.username || "X account";
  const xHandle = xAccount?.username ? `@${xAccount.username.replace(/^@/, "")}` : "";

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  const prepareWallet = async () => {
    if (creationStarted.current || embeddedWallet || !authenticated || !walletsReady) return;
    creationStarted.current = true;
    setWalletError("");
    setMessage("Creating your secure embedded wallet…");
    try {
      await createWallet();
      setMessage("Wallet creation requested. Waiting for the wallet to become available…");
    } catch (error) {
      console.error("MUISYLE embedded wallet creation failed:", error);
      const reason = error?.message || "Unknown wallet creation error.";
      if (/already have an embedded wallet|already exists/i.test(reason)) {
        setWalletError("A wallet may already exist but is not yet visible. Refresh this page and try again.");
        setMessage("Wallet already exists. Refresh the page to reconnect it.");
      } else {
        creationStarted.current = false;
        setWalletError(reason);
        setMessage("Your wallet could not be prepared. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (!authenticated) {
      creationStarted.current = false;
      setWalletError("");
      setMessage("");
      delete window.MUISYLE_PRIVY_PROVIDER;
      return;
    }
    if (!ready || !walletsReady) return;
    if (embeddedWallet) {
      creationStarted.current = true;
      setWalletError("");
      setMessage("");
      return;
    }
    prepareWallet();
  }, [authenticated, ready, walletsReady, embeddedWallet]);

  useEffect(() => {
    let cancelled = false;
    async function exposeProvider() {
      if (!authenticated || !embeddedWallet) {
        delete window.MUISYLE_PRIVY_PROVIDER;
        return;
      }
      try {
        const provider = await embeddedWallet.getEthereumProvider();
        if (!cancelled) {
          window.MUISYLE_PRIVY_PROVIDER = provider;
          window.dispatchEvent(new Event("muisyle:privy-wallet-ready"));
        }
      } catch (error) {
        console.error("Unable to initialize the MUISYLE embedded wallet:", error);
        if (!cancelled) setMessage("Your wallet exists, but the launch portal could not connect to it. Please refresh and try again.");
      }
    }
    exposeProvider();
    return () => { cancelled = true; };
  }, [authenticated, embeddedWallet]);

  const handleLogin = async () => {
    setMessage("");
    setWalletError("");
    try { await login({ loginMethod: "twitter" }); }
    catch (error) { setMessage(error?.message || "X login could not be started. Please try again."); }
  };

  const handleExport = async () => {
    if (!embeddedWallet?.address || busy) return;
    setBusy(true);
    setMessage("Opening Privy's secure wallet export…");
    try {
      await exportWallet();
      setMessage("Privy's wallet export flow was closed. If you completed the security steps, your key has been exported. Keep it private.");
    } catch (error) {
      console.error("MUISYLE wallet export failed:", error);
      setMessage(error?.message || "Wallet export was cancelled or could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div className="muisyle-auth-panel"><span className="muisyle-auth-muted">Loading secure sign-in…</span></div>;

  if (!authenticated) {
    return <div className="muisyle-auth-panel">
      <div className="muisyle-auth-copy"><strong>New to MUISYLE?</strong><span>Sign in with X to create your embedded EVM wallet.</span></div>
      <button className="muisyle-auth-button" type="button" onClick={handleLogin}>Continue with X</button>
      {message && <p className="muisyle-auth-message" role="status">{message}</p>}
    </div>;
  }

  const address = embeddedWallet?.address || user?.wallet?.address || "";
  const walletReady = Boolean(embeddedWallet?.address);
  return <div className="muisyle-auth-panel">
    <div className="muisyle-auth-identity">
      {xProfileImage
        ? <img className="muisyle-x-avatar" src={xProfileImage} alt="Your X profile picture" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        : <div className="muisyle-x-avatar-fallback" aria-hidden="true">X</div>}
      <div className="muisyle-auth-copy">
        <strong>{xDisplayName}</strong>
        <span>{xHandle || "Signed in with X"}</span>
        <span>{address ? address.slice(0, 8) + "…" + address.slice(-6) : "Preparing your embedded wallet…"}</span>
      </div>
    </div>
    <div className="muisyle-auth-actions">
      {!walletReady && walletError && <button className="muisyle-auth-button" type="button" disabled={!walletsReady} onClick={() => { creationStarted.current = false; prepareWallet(); }}>Retry wallet setup</button>}
      <button className="muisyle-auth-button" type="button" disabled={!walletReady || busy} onClick={handleExport}>{busy ? "Opening export…" : "Export wallet"}</button>
      <button className="muisyle-auth-secondary" type="button" onClick={() => logout()}>Sign out</button>
    </div>
    <p className="muisyle-auth-message" role="status">{message || (walletReady ? "Your embedded EVM wallet is ready. Export opens Privy's secure key-export flow." : walletError || "Preparing your secure embedded wallet…")}</p>
  </div>;
}

function App() {
  return <PrivyProvider
    appId={APP_ID}
    config={{
      loginMethods: ["twitter"],
      supportedChains: [elysium, base, robinhood],
      defaultChain: elysium,
      embeddedWallets: {
        ethereum: { createOnLogin: "all-users" }
      },
      appearance: {
        theme: "dark",
        accentColor: "#9b7cff",
        landingHeader: "Welcome to MUISYLE",
        loginMessage: "Sign in with X and create your embedded wallet."
      }
    }}
  >
    <AuthPanel />
  </PrivyProvider>;
}

const mount = document.getElementById("muisyle-privy-root");
if (mount) {
  createRoot(mount).render(<App />);
} else {
  console.error("MUISYLE sign-in mount point is missing from the Launch Portal.");
}
