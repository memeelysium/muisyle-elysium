const menu=document.querySelector('.menu');
const nav=document.querySelector('#primary-navigation');
if(menu&&nav){
  const icon=menu.querySelector('.menu-icon');
  const isMobile=()=>window.matchMedia('(max-width:760px)').matches;
  const setMenu=(open)=>{
    nav.classList.toggle('open',open);
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    if(icon)icon.textContent=open?'×':'☰';
    document.body.classList.toggle('navigation-open',open&&isMobile());
  };
  menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus()}});
  document.addEventListener('click',event=>{
    if(nav.classList.contains('open')&&!nav.contains(event.target)&&!menu.contains(event.target))setMenu(false);
  });
  window.addEventListener('resize',()=>{if(!isMobile())setMenu(false)});
}const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();const revealItems=document.querySelectorAll('.reveal');if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});revealItems.forEach(item=>observer.observe(item))}else{revealItems.forEach(item=>item.classList.add('is-visible'))}

// Cosmic touch sparkles: create a brief star burst when visitors tap empty space.
const sparkleStyle = document.createElement('style');
sparkleStyle.textContent = `
.touch-sparkle{position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none}
.touch-sparkle i{position:absolute;left:0;top:0;width:var(--s);height:var(--s);background:linear-gradient(135deg,#fff,#8defff 55%,#9c8cff);clip-path:polygon(50% 0,61% 38%,100% 50%,61% 62%,50% 100%,39% 62%,0 50%,39% 38%);filter:drop-shadow(0 0 5px #8defff);animation:sparkle-pop .72s ease-out forwards}
@keyframes sparkle-pop{0%{opacity:0;transform:translate(0,0) scale(.2) rotate(0)}18%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0) rotate(100deg)}}
@media(prefers-reduced-motion:reduce){.touch-sparkle i{animation-duration:.01ms}}
`;
document.head.appendChild(sparkleStyle);
const sparkleColors=['#ffffff','#8defff','#b5a5ff','#7be7df'];
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  if(event.target.closest('a,button,input,textarea,select,summary,[role="button"],.menu'))return;
  const burst=document.createElement('span');burst.className='touch-sparkle';burst.style.left=event.clientX+'px';burst.style.top=event.clientY+'px';
  for(let i=0;i<8;i++){const star=document.createElement('i');const angle=(Math.PI*2*i/8)+(Math.random()-.5)*.35;const distance=18+Math.random()*25;star.style.setProperty('--s',(4+Math.random()*6)+'px');star.style.setProperty('--dx',(Math.cos(angle)*distance)+'px');star.style.setProperty('--dy',(Math.sin(angle)*distance)+'px');star.style.background=sparkleColors[i%sparkleColors.length];burst.appendChild(star)}
  document.body.appendChild(burst);window.setTimeout(()=>burst.remove(),800);
},{passive:true});


// MUISYLE Cosmic Click: a short synthesized sound for interactive controls.
let cosmicAudioContext;
function playCosmicClick(){
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return;
    cosmicAudioContext=cosmicAudioContext||new AudioContextClass();
    if(cosmicAudioContext.state==='suspended')cosmicAudioContext.resume();
    const ctx=cosmicAudioContext;
    const now=ctx.currentTime;
    const master=ctx.createGain();
    master.gain.setValueAtTime(0.0001,now);
    master.gain.exponentialRampToValueAtTime(0.075,now+0.012);
    master.gain.exponentialRampToValueAtTime(0.0001,now+0.16);
    master.connect(ctx.destination);
    [[880,1320,'sine',0],[1760,2200,'sine',0.018],[440,660,'triangle',0.012]].forEach(([start,end,type,delay])=>{
      const osc=ctx.createOscillator();
      const tone=ctx.createGain();
      osc.type=type;
      osc.frequency.setValueAtTime(start,now+delay);
      osc.frequency.exponentialRampToValueAtTime(end,now+delay+0.09);
      tone.gain.setValueAtTime(type==='triangle'?0.18:0.32,now+delay);
      tone.gain.exponentialRampToValueAtTime(0.0001,now+0.14);
      osc.connect(tone);tone.connect(master);
      osc.start(now+delay);osc.stop(now+0.17);
    });
  }catch(error){/* Audio is optional; never interrupt navigation. */}
}
const cosmicControlSelector='a,button,[role="button"],input[type="button"],input[type="submit"],.menu';
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  const control=event.target.closest(cosmicControlSelector);
  if(control&&!control.matches(':disabled,[aria-disabled="true"]'))playCosmicClick();
},{capture:true,passive:true});
// Also support keyboard activation without double-playing pointer clicks.
document.addEventListener('click',event=>{
  if(event.detail!==0)return;
  const control=event.target.closest(cosmicControlSelector);
  if(control&&!control.matches(':disabled,[aria-disabled="true"]'))playCosmicClick();
},true);


// tsParticles: initialize after deferred CDN scripts have loaded.
window.addEventListener('load',async function initCosmicParticles(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!window.tsParticles||!window.loadSlim)return;
  try{
    await window.loadSlim(window.tsParticles);
    await window.tsParticles.load({
      id:'tsparticles',
      options:{
        fullScreen:{enable:false},detectRetina:true,fpsLimit:45,
        particles:{
          number:{value:42,density:{enable:true,area:1000}},
          color:{value:['#ffffff','#8defff','#a99bff']},shape:{type:'circle'},
          opacity:{value:{min:.16,max:.62},animation:{enable:true,speed:.45,sync:false}},
          size:{value:{min:1,max:2.2}},
          links:{enable:true,distance:135,color:'#8daaff',opacity:.13,width:1},
          move:{enable:true,speed:.42,direction:'none',random:true,straight:false,outModes:{default:'out'}}
        },
        interactivity:{events:{onHover:{enable:false},onClick:{enable:false}}},
        background:{color:{value:'transparent'}}
      }
    });
  }catch(error){console.warn('Cosmic particles could not be loaded:',error)}
});


// Render consistent Lucide outline icons once the deferred library is ready.
window.addEventListener('load',function renderLucideIcons(){
  if(window.lucide&&typeof window.lucide.createIcons==='function'){
    window.lucide.createIcons({attrs:{'stroke-width':1.8}});
  }
});


// Premium Cosmic intro: keep the screen visible for at least 5 seconds on every page load.
(function initPremiumLoader(){
  const loader=document.getElementById('loading-screen');
  if(!loader)return;
  const finish=()=>{
    if(!loader.classList.contains('is-active'))return;
    loader.classList.add('is-leaving');
    loader.classList.remove('is-active');
    document.documentElement.classList.remove('loading-active');
    window.setTimeout(()=>loader.remove(),700);
  };
  loader.classList.add('is-active');
  document.documentElement.classList.add('loading-active');
  const startedAt=Date.now();
  const minimumDuration=5000;
  const fill=document.getElementById('loader-progress-fill');
  const percent=document.getElementById('loader-percent');
  const progressTrack=()=>{
    const elapsed=Date.now()-startedAt;
    const value=Math.min(100,Math.floor((elapsed/minimumDuration)*100));
    if(fill)fill.style.width=value+'%';
    if(percent)percent.textContent=value+'%';
    if(loader.querySelector('.loader-progress'))loader.querySelector('.loader-progress').setAttribute('aria-valuenow',String(value));
    if(value<100&&!finished)window.requestAnimationFrame(progressTrack);
  };
  let finished=false;
  window.requestAnimationFrame(progressTrack);
  const finishAfterMinimum=()=>{
    if(finished)return;
    finished=true;
    const remaining=Math.max(0,minimumDuration-(Date.now()-startedAt));
    window.setTimeout(finish,remaining);
  };
  window.addEventListener('load',finishAfterMinimum,{once:true});
  window.setTimeout(finishAfterMinimum,minimumDuration);
  const skip=document.getElementById('loader-skip');
  if(skip)skip.addEventListener('click',()=>{finished=true;finish();});
})();


// Community Meme Gallery category filters.
(function initCommunityMemeGallery(){
  const gallery=document.getElementById('community-meme-grid');
  if(!gallery)return;
  const cards=[...gallery.querySelectorAll('.community-meme-card')];
  const filters=[...document.querySelectorAll('.meme-filter')];
  const empty=document.getElementById('meme-gallery-empty');
  filters.forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.filter||'all';
    filters.forEach(filter=>{
      const active=filter===button;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    });
    let visible=0;
    cards.forEach(card=>{
      const show=selected==='all'||card.dataset.category===selected;
      card.hidden=!show;
      if(show)visible++;
    });
    if(empty)empty.hidden=visible!==0;
  }));
})();


// MUISYLE multi-page experience: lightweight client-side routes with shareable URLs.
(function initMuisylePages(){
  const pageMap={
    home:["home","ticker","home-hub","coming-soon","final-cta"],
    about:["about","vision","faq"],
    universe:["gallery"],
    onchain:["token-ecosystem"],
    memes:["meme-gallery"],
    profiles:["community-profiles"],
    community:["community"],
    launch:["launch-portal"]
  };
  const labels=[
    ["home","Home"],["about","About"],["universe","Universe"],
    ["onchain","On-Chain"],["memes","Meme Gallery"],
    ["profiles","Profiles"],["community","Community"]
  ];
  const nav=document.getElementById("primary-navigation");
  const menu=document.querySelector(".menu");
  const main=document.querySelector("main");
  if(!nav||!main)return;
  const sections=[...main.children].filter(el=>el.id||el.classList.contains("ticker")||el.classList.contains("final-cta"));
  const pageUrl=(page)=>"?page="+encodeURIComponent(page);
  nav.innerHTML=labels.map(([key,label])=>'<a href="'+pageUrl(key)+'" data-page-link="'+key+'">'+label+'</a>').join("")
    +'<a class="nav-buy" href="'+pageUrl("home")+'#coming-soon">BUY <span>↗</span></a>'
    +'<a class="nav-cta" href="https://x.com/memeelysium" target="_blank" rel="noreferrer">Join on X ↗</a>';
  const brandLinks=document.querySelectorAll(".site-header .brand,.site-footer .brand");
  brandLinks.forEach(link=>link.setAttribute("href",pageUrl("home")));
  function setPage(page,scroll=true){
    const active=pageMap[page]?page:"home";
    document.body.dataset.page=active;
    sections.forEach(section=>{
      const key=section.id||(section.classList.contains("ticker")?"ticker":"final-cta");
      section.classList.toggle("page-hidden",!pageMap[active].includes(key));
    });
    nav.querySelectorAll("[data-page-link]").forEach(link=>{
      if(link.dataset.pageLink===active)link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
    const title=labels.find(item=>item[0]===active)?.[1]||"Home";
    document.title="MUISYLE — "+title+" | Cosmic Universe";
    if(scroll)window.scrollTo({top:0,behavior:"instant"});
    if(menu){
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded","false");
      menu.setAttribute("aria-label","Open navigation");
      const icon=menu.querySelector(".menu-icon");if(icon)icon.textContent="☰";
      document.body.classList.remove("navigation-open");
    }
  }
  function currentPage(){
    const params=new URLSearchParams(window.location.search);
    return params.get("page")||"home";
  }
  function navigate(page,hash){
    const url=pageUrl(page)+(hash||"");
    history.pushState({page},"",url);
    setPage(page,!hash);
    if(hash){const target=document.getElementById(hash.slice(1));if(target)target.scrollIntoView({behavior:"smooth",block:"start"});}
  }
  nav.addEventListener("click",event=>{
    const link=event.target.closest("a[data-page-link],a.nav-buy");
    if(!link)return;
    event.preventDefault();
    const page=link.dataset.pageLink||"home";
    navigate(page,link.hash);
  });
  document.addEventListener("click",event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||link.closest("#primary-navigation"))return;
    const targetId=link.getAttribute("href").slice(1);
    const target=document.getElementById(targetId);
    if(!target)return;
    const targetPage=Object.keys(pageMap).find(key=>pageMap[key].includes(targetId));
    if(targetPage&&targetPage!==document.body.dataset.page){
      event.preventDefault();navigate(targetPage,"#"+targetId);
    }
  });
  // Hidden cosmic portal: five deliberate clicks on clear page backgrounds.
  let blankClicks=0,blankClickTimer=null;
  document.addEventListener("click",event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(event.target.closest('a,button,input,textarea,select,summary,[role="button"],nav,.menu')){blankClicks=0;return;}
    const surface=event.target.matches('body,main,section,.hero,.home-hub-section,.universe-section,.token-ecosystem-section,.coming-soon-section,.final-cta,.cosmic-hero-art,.home-hub-wrap,.universe-showcase');
    if(!surface){blankClicks=0;return;}
    blankClicks++;
    window.clearTimeout(blankClickTimer);
    if(blankClicks>=5){blankClicks=0;window.clearTimeout(blankClickTimer);navigate("launch");return;}
    blankClickTimer=window.setTimeout(()=>{blankClicks=0;},3500);
  });
  window.addEventListener("popstate",()=>setPage(currentPage()));
  setPage(currentPage(),false);
  if(window.location.hash){
    const target=document.getElementById(window.location.hash.slice(1));
    if(target&&target.classList.contains("page-hidden")){
      const targetPage=Object.keys(pageMap).find(key=>pageMap[key].includes(target.id));
      if(targetPage){history.replaceState({page:targetPage},"","?page="+targetPage+window.location.hash);setPage(targetPage,false);}
    }
  }
})();


// Home page: lightweight cosmic meme prompt generator.
(function initHomeMemeLab(){
  const output=document.getElementById("home-meme-prompt");
  const generate=document.getElementById("generate-meme-prompt");
  const copy=document.getElementById("copy-meme-prompt");
  const feedback=document.getElementById("prompt-feedback");
  if(!output||!generate)return;
  const prompts=[
    "POV: You came to Elysium for one transaction and found an entire universe.",
    "That moment when the community says GM and your timeline becomes a nebula.",
    "Me checking the explorer for the 17th time like something changed in 30 seconds.",
    "When your meme gets more attention than your carefully written thread.",
    "Expectation: one quick scroll. Reality: lost in the MUISYLE universe.",
    "POV: Your portfolio is quiet but your meme folder is building an empire.",
    "When someone asks what you do here and the answer is: vibes, memes, and on-chain curiosity."
  ];
  let last=-1;
  generate.addEventListener("click",()=>{
    let next;
    do{next=Math.floor(Math.random()*prompts.length)}while(next===last&&prompts.length>1);
    last=next;output.textContent=prompts[next];
    if(feedback)feedback.textContent="A fresh idea just entered your orbit.";
  });
  if(copy)copy.addEventListener("click",async()=>{
    const value=output.textContent||"";
    try{
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);if(feedback)feedback.textContent="Prompt copied. Go make something cosmic!";}
      else{if(feedback)feedback.textContent="Select and copy the prompt above to use it.";}
    }catch(error){if(feedback)feedback.textContent="Copy unavailable here — select the prompt above instead.";}
  });
})();
