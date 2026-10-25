import {createPhotoPicker} from './admin/photo-picker.js';
import {siteContent} from './content.js';
import {enableTextEditing} from './text-editor.js';
const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});const session=await response.json();
if(session.authenticated){
 const css=document.createElement('link');css.rel='stylesheet';css.href='/edit-mode.css';document.head.append(css);
 const api=async(url,options={})=>{const r=await fetch(url,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),'X-CSRF-Token':session.csrf}});const d=await r.json();if(!r.ok)throw new Error(d.error||'De wijziging kon niet worden opgeslagen.');return d;};
 const picker=createPhotoPicker({api,onSaved(){location.reload();}});
 const bar=document.createElement('div');bar.className='k-edit-bar';bar.innerHTML='<strong>Website bewerken</strong><span>Kies een foto of klik op een tekst om die te wijzigen.</span><a href="/admin/#fotos">Naar dashboard ↗</a><button type="button">Klaar met bewerken ✓</button>';document.body.append(bar);
 bar.querySelector('button').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.delete('bewerken');location.assign(url.pathname+url.search+url.hash);});
 document.querySelectorAll('a[href]').forEach(a=>{const raw=a.getAttribute('href');if(raw?.startsWith('/')&&!raw.startsWith('/admin')){const url=new URL(raw,location.origin);url.searchParams.set('bewerken','1');a.href=url.pathname+url.search+url.hash;}});
 enableTextEditing({api,bar});
 const markers=[];
 function marker(image,label,action){
  const button=document.createElement('button');button.type='button';button.className='k-edit-pin';button.textContent='✎ '+label;button.setAttribute('aria-label',label+' wijzigen');
  button.addEventListener('click',()=>{void action().catch(err=>{const message=document.createElement('p');message.className='k-edit-message';message.setAttribute('role','alert');message.textContent=err.message;bar.append(message);setTimeout(()=>message.remove(),6000);});});
  document.body.append(button);markers.push({image,button});
 }
 document.querySelectorAll('img[data-media-slot]').forEach(image=>marker(image,({ 'hero-main':'Hoofdfoto','hero-detail':'Detailfoto','about':'Over Klement','project-dark':'Projectfoto','project-white':'Projectfoto'})[image.dataset.mediaSlot]||'Dienstfoto',()=>picker.open(image.dataset.mediaSlot)));
 document.querySelectorAll('.photo-contact-sheet [data-photo]').forEach(card=>{const media=siteContent.media.find(m=>m.photoId===card.dataset.photo);const image=card.querySelector('img');if(media&&image)marker(image,'Projectfoto',()=>picker.replace(media));});
 function place(){for(const {image,button} of markers){const r=image.getBoundingClientRect();button.hidden=image.hidden||!r.width||r.bottom<0||r.top>innerHeight;button.style.top=Math.max(8,r.top+10)+'px';button.style.left=Math.max(8,r.left+10)+'px';}}
 let frame=null;const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);document.querySelectorAll('img').forEach(img=>img.addEventListener('load',schedule));place();
}
