const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPhotoPicker({api,onSaved=()=>{}}){
 if(!document.querySelector('link[data-photo-picker]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/admin/photo-picker.css';css.dataset.photoPicker='';document.head.append(css);}
 const dialog=document.createElement('dialog');dialog.className='photo-picker';dialog.setAttribute('aria-labelledby','picker-title');
 dialog.innerHTML=`<form class="picker-form"><header><div><p>FOTO OP UW WEBSITE</p><h2 id="picker-title">Kies een foto</h2><span class="picker-subtitle"></span></div><button type="button" data-close aria-label="Fotokeuze sluiten">×</button></header><div class="picker-body"><div class="picker-compare"><figure><img data-current alt="Huidige foto"><figcaption>Nu op de website</figcaption></figure><span aria-hidden="true">→</span><figure><img data-next alt="Voorbeeld van uw nieuwe keuze"><figcaption>Uw nieuwe keuze</figcaption></figure></div><div class="picker-tabs" role="group" aria-label="Kies een foto of upload"><button type="button" data-tab="library" aria-pressed="true">Uit mijn foto’s</button><button type="button" data-tab="upload" aria-pressed="false">Nieuwe foto uploaden</button></div><div data-library><input type="search" class="picker-search" aria-label="Foto zoeken" placeholder="Zoek op titel of beschrijving"><div class="picker-grid" role="group" aria-label="Beschikbare foto’s"></div></div><div data-upload hidden><label class="picker-upload">Kies een JPG-, PNG- of WebP-foto<input type="file" accept="image/jpeg,image/png,image/webp"><small>Maximaal 6 MB. De foto wordt voor de website geoptimaliseerd.</small></label><label>Titel<input name="title" maxlength="120" placeholder="Bijvoorbeeld: schilderwerk in Enschede"></label><label>Wat staat er op de foto?<input name="alt" maxlength="240" placeholder="Korte beschrijving voor bezoekers"></label></div><p class="picker-note"></p><p class="picker-error" role="alert" hidden></p></div><footer><button type="button" data-close>Annuleren</button><button type="submit" class="picker-save" disabled>Publiceer op deze plek →</button></footer></form>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s);let data,slots,key=null,target=null,selected=null,file=null,previewURL=null,tab='library',busy=false;
 const error=message=>{$('.picker-error').textContent=message;$('.picker-error').hidden=!message;};
 function tabTo(value){tab=value;dialog.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));$('[data-library]').hidden=tab!=='library';$('[data-upload]').hidden=tab!=='upload';update();}
 function update(){
  const current=target||data?.media.find(m=>m.id===data.slots[key]);
  const next=tab==='upload'?previewURL:selected?'/api/admin/media/'+encodeURIComponent(selected.id)+'/image':null;
  $('[data-current]').hidden=!current;$('[data-current]').src=current?'/api/admin/media/'+encodeURIComponent(current.id)+'/image':'';
  $('[data-next]').hidden=!next;$('[data-next]').src=next||'';
  $('.picker-save').disabled=busy||(tab==='upload'?!file:!selected||selected.id===current?.id);
 }
 function renderLibrary(){
  const q=$('.picker-search').value.toLowerCase(),media=data.media.filter(m=>!m.deletedAt&&(m.title+' '+m.alt).toLowerCase().includes(q));
  $('.picker-grid').innerHTML=media.length?media.map(m=>`<button type="button" data-pick="${esc(m.id)}" aria-pressed="${selected?.id===m.id}"><img src="/api/admin/media/${esc(m.id)}/image?thumb=1" alt="${esc(m.alt)}" loading="lazy"><strong>${esc(m.title)}</strong><small>${m.published?'Gepubliceerd':'Concept · wordt gepubliceerd'}</small></button>`).join(''):'<p class="picker-empty">Geen foto’s gevonden. Voeg een nieuwe foto toe.</p>';
  dialog.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{selected=data.media.find(m=>m.id===b.dataset.pick);renderLibrary();update();}));
 }
 async function open(slotKey,media=null){
  key=slotKey;target=media;selected=null;file=null;busy=false;error('');$('.picker-form').reset();$('.picker-grid').replaceChildren();$('.picker-save').disabled=true;
  if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;
  const [photos,system]=await Promise.all([api('/api/admin/media'),api('/api/admin/system')]);data=photos;slots=system.slots;
  const slot=slots.find(s=>s.key===key);
  if(!media&&!slot)throw new Error('Deze fotoplek is niet beschikbaar.');
  $('#picker-title').textContent=media?'Afbeelding vervangen':slot.label;
  $('.picker-subtitle').textContent=media?media.title:'Kies een bestaande foto of voeg een nieuwe toe.';
  $('.picker-save').textContent=media?'Vervang afbeelding op website →':'Publiceer op deze plek →';
  $('.picker-note').textContent=media?'De nieuwe afbeelding verschijnt overal waar deze foto nu wordt gebruikt. Titel en plaatsingen blijven bewaard.':key.startsWith('project-')?'De gekozen foto wordt gepubliceerd en in dit projectalbum gezet. Een foto uit een ander album verhuist naar dit album.':'Alleen deze plek verandert. De vorige foto blijft in uw fotobibliotheek.';
  $('[data-tab="library"]').hidden=!!media;tabTo(media?'upload':'library');renderLibrary();dialog.showModal();
 }
 dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{if(!busy)dialog.close();}));
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 dialog.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tabTo(b.dataset.tab)));
 $('.picker-search').addEventListener('input',renderLibrary);
 $('input[type=file]').addEventListener('change',()=>{
  file=$('input[type=file]').files[0]||null;error('');
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6*1024*1024)){file=null;error('Kies een JPG-, PNG- of WebP-foto van maximaal 6 MB.');}
  if(previewURL)URL.revokeObjectURL(previewURL);previewURL=file?URL.createObjectURL(file):null;
  if(file){$('[name=title]').value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').slice(0,120);$('[name=alt]').value=target?.alt||'';}update();
 });
 $('.picker-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;error('');
  if(tab==='upload'&&!file)return;
  if(tab==='upload'&&(!$('[name=title]').value.trim()||!$('[name=alt]').value.trim())){error('Vul de titel en een korte beschrijving van de foto in.');return;}
  busy=true;update();const original=$('.picker-save').textContent;$('.picker-save').textContent='Foto wordt opgeslagen…';
  try{
   let mediaId=selected?.id;
   if(tab==='upload'){
    const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('De foto kon niet worden gelezen.'));reader.readAsDataURL(file);});
    if(target){await api('/api/admin/media/'+encodeURIComponent(target.id)+'/image',{method:'PUT',body:JSON.stringify({data:image})});mediaId=target.id;}
    else{const created=await api('/api/admin/media',{method:'POST',body:JSON.stringify({data:image,title:$('[name=title]').value.trim(),alt:$('[name=alt]').value.trim()})});mediaId=created.id;}
   }
   if(!target)await api('/api/admin/slots/'+encodeURIComponent(key),{method:'PATCH',body:JSON.stringify({mediaId})});
   dialog.close();await onSaved({key,mediaId,replaced:!!target});
  }catch(err){error(err.message);}finally{busy=false;$('.picker-save').textContent=original;update();}
 });
 return {open:key=>open(key),replace:media=>open(null,media)};
}
