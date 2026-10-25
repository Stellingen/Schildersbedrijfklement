import { defaultContent } from './media-defaults.js';
let content=defaultContent;
try{const response=await fetch('/api/content',{signal:AbortSignal.timeout(5000)});if(response.ok){const data=await response.json();if(Array.isArray(data.media)&&data.slots)content=data;}}catch{}
export const siteContent=content;
const slotSelectors={
 'hero-main':'.hero-main-photo','hero-detail':'.hero-inset img','about':'.about-visual>img',
 'service-binnen':'.service-card[data-service="binnen"] img','service-buiten':'.service-card[data-service="buiten"] img',
 'service-latex':'.service-card[data-service="latex"] img','service-stuc':'.service-card[data-service="stuc"] img',
 'service-behang':'.service-card[data-service="behang"] img','service-plinten':'.service-card[data-service="plinten"] img',
 'project-dark':'.project-card[data-gallery="dark"] img','project-white':'.project-card[data-gallery="white"] img'
};
for(const [key,selector] of Object.entries(slotSelectors)){
 const photo=content.media.find(m=>m.id===content.slots[key]);
 document.querySelectorAll(selector).forEach(image=>{
  image.dataset.mediaSlot=key;
  if(photo){image.src=photo.src;image.alt=photo.alt;image.hidden=false;}
  else{image.hidden=true;image.removeAttribute('src');if(key==='hero-detail')image.closest('.hero-inset').hidden=true;}
 });
}
const gallery=content.media.filter(m=>m.gallery&&m.published&&!m.deletedAt);
document.querySelectorAll('.project-card[data-gallery]').forEach(card=>{
 const photos=gallery.filter(m=>m.album===card.dataset.gallery);
 card.hidden=!photos.length;
 const counter=card.querySelector('.project-photo-count');if(counter)counter.textContent=photos.length+(photos.length===1?' foto':" foto’s");
});
document.querySelectorAll('[data-gallery="all"]').forEach(button=>{
 if(button.classList.contains('text-link')){const text=button.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.textContent='Bekijk alle '+gallery.length+' foto’s ';}
 if(button.classList.contains('hero-gallery-launch'))button.setAttribute('aria-label','Open de projectgalerij met '+gallery.length+' foto’s');
 button.hidden=!gallery.length;
});
for(const grid of document.querySelectorAll('.photo-contact-sheet')){
 grid.replaceChildren(...gallery.map(photo=>{
  const button=document.createElement('button');button.className='photo-detail';button.dataset.gallery='all';button.dataset.photo=photo.photoId;
  const wrap=document.createElement('span'),img=document.createElement('img'),title=document.createElement('strong');img.src=photo.src;img.alt=photo.alt;img.loading='lazy';img.width=600;img.height=450;title.textContent=photo.title;wrap.append(img);button.append(wrap,title);return button;
 }));
}
