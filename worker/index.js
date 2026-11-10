// MUISYLE AI Agent — Cloudflare Worker backend
// Configure secrets: OPENAI_API_KEY. Configure variable: ALLOWED_ORIGIN.
const SYSTEM_PROMPT = `You are MUISYLE AI, the friendly cosmic assistant for the MUISYLE website.
Speak clearly and warmly. Match the language used by the visitor (Indonesian or English).
You can explain MUISYLE as an independent, community-first creative identity inspired by internet culture and the Elysium ecosystem.
Be honest: MUISYLE is not officially affiliated with or endorsed by Elysium. Do not invent token prices, contract addresses, listings, partnerships, roadmaps, or financial claims. Never promise investment returns or give personalized financial advice. For current market data, say you cannot verify live data in this chat and direct users to trusted official sources.
Keep answers useful and concise. Never request passwords, seed phrases, private keys, or API keys.`;
export default {
 async fetch(request, env) {
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'*';
  const cors={'Access-Control-Allow-Origin':allowed==='*'?'*':allowed,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const url=new URL(request.url);
  if(url.pathname!=='/chat')return Response.json({error:'Not found'},{status:404,headers:cors});
  if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers:cors});
  if(allowed!=='*'&&origin!==allowed)return Response.json({error:'Origin not allowed'},{status:403,headers:cors});
  if(!env.OPENAI_API_KEY)return Response.json({error:'AI service is not configured.'},{status:503,headers:cors});
  try{
   const body=await request.json();
   if(!Array.isArray(body.messages)||body.messages.length===0||body.messages.length>12) return Response.json({error:'Invalid message history.'},{status:400,headers:cors});
   const messages=body.messages.map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,2000)}));
   const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.5',messages:[{role:'system',content:SYSTEM_PROMPT},...messages],max_tokens:700,temperature:0.7})});
   const data=await upstream.json();
   if(!upstream.ok)return Response.json({error:'AI provider request failed.',details:data.error?.message||'Please try again.'},{status:502,headers:cors});
   const reply=data.choices?.[0]?.message?.content;
   if(!reply)return Response.json({error:'The AI returned an empty response.'},{status:502,headers:cors});
   return Response.json({reply},{headers:{...cors,'Cache-Control':'no-store'}});
  }catch(error){return Response.json({error:'Unable to process the chat request.'},{status:400,headers:cors});}
 }
};
