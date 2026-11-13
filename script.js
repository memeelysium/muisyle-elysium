import("./src/privy-auth.jsx").catch((error) => console.error("MUISYLE Privy initialization failed:", error));

(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nav=$('.main-nav'),toggle=$('.menu-toggle');
const valid=['home','tokens','launch-history','launch','claim-fee','missions','gallery','community','legal'];
function show(page,update=true){
 const active=valid.includes(page)?page:'home';
 $$('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===active));
 $$('[data-page]').forEach(el=>{if(el.dataset.page===active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 document.title='MUISYLE — '+({home:'Elysium Ecosystem',tokens:'Token Orbit','launch-history':'Launch History',launch:'Launch Portal','claim-fee':'Claim Fee',missions:'Cosmic Missions',gallery:'Meme Lab',community:'Community',legal:'Legal & Policies'}[active]);
 if(update)history.pushState({page:active},'', '?page='+active);
 if(nav)nav.classList.remove('open');
 if(toggle)toggle.setAttribute('aria-expanded','false');
 window.scrollTo({top:0,behavior:'instant'});
}
function pageFromUrl(){return new URLSearchParams(location.search).get('page')||'home'}
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href*="?page="]');
 if(!link||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||link.target==='_blank')return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin)return;
 e.preventDefault();show(url.searchParams.get('page')||'home');
});
window.addEventListener('popstate',()=>show(pageFromUrl(),false));
if(toggle&&nav)toggle.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(nav?.classList.contains('open')&&!e.target.closest('.topbar')){nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}});
const prompts=[
'POV: You came to Elysium for one transaction and found an entire universe.',
'That moment when the community says GM and your timeline becomes a nebula.',
'Me checking the explorer for the 17th time like something changed in 30 seconds.',
'When your meme gets more attention than your carefully written thread.',
'Expectation: one quick scroll. Reality: lost in the MUISYLE universe.',
'POV: Your portfolio is quiet but your meme folder is building an empire.',
'When someone asks what you do here: vibes, memes, and on-chain curiosity.'
];
let previous=-1;
const output=$('#meme-prompt'),feedback=$('#prompt-feedback');
$('#generate-prompt')?.addEventListener('click',()=>{let next;do{next=Math.floor(Math.random()*prompts.length)}while(next===previous&&prompts.length>1);previous=next;if(output)output.textContent=prompts[next];if(feedback)feedback.textContent='A fresh idea just entered your orbit.'});
$('#copy-prompt')?.addEventListener('click',async()=>{if(!output)return;try{await navigator.clipboard.writeText(output.textContent);if(feedback)feedback.textContent='Caption copied. Go make something cosmic!'}catch{if(feedback)feedback.textContent='Copy is unavailable in this browser. Select the caption to copy it.'}});

const claimAddress=$('#claim-token-address'),claimButton=$('#claim-fee-open'),claimStatus=$('#claim-fee-status');
claimButton?.addEventListener('click',()=>{const address=claimAddress?.value.trim()||'';if(!/^0x[0-9a-fA-F]{40}$/.test(address)){if(claimStatus)claimStatus.textContent='Enter a valid EVM token contract address (0x followed by 40 hexadecimal characters).';return;}const url='https://www.clanker.world/clanker/'+address+'/admin';window.open(url,'_blank','noopener,noreferrer');if(claimStatus)claimStatus.textContent='Clanker Admin is now open. Review your reward balance and transaction details there.';});
// Token Orbit directory interactions.
const tokenDirectory=$('#token-directory');
if(tokenDirectory){
 const cards=$('.token-orbit-card',tokenDirectory),search=$('#token-search'),filters=$('.token-filter');
 const count=$('#token-result-count'),empty=$('#token-no-results');let category='all';
 const refresh=()=>{const q=(search?.value||'').trim().toLowerCase();let shown=0;cards.forEach(card=>{const visible=(category==='all'||card.dataset.category===category)&&(!q||(card.dataset.search||'').includes(q));card.hidden=!visible;if(visible)shown++;});if(count)count.textContent=String(shown).padStart(2,'0')+' ASSETS';if(empty)empty.hidden=shown!==0;};
 search?.addEventListener('input',refresh);
 filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.tokenFilter||'all';filters.forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});refresh();}));
 tokenDirectory.addEventListener('click',async event=>{const button=event.target.closest('[data-copy-address]');if(!button)return;const address=button.dataset.copyAddress||'',original=button.innerHTML;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(address);else{const field=document.createElement('textarea');field.value=address;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error('Copy unavailable');}button.innerHTML='<i data-lucide="check"></i> Copied';}catch(error){button.textContent='Copy unavailable';}if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{'stroke-width':1.8}});window.setTimeout(()=>{button.innerHTML=original;if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{'stroke-width':1.8}})},1800);});
 refresh();
}

$('#year').textContent=new Date().getFullYear();
show(pageFromUrl(),false);
window.addEventListener('load',()=>{if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{'stroke-width':1.8}})});
})();