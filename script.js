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



// MUISYLE AI Agent Chat — set this to the deployed Worker URL after deployment.
(()=> {
 const API_URL = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/chat';
 const form=document.getElementById('ai-chat-form');
 const input=document.getElementById('ai-chat-input');
 const messages=document.getElementById('ai-chat-messages');
 if(!form||!input||!messages)return;
 const history=[];
 const addMessage=(role,text)=>{
   const item=document.createElement('div');item.className='ai-message '+role;
   const label=document.createElement('span');label.className='ai-message-label';label.textContent=role==='assistant'?'MUISYLE AI':'YOU';
   const p=document.createElement('p');p.textContent=text;item.append(label,p);messages.appendChild(item);messages.scrollTop=messages.scrollHeight;return item;
 };
 const send=async(text)=>{
   const clean=text.trim();if(!clean)return;
   input.value='';input.disabled=true;form.querySelector('button').disabled=true;
   addMessage('user',clean);history.push({role:'user',content:clean});
   const pending=addMessage('assistant','Connecting to the cosmic network…');
   try{
     if(API_URL.includes('YOUR-WORKER-NAME'))throw new Error('The AI service is not connected yet. The secure backend must be deployed and its URL configured.');
     const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-12)})});
     const data=await response.json();
     if(!response.ok)throw new Error(data.error||'The AI service could not respond.');
     const answer=String(data.reply||'I could not generate a response.').slice(0,8000);
     pending.querySelector('p').textContent=answer;history.push({role:'assistant',content:answer});
   }catch(error){pending.querySelector('p').textContent=error.message||'Connection failed. Please try again.';history.pop();}
   finally{input.disabled=false;form.querySelector('button').disabled=false;input.focus();messages.scrollTop=messages.scrollHeight;}
 };
 form.addEventListener('submit',event=>{event.preventDefault();send(input.value)});
 document.querySelectorAll('.ai-suggestions [data-prompt]').forEach(button=>button.addEventListener('click',()=>send(button.dataset.prompt)));
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit()}});
})();
