const menu=document.querySelector('.menu');const nav=document.querySelector('nav');if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}))}const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();const revealItems=document.querySelectorAll('.reveal');if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});revealItems.forEach(item=>observer.observe(item))}else{revealItems.forEach(item=>item.classList.add('is-visible'))}

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
  let finished=false;
  const finishAfterMinimum=()=>{
    if(finished)return;
    finished=true;
    const remaining=Math.max(0,5000-(Date.now()-startedAt));
    window.setTimeout(finish,remaining);
  };
  window.addEventListener('load',finishAfterMinimum,{once:true});
  window.setTimeout(finishAfterMinimum,5000);
  const skip=document.getElementById('loader-skip');
  if(skip)skip.addEventListener('click',()=>{finished=true;finish();});
})();
