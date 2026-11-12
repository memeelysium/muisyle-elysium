(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nav=$('.main-nav'),toggle=$('.menu-toggle');
const valid=['home','tokens','launch-history','launch','claim-fee','missions','gallery','community'];
function show(page,update=true){
 const active=valid.includes(page)?page:'home';
 $$('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===active));
 $$('[data-page]').forEach(el=>{if(el.dataset.page===active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 document.title='MUISYLE — '+({home:'Elysium Ecosystem',tokens:'Token Orbit','launch-history':'Launch History',launch:'Launch Portal','claim-fee':'Claim Fee',missions:'Cosmic Missions',gallery:'Meme Lab',community:'Community'}[active]);
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
claimButton?.addEventListener('click',()=>{const address=claimAddress?.value.trim()||'';if(!/^0x[0-9a-fA-F]{40}$/.test(address)){if(claimStatus)claimStatus.textContent='Masukkan alamat kontrak token EVM yang valid (0x diikuti 40 karakter heksadesimal).';return;}const url='https://www.clanker.world/clanker/'+address+'/admin';window.open(url,'_blank','noopener,noreferrer');if(claimStatus)claimStatus.textContent='Halaman Admin Clanker dibuka. Periksa saldo reward dan detail transaksi di sana.';});
$('#year').textContent=new Date().getFullYear();
show(pageFromUrl(),false);
window.addEventListener('load',()=>{if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{'stroke-width':1.8}})});
})();