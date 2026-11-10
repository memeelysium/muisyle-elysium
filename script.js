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


// MUISYLE Meme Generator — all rendering stays in the visitor's browser.
(()=>{
 const canvas=document.getElementById('meme-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d');
 const topInput=document.getElementById('meme-top');
 const bottomInput=document.getElementById('meme-bottom');
 const sizeInput=document.getElementById('meme-size');
 const colorInput=document.getElementById('meme-color');
 const uploadInput=document.getElementById('meme-upload');
 const clearButton=document.getElementById('meme-clear');
 const downloadButton=document.getElementById('meme-download');
 const presetButtons=[...document.querySelectorAll('.meme-preset')];
 let theme='cosmic';
 let uploadedImage=null;
 const W=canvas.width,H=canvas.height;
 function drawBackground(){
   const palettes={cosmic:['#080e28','#182b62','#542d86'],classic:['#101010','#282828','#050505'],nebula:['#130d35','#542d78','#0c3452']};
   const p=palettes[theme]||palettes.cosmic;
   const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,p[0]);g.addColorStop(.55,p[1]);g.addColorStop(1,p[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   if(theme==='classic'){ctx.fillStyle='rgba(0,0,0,.16)';for(let y=0;y<H;y+=8)ctx.fillRect(0,y,W,2);return}
   for(let i=0;i<90;i++){const x=(i*137.5)%W,y=(i*263.7)%H,r=1+(i%3)*.8;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=i%4===0?'#8cefff':'#ffffff';ctx.globalAlpha=.25+(i%5)*.12;ctx.fill();}ctx.globalAlpha=1;
   const glow=ctx.createRadialGradient(W*.52,H*.47,20,W*.52,H*.47,360);glow.addColorStop(0,theme==='nebula'?'#e47aff66':'#79eaff55');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
   const px=W*.52,py=H*.5,rad=W*.19;const pg=ctx.createRadialGradient(px-rad*.4,py-rad*.45,5,px,py,rad*1.3);pg.addColorStop(0,'#b8faff');pg.addColorStop(.3,theme==='nebula'?'#b36bdf':'#4ab9dc');pg.addColorStop(1,'#172b67');ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();
   ctx.strokeStyle='#9aeaff88';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(px,py,rad*1.75,rad*.48,-.28,0,Math.PI*2);ctx.stroke();
 }
 function drawImageCover(img){
   const scale=Math.max(W/img.width,H/img.height),w=img.width*scale,h=img.height*scale;
   ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h);
   const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#00000066');shade.addColorStop(.48,'#00000008');shade.addColorStop(1,'#00000077');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 }
 function wrapText(text,maxWidth,font){
   ctx.font=font;const words=(text||'').trim().split(/\s+/).filter(Boolean);const lines=[];let line='';
   words.forEach(word=>{const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});if(line)lines.push(line);return lines.slice(0,3);
 }
 function drawCaption(text,y,alignTop){
   if(!text)return;
   const base=Number(sizeInput.value)||54;let fontSize=base;let lines;
   do{const font='900 '+fontSize+'px Impact, "Arial Black", sans-serif';lines=wrapText(text,W-90,font);if(lines.every(line=>{ctx.font=font;return ctx.measureText(line).width<=W-90}))break;fontSize-=2}while(fontSize>24);
   const font='900 '+fontSize+'px Impact, "Arial Black", sans-serif';ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
   const lineHeight=fontSize*1.12;const startY=alignTop?y+(lines.length-1)*lineHeight/2:y-(lines.length-1)*lineHeight/2;
   lines.forEach((line,i)=>{const yy=startY+(i-(lines.length-1)/2)*lineHeight;ctx.lineWidth=Math.max(7,fontSize*.16);ctx.strokeStyle='#050713';ctx.fillStyle=colorInput.value||'#ffffff';ctx.shadowColor='#000000aa';ctx.shadowBlur=8;ctx.strokeText(line,W/2,yy,W-70);ctx.fillText(line,W/2,yy,W-70)});ctx.shadowBlur=0;
 }
 function render(){
   ctx.clearRect(0,0,W,H);
   if(uploadedImage){drawImageCover(uploadedImage)}else drawBackground();
   // Subtle frame for a polished shareable image.
   ctx.strokeStyle='#b6efff88';ctx.lineWidth=5;ctx.strokeRect(12,12,W-24,H-24);
   drawCaption(topInput.value,90,true);
   drawCaption(bottomInput.value,H-92,false);
   ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font='600 18px Arial,sans-serif';ctx.fillStyle='#ffffffbb';ctx.fillText('MUISYLE ✦',W-30,H-27);
 }
 [topInput,bottomInput,sizeInput,colorInput].forEach(el=>el.addEventListener('input',render));
 presetButtons.forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.theme;presetButtons.forEach(b=>b.classList.toggle('active',b===button));uploadedImage=null;uploadInput.value='';render()}));
 uploadInput.addEventListener('change',()=>{
   const file=uploadInput.files&&uploadInput.files[0];if(!file)return;
   if(!file.type.startsWith('image/')){alert('Please choose an image file.');return}
   if(file.size>12*1024*1024){alert('Please choose an image smaller than 12 MB.');uploadInput.value='';return}
   const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{uploadedImage=img;render()};img.onerror=()=>alert('This image could not be opened.');img.src=reader.result};reader.readAsDataURL(file);
 });
 clearButton.addEventListener('click',()=>{uploadedImage=null;uploadInput.value='';render()});
 downloadButton.addEventListener('click',()=>{
   render();const link=document.createElement('a');link.download='muisyle-meme.png';link.href=canvas.toDataURL('image/png');link.click();
 });
 render();
})();
