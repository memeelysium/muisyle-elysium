const menu=document.querySelector('.menu');const nav=document.querySelector('nav');if(menu&&nav){menu.addEventListener('click',()=>nav.classList.toggle('open'));nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')))}document.querySelector('#year').textContent=new Date().getFullYear();

// ELYSIUM MARKET LIVE DATA
(()=>{
 const names=['MONTRA','TESTICLES','e/acc','VOLTA','CHAMELEON','BLOB','EACCAT'];
 const root=document.getElementById('live-market-list');
 const updated=document.getElementById('market-updated');
 const refresh=document.getElementById('market-refresh-btn');
 if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pick=(o,keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=='')return o[k]}return null};
 const fmt=(v)=>{if(v===null||v===undefined||v==='')return '—';const n=Number(v);if(!Number.isFinite(n))return String(v);return n>=1?('$'+n.toLocaleString('en-US',{maximumFractionDigits:4})):('$'+n.toPrecision(5))};
 const pct=v=>{if(v===null||v===undefined||v==='')return null;let n=Number(v);return Number.isFinite(n)?n:null};
 async function load(){
  root.innerHTML='<p class="market-loading">Updating live token prices…</p>';
  try{
   const response=await fetch('https://elysiumexplore.com/api/v1/tokens?sort=volume&limit=250',{cache:'no-store'});
   if(!response.ok)throw new Error('API response '+response.status);
   const payload=await response.json();
   const list=Array.isArray(payload)?payload:(payload.tokens||payload.items||payload.data||payload.results||[]);
   if(!Array.isArray(list)||!list.length)throw new Error('No token data returned');
   const rows=names.map(name=>{
    const matches=list.filter(t=>String(pick(t,['symbol','ticker','name'])||'').trim().toLowerCase()===name.toLowerCase()||String(pick(t,['name','symbol','ticker'])||'').trim().toLowerCase()===name.toLowerCase());
    const token=matches[0];
    if(!token)return {name,missing:true};
    const market=token.market||token.stats||token;
    const price=pick(market,['priceUsd','price_usd','price','usdPrice']);
    const change=pct(pick(market,['change24h','change_24h','priceChange24h','change24','percentChange24h','change']));
    const volume=pick(market,['volume24hUsd','volume_24h_usd','volume24h','volume_24h','volumeUsd','volume']);
    const address=pick(token,['address','tokenAddress','contract']);
    return {name:pick(token,['symbol','ticker'])||name,price,change,volume,address};
   });
   root.innerHTML=rows.map(r=>{
    if(r.missing)return '<div class="market-row"><div class="market-token"><b>'+esc(r.name)+'</b><small>Not found in current feed</small></div><div class="market-value">—</div><div class="market-change">—</div><div class="market-value market-volume">—</div></div>';
    const changeText=r.change===null?'—':(r.change>0?'+':'')+r.change.toFixed(2)+'%';
    return '<div class="market-row"><div class="market-token"><b>'+esc(r.name)+'</b><small>'+(r.address?esc(r.address):'Elysium token')+'</small></div><div class="market-value">'+esc(fmt(r.price))+'</div><div class="market-change '+(r.change===null?'':r.change>=0?'up':'down')+'">'+esc(changeText)+'</div><div class="market-value market-volume">'+esc(fmt(r.volume))+'</div></div>';
   }).join('');
   updated.textContent='Updated '+new Date().toLocaleTimeString();
  }catch(err){
   root.innerHTML='<p class="market-error">Live market data could not be loaded right now. Please try Refresh or open the Explorer market directly.</p>';
   updated.textContent='Connection unavailable';
  }
 }
 refresh?.addEventListener('click',load);
 load();setInterval(load,60000);
})();
