import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider, usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import "./privy-auth.css";

const APP_ID = "cmwdxfcfn00h10gjsjgb6kv01";

function AuthPanel() {
  const { ready, authenticated, user, login, logout, exportWallet } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [walletError, setWalletError] = useState("");
  const creationStarted = useRef(false);

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy" && wallet.chainType === "ethereum"
  );

  const prepareWallet = async () => {
    if (creationStarted.current || embeddedWallet) return;
    creationStarted.current = true;
    setWalletError("");
    setMessage("Creating your secure embedded wallet…");
    try {
      await createWallet();
      setMessage("Wallet created. Connecting it to the launch portal…");
    } catch (error) {
      console.error("MUISYLE embedded wallet creation failed:", error);
      const reason = error?.message || "Unknown wallet creation error.";
      if (/already have an embedded wallet|already exists/i.test(reason)) {
        setMessage("Wallet found. Refreshing wallet connection…");
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
    if (!embeddedWallet || busy) return;
    setBusy(true);
    setMessage("Follow the Privy security prompt to export your wallet key.");
    try {
      await exportWallet();
      setMessage("Wallet export flow completed. Keep any exported key private and never share it.");
    } catch (error) {
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
  const walletReady = Boolean(embeddedWallet);
  return <div className="muisyle-auth-panel">
    <div className="muisyle-auth-copy">
      <strong>Signed in with X</strong>
      <span>{address ? address.slice(0, 8) + "…" + address.slice(-6) : "Preparing your embedded wallet…"}</span>
    </div>
    <div className="muisyle-auth-actions">
      {!walletReady && walletError && <button className="muisyle-auth-button" type="button" disabled={!walletsReady} onClick={() => { creationStarted.current = false; prepareWallet(); }}>Retry wallet setup</button>}
      <button className="muisyle-auth-button" type="button" disabled={!walletReady || busy} onClick={handleExport}>Export wallet</button>
      <button className="muisyle-auth-secondary" type="button" onClick={() => logout()}>Sign out</button>
    </div>
    <p className="muisyle-auth-message" role="status">{message || (walletReady ? "Your embedded EVM wallet is ready. Transactions still require your approval." : walletError || "Preparing your secure embedded wallet…")}</p>
  </div>;
}

function App() {
  return <PrivyProvider
    appId={APP_ID}
    config={{
      loginMethods: ["twitter"],
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

const mount = document.createElement("div");
mount.id = "muisyle-privy-root";
mount.className = "muisyle-auth-mount";
const launchPage = document.querySelector('[data-view="launch"]');
const launchHeading = launchPage?.querySelector(".page-heading");
if (launchHeading) launchHeading.insertAdjacentElement("afterend", mount);
else document.body.appendChild(mount);
createRoot(mount).render(<App />);
