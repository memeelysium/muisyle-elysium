# MUISYLE Public Launch History

This Worker stores public records for successful Clanker V5 launches made through the MUISYLE launch portal.

## Cloudflare setup

1. In Cloudflare Dashboard, open **Workers & Pages → KV**.
2. Create a namespace named `MUISYLE_LAUNCH_HISTORY`.
3. Open **Workers & Pages → Create → Worker** and name it `muisyle-launch-history`.
4. Open the Worker editor and replace its code with `src/index.js` from this folder.
5. Open **Settings → Bindings → Add → KV namespace**.
   - Variable name: `LAUNCH_HISTORY`
   - KV namespace: `MUISYLE_LAUNCH_HISTORY`
6. Save and deploy. The public endpoint will look like:
   `https://muisyle-launch-history.YOUR-SUBDOMAIN.workers.dev`
7. Copy that URL. In the repository file `src/launch-history-config.js`, set:
   `export const LAUNCH_HISTORY_ENDPOINT = "https://muisyle-launch-history.YOUR-SUBDOMAIN.workers.dev/launches";`
   (Use the full URL ending in `/launches`.)
8. Commit that one-line configuration change to the repository. GitHub Pages will publish the page.

## Verification

- Public listing: `GET https://...workers.dev/launches`
- Record: `POST https://...workers.dev/launches` (called by the launch portal only after Clanker SDK confirms deployment).

The Worker checks the transaction receipt status, verifies that the transaction was sent to the configured Clanker V5 factory for the selected supported chain, matches the factory event to the supplied token address, and checks that token contract bytecode exists. This is a launch-history integrity check, not an audit of the token or a safety endorsement. It does not accept private keys and cannot initiate transactions.

Supported chain IDs: Elysium 99901, Base 8453 and Robinhood Chain 4663. The Worker includes a chain-specific Clanker V5 factory and RPC verification configuration for each network.
The Elysium RPC endpoint may need to be replaced with a stable RPC if the provider changes or rate-limits public reads.

## Notes

- The list starts collecting launches after the Worker is configured; it does not backfill older launches automatically.
- KV is eventually consistent, so a new record can take a short time to appear publicly.
- Records are append-only from the website endpoint; duplicate transaction hashes are ignored.
