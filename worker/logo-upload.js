// MUISYLE logo uploader — separate Cloudflare Worker
// Required secret: PINATA_JWT. Required vars: ALLOWED_ORIGIN=https://memeelysium.github.io
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export default {
 async fetch(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "https://memeelysium.github.io";
  const headers = {"Access-Control-Allow-Origin": allowed,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Accept","Vary":"Origin","Cache-Control":"no-store"};
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const url = new URL(request.url);
  if (url.pathname !== "/upload") return Response.json({ error: "Not found" }, { status: 404, headers });
  if (origin !== allowed) return Response.json({ error: "Origin not allowed" }, { status: 403, headers });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BYTES + 65536) return Response.json({ error: "File exceeds 5 MB." }, { status: 413, headers });
  if (!env.PINATA_JWT) return Response.json({ error: "IPFS upload is not configured." }, { status: 503, headers });
  try {
   const form = await request.formData(); const file = form.get("file");
   if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !TYPES.has(file.type)) return Response.json({ error: "Upload a PNG, JPG, WEBP or GIF file up to 5 MB." }, { status: 400, headers });
   const upload = new FormData(); upload.append("file", file, file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "token-logo");
   const pinata = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {method:"POST",headers:{Authorization:"Bearer "+env.PINATA_JWT},body:upload});
   const result = await pinata.json();
   if (!pinata.ok || !/^[A-Za-z0-9]+$/.test(result.IpfsHash || "")) return Response.json({ error: "IPFS provider rejected the upload." }, { status: 502, headers });
   return Response.json({ uri:"ipfs://"+result.IpfsHash, gateway:"https://gateway.pinata.cloud/ipfs/"+result.IpfsHash }, { headers });
  } catch { return Response.json({ error: "Unable to process the image upload." }, { status: 400, headers }); }
 }
};
