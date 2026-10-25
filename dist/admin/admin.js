const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg aria-hidden="true"><use href="/admin/icons.svg#${name}"/></svg>`;
const fmt=n=>Number(n||0).toLocaleString('nl-NL');
const date=(v,full=false)=>v?new Date(v).toLocaleString('nl-NL',{day:'numeric',month:'short',...(full?{hour:'2-digit',minute:'2-digit',year:'numeric'}:{})}):'—';
const names={binnen:'Binnen- & kozijnwerk',buiten:'Buitenschilderwerk',latex:'Latex spuiten',stuc:'Stucwerk',behang:'Behangwerk',plinten:'Plinten & afwerking',advies:'Persoonlijk overleg'};
const statusNames={nieuw:'Nieuw',contact:'Contact opgenomen',gepland:'Ingepland',afgerond:'Afgerond',archief:'Gearchiveerd'};
const pageNames={'/':'Startpagina','/diensten/':'Ons vakwerk','/projecten/':'Projecten','/over-klement/':'Over Klement','/kleurstudio/':'3D-studio','/werkwijze/':'Werkwijze','/offerte/':'Offerte aanvragen','/contact/':'Contact','/privacy/':'Privacy'};
const viewNames={overzicht:'Overzicht',aanvragen:'Aanvragen',fotos:'Foto’s & plaatsing',instellingen:'Instellingen'};
let session=null,system=null,activeView='overzicht',requestPage=1,requestSequence=0,mediaState={media:[],slots:{}},mediaFilter='active',editingRequest=null,editingMedia=null,uploadURL=null,toastTimer=null;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function error(target,message){target.textContent=message;target.hidden=!message;}
function empty(title,description='',compact=false){return `<div class="empty${compact?' compact-empty':''}">${icon('inbox')}<strong>${e(title)}</strong><span>${e(description)}</span></div>`;}
async function api(url,options={}){
 const method=options.method||'GET';
 const response=await fetch(url,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(session?.csrf?{'X-CSRF-Token':session.csrf}:{}),...options.headers}});
 const result=await response.json().catch(()=>({error:'De server gaf geen geldig antwoord.'}));
 if(!response.ok){if(response.status===401&&url!=='/api/auth/login')showLogin('Uw sessie is verlopen. Log opnieuw in.');throw new Error(result.error||'Deze actie is niet gelukt.');}
 return result;
}
function showLogin(message=''){
 session=null;$('#loading').hidden=true;$('#login').hidden=false;$('#dashboard').hidden=true;
 $$('dialog[open]').forEach(d=>d.close());error($('#login-error'),message);
}
async function enterDashboard(auth){
 session=auth;system=await api('/api/admin/system');$('#login').hidden=true;$('#loading').hidden=true;$('#dashboard').hidden=false;
 $('#account-name').textContent=auth.username;$('#login-form').reset();await navigate();
}
$('#show-password').addEventListener('click',()=>{const input=$('#login-form [name=password]');const show=input.type==='password';input.type=show?'text':'password';$('#show-password').textContent=show?'Verberg':'Toon';$('#show-password').setAttribute('aria-label',show?'Wachtwoord verbergen':'Wachtwoord tonen');});
$('#login-form').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('#login-form [type=submit]');button.disabled=true;error($('#login-error'),'');
 try{const f=new FormData(event.currentTarget);await enterDashboard(await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})}));}
 catch(err){error($('#login-error'),err.message);}finally{button.disabled=false;}
});
$('#logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});showLogin();}catch(err){toast(err.message);}});
$('#menu-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'Menu sluiten':'Menu openen');});
document.addEventListener('click',event=>{if(!event.target.closest('#sidebar,#menu-toggle')){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
async function navigate(){
 if(!session)return;
 activeView=Object.hasOwn(viewNames,location.hash.slice(1))?location.hash.slice(1):'overzicht';
 $$('.view').forEach(v=>v.hidden=v.id!=='view-'+activeView);
 $$('[data-nav]').forEach(a=>{const active=a.dataset.nav===activeView;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#breadcrumb').textContent=viewNames[activeView];document.title=viewNames[activeView]+' | Klement beheer';
 $('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');error($('#page-error'),'');
 try{if(activeView==='overzicht')await loadOverview();if(activeView==='aanvragen')await loadRequests();if(activeView==='fotos')await loadMedia();if(activeView==='instellingen')renderSettings();}catch(err){error($('#page-error'),err.message);}
}
window.addEventListener('hashchange',()=>void navigate());
const badge=status=>`<span class="status status-${e(status)}">${e(statusNames[status]||status)}</span>`;
function requestTable(items){
 if(!items.length)return empty('Nog geen aanvragen','Nieuwe websiteaanvragen verschijnen hier automatisch.');
 return '<table><thead><tr><th>Klant</th><th>Werkzaamheden</th><th>Locatie</th><th>Ontvangen</th><th>Status</th><th></th></tr></thead><tbody>'+items.map(r=>`<tr data-id="${e(r.id)}"><td><button type="button" data-request="${e(r.id)}">${e(r.name)}</button><small>${e(r.reference)}</small></td><td>${e(r.services.map(s=>names[s]||s).join(', '))}</td><td>${e(r.place)}</td><td>${e(date(r.created_at))}</td><td>${badge(r.status)}</td><td aria-hidden="true">↗</td></tr>`).join('')+'</tbody></table>';
}
function bindRequestRows(container){container.querySelectorAll('tr[data-id]').forEach(row=>row.addEventListener('click',()=>openRequest(row.dataset.id)));}
function renderChart(daily){
 const days=Number($('#period').value),now=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T12:00:00Z');
 const data=Array.from({length:days},(_,i)=>{const day=new Date(now);day.setUTCDate(day.getUTCDate()-(days-1-i));const key=day.toISOString().slice(0,10);return {day:key,visitors:0,views:0,...daily.find(d=>d.day===key)};});
 const max=Math.max(4,...data.map(d=>Number(d.visitors))),w=650,h=220,left=35,right=15,top=15,bottom=37;
 const x=i=>left+i*(w-left-right)/Math.max(1,data.length-1),y=v=>h-bottom-v/max*(h-top-bottom);
 const points=data.map((d,i)=>`${x(i)},${y(d.visitors)}`).join(' ');
 let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Dagelijks geschat aantal bezoekers in de afgelopen ${days} dagen"><title>Geschatte bezoekers per dag. Dezelfde gegevens staan in de tabel.</title>`;
 for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`;}
 svg+=`<polygon class="chart-area" points="${left},${y(0)} ${points} ${w-right},${y(0)}"/><polyline class="chart-line" points="${points}"/>`;
 data.forEach((d,i)=>{svg+=`<circle class="chart-dot" cx="${x(i)}" cy="${y(d.visitors)}" r="${days>30?2:3}"><title>${e(date(d.day+'T12:00:00Z'))}: ${d.visitors} bezoekers, ${d.views} paginaweergaven</title></circle>`;if(i===0||i===data.length-1||i===Math.floor(data.length/2))svg+=`<text class="chart-label" x="${x(i)}" y="${h-9}" text-anchor="${i===0?'start':i===data.length-1?'end':'middle'}">${e(date(d.day+'T12:00:00Z'))}</text>`;});
 $('#visitors-chart').innerHTML=svg+'</svg>'+(!daily.length?'<p class="chart-empty">De telling staat klaar.<br>Bezoek verschijnt hier zodra het wordt gemeten.</p>':'');
 $('#chart-table').innerHTML='<table><thead><tr><th>Datum</th><th>Geschatte bezoekers</th><th>Paginaweergaven</th></tr></thead><tbody>'+data.map(d=>`<tr><td>${e(date(d.day+'T12:00:00Z'))}</td><td>${fmt(d.visitors)}</td><td>${fmt(d.views)}</td></tr>`).join('')+'</tbody></table>';
}
function rankList(items,label){return items.length?'<div class="rank-list">'+items.map(r=>`<div class="rank-row"><span>${e(label(r))}</span><strong>${fmt(r.views)}</strong></div>`).join('')+'</div>':empty('Nog geen metingen','Dit overzicht groeit met uw website mee.',true);}
async function loadOverview(){
 const [s,recent]=await Promise.all([api('/api/admin/stats?days='+$('#period').value),api('/api/admin/enquiries')]);
 const views=s.daily.reduce((n,d)=>n+Number(d.views),0),visitors=s.daily.reduce((n,d)=>n+Number(d.visitors),0),enquiries=s.requestDays.reduce((n,d)=>n+Number(d.count),0);
 const cards=[['Geschatte bezoekers',visitors,'visitors','Dagtotalen in gekozen periode'],['Paginaweergaven',views,'trend','In de gekozen periode'],['Nieuwe aanvragen',enquiries,'inbox',`<b>${fmt(s.requests.fresh)}</b> nog nieuw · totaal ${fmt(s.requests.total)}`],['Foto’s in beheer',s.pictures.total,'photo',`${fmt(s.requests.followUps)} aanvragen om op te volgen`]];
 $('#stats-cards').innerHTML=cards.map(([label,value,i,foot])=>`<article class="stat"><span class="stat-label">${label}</span><span class="stat-icon">${icon(i)}</span><strong class="stat-value">${fmt(value)}</strong><span class="stat-foot">${foot}</span></article>`).join('');
 $('#nav-new').hidden=!Number(s.requests.fresh);$('#nav-new').textContent=fmt(s.requests.fresh);
 $('#system-notice').hidden=system.email;$('#system-notice').textContent='Aanvragen worden in uw dashboard opgeslagen. E-mailmeldingen zijn nog niet gekoppeld; controleer uw aanvragen hier.';
 renderChart(s.daily);
 $('#quick-actions').innerHTML=`<a href="#aanvragen" class="quick-action"><span>${icon('inbox')}</span><div><strong>${fmt(s.requests.fresh)} nieuwe aanvragen</strong><small>Bekijk wensen en neem contact op</small></div><span>→</span></a><a href="#fotos" class="quick-action"><span>${icon('photo')}</span><div><strong>Foto’s & projectgalerij</strong><small>Toevoegen, aanpassen en plaatsen</small></div><span>→</span></a><a href="/" target="_blank" rel="noopener" class="quick-action"><span>${icon('external')}</span><div><strong>Bekijk uw website</strong><small>Zie wat uw bezoekers zien</small></div><span>↗</span></a>`;
 $('#top-pages').innerHTML=rankList(s.pages,r=>pageNames[r.path]||r.path);$('#top-sources').innerHTML=rankList(s.sources,r=>r.source);
 $('#devices').innerHTML=s.devices.map(d=>`<span>${e(d.device)} <b>${fmt(d.views)}</b></span>`).join('');
 $('#activity').innerHTML=s.activity.length?s.activity.map(a=>`<div class="activity-item"><p>${e(a.action)}</p><time>${e(date(a.created_at,true))}</time></div>`).join(''):empty('Nog geen activiteit','Uw wijzigingen verschijnen hier.',true);
 $('#recent-requests').innerHTML=requestTable(recent.items.slice(0,5));bindRequestRows($('#recent-requests'));
 $('#updated').textContent='Bijgewerkt '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})+(s.since?' · Telling sinds '+date(s.since):' · Telling start bij het eerste gemeten bezoek');
}
$('#period').addEventListener('change',()=>loadOverview().catch(err=>error($('#page-error'),err.message)));
$('#refresh').addEventListener('click',async()=>{const b=$('#refresh');b.disabled=true;try{await loadOverview();toast('Overzicht bijgewerkt.');}catch(err){error($('#page-error'),err.message);}finally{b.disabled=false;}});
$('#chart-table-toggle').addEventListener('click',()=>{const show=$('#chart-table').hidden;$('#chart-table').hidden=!show;$('#chart-table-toggle').textContent=show?'Verberg tabel':'Toon tabel';$('#chart-table-toggle').setAttribute('aria-expanded',String(show));});
async function loadRequests(){
 const seq=++requestSequence;const query=new URLSearchParams({page:requestPage,q:$('#request-search').value,status:$('#status-filter').value});
 const data=await api('/api/admin/enquiries?'+query);if(seq!==requestSequence)return;
 $('#requests-table').innerHTML=requestTable(data.items);bindRequestRows($('#requests-table'));
 $('#request-count').textContent=fmt(data.total)+' aanvraag'+(data.total===1?'':'en');
 $('#page-label').textContent=`Pagina ${requestPage} van ${Math.max(1,Math.ceil(data.total/20))}`;$('#page-prev').disabled=requestPage<=1;$('#page-next').disabled=requestPage*20>=data.total;
}
let searchTimer;$('#request-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{requestPage=1;loadRequests().catch(err=>error($('#page-error'),err.message));},250);});
$('#status-filter').addEventListener('change',()=>{requestPage=1;void loadRequests().catch(err=>error($('#page-error'),err.message));});
$('#page-prev').addEventListener('click',()=>{requestPage--;void loadRequests().catch(err=>error($('#page-error'),err.message));});$('#page-next').addEventListener('click',()=>{requestPage++;void loadRequests().catch(err=>error($('#page-error'),err.message));});
async function openRequest(id){
 try{
  const r=await api('/api/admin/enquiries/'+encodeURIComponent(id));editingRequest=r;
  $('#request-reference').textContent=r.reference+' · '+date(r.created_at,true);$('#request-title').textContent=r.name;
  const summary=[['Werkzaamheden',r.services.map(k=>names[k]||k).join(', ')],['Woningtype',r.property],['Planning',r.planning],['Uw klant schrijft',r.description||'Geen aanvullende toelichting'],['3D-keuze',r.color?Object.entries(r.color).map(([k,v])=>`${({name:'Keuze',value:'Kleur',code:'Code',scene:'Onderdeel',surface:'Oppervlak',wall:'Wanden',finish:'Glans',texture:'Structuur'})[k]||k}: ${v}`).join('\n'):'Geen kleur- of afwerkingskeuze'],['Contacttoestemming',date(r.consent_at,true)]];
  $('#request-summary').innerHTML='<dl>'+summary.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')+'</dl>';
  const actions=$('#contact-actions');actions.replaceChildren();const mail=document.createElement('a');mail.className='btn';mail.href='mailto:'+r.email+'?subject='+encodeURIComponent('Uw aanvraag bij Klement · '+r.reference);mail.textContent='E-mail klant ↗';actions.append(mail);
  if(r.phone&&/^[+\d\s().-]+$/.test(r.phone)){const phone=document.createElement('a');phone.className='btn';phone.href='tel:'+r.phone.replace(/[^+\d]/g,'');phone.textContent='Bel klant ↗';actions.append(phone);}
  const f=$('#request-form');for(const key of ['name','email','phone','place','status','notes'])f.elements[key].value=r[key]||'';f.elements.followUp.value=r.follow_up?String(r.follow_up).slice(0,10):'';
  $('#request-email-status').textContent='E-mailmelding: '+(system.emailLabels[r.email_status]||r.email_status);$('#resend-email').hidden=!system.email;$('#resend-email').disabled=r.email_status==='sending';
  error($('#request-dialog .dialog-error'),'');$('#request-dialog').showModal();
 }catch(err){toast(err.message);}
}
$('#request-form').addEventListener('submit',async event=>{
 event.preventDefault();const f=event.currentTarget,b=f.querySelector('[type=submit]');b.disabled=true;const data=Object.fromEntries(new FormData(f));
 try{await api('/api/admin/enquiries/'+editingRequest.id,{method:'PATCH',body:JSON.stringify(data)});$('#request-dialog').close();toast('Aanvraag bijgewerkt.');await navigate();}catch(err){error($('#request-dialog .dialog-error'),err.message);}finally{b.disabled=false;}
});
$('#resend-email').addEventListener('click',async()=>{const b=$('#resend-email');b.disabled=true;try{await api('/api/admin/enquiries/'+editingRequest.id+'/notify',{method:'POST'});$('#request-email-status').textContent='De e-mailmelding staat klaar voor verzending.';toast('E-mailmelding opnieuw klaargezet.');}catch(err){error($('#request-dialog .dialog-error'),err.message);}finally{b.disabled=false;}});
async function loadMedia(){mediaState=await api('/api/admin/media');renderMedia();}
function placementsFor(id){return system.slots.filter(s=>mediaState.slots[s.key]===id);}
function renderMedia(){
 const active=mediaState.media.filter(m=>!m.deletedAt);$('#photo-count').textContent=active.length;
 const search=$('#media-search').value.toLowerCase();
 const media=mediaState.media.filter(m=>(mediaFilter==='trash'?!!m.deletedAt:!m.deletedAt)&& (mediaFilter!=='gallery'||m.gallery&&m.published)&& (mediaFilter!=='draft'||!m.published)&&(m.title+' '+m.alt+' '+m.caption).toLowerCase().includes(search));
 $('#media-grid').innerHTML=media.length?media.map(m=>`<article class="media-card"><button class="media-open" data-media="${e(m.id)}"><div class="media-image"><img loading="lazy" src="/api/admin/media/${e(m.id)}/image?thumb=1" alt="${e(m.alt)}"><span class="status ${m.published?'status-public':''}">${m.deletedAt?'Prullenbak':m.published?'Gepubliceerd':'Concept'}</span></div><div class="media-card-body"><h3>${e(m.title)}</h3><p>${placementsFor(m.id).length?placementsFor(m.id).length+' vaste plek'+(placementsFor(m.id).length===1?'':'ken'):'Geen vaste plek'}${m.gallery?' · In projectgalerij':''}</p><div class="media-tags">${placementsFor(m.id).slice(0,2).map(s=>`<span>${e(s.label.split(' · ')[0])}</span>`).join('')}${m.gallery?'<span>Galerij</span>':''}${m.bytes?`<span>${(m.bytes/1024/1024).toFixed(1)} MB</span>`:''}</div></div></button>${m.deletedAt?`<button class="btn restore" data-restore="${e(m.id)}">Herstellen</button>`:''}</article>`).join(''):empty(mediaFilter==='trash'?'De prullenbak is leeg':'Geen foto’s gevonden','Voeg een foto toe of pas uw filter aan.');
 $$('#media-grid [data-media]').forEach(b=>b.addEventListener('click',()=>{const m=mediaState.media.find(x=>x.id===b.dataset.media);if(!m.deletedAt)openMedia(m.id);}));
 $$('#media-grid [data-restore]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/api/admin/media/'+b.dataset.restore+'/restore',{method:'POST'});await loadMedia();toast('Foto hersteld als concept. Kies de plaatsing en publiceer de foto.');}catch(err){toast(err.message);b.disabled=false;}}));
 $('#placements').innerHTML=system.slots.map(s=>{const m=active.find(m=>m.id===mediaState.slots[s.key]);return `<button class="placement-row" data-slot="${e(s.key)}" ${m?'':'disabled'}>${m?`<img src="/api/admin/media/${e(m.id)}/image?thumb=1" alt="">`:icon('photo')}<span><strong>${e(s.label)}</strong><small>${e(m?.title||'Geen foto ingesteld · kies een foto hierboven')}</small></span><span aria-hidden="true">${m?'↗':''}</span></button>`;}).join('');
 $$('#placements [data-slot]').forEach(b=>b.addEventListener('click',()=>openMedia(mediaState.slots[b.dataset.slot])));
}
function openMedia(id){
 const m=mediaState.media.find(x=>x.id===id);if(!m||m.deletedAt)return;editingMedia=m;
 $('#media-title').textContent=m.title;$('#media-preview').src='/api/admin/media/'+m.id+'/image';$('#media-preview').alt=m.alt;
 const form=$('#media-form');for(const k of ['title','caption','alt','album','sort'])form.elements[k].value=m[k]??'';for(const k of ['published','gallery'])form.elements[k].checked=m[k];
 $('#placement-options').innerHTML=system.slots.map(s=>{const other=mediaState.media.find(x=>x.id===mediaState.slots[s.key]);return `<label class="check"><input type="checkbox" name="placements" value="${e(s.key)}" ${other?.id===m.id?'checked':''}><span>${e(s.label)}${other&&other.id!==m.id?`<small> · nu: ${e(other.title)}</small>`:''}</span></label>`;}).join('');
 error($('#media-dialog .dialog-error'),'');$('#media-dialog').showModal();
}
$$('[data-media-filter]').forEach(b=>b.addEventListener('click',()=>{mediaFilter=b.dataset.mediaFilter;$$('[data-media-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderMedia();}));$('#media-search').addEventListener('input',renderMedia);
$('#media-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,b=form.querySelector('[type=submit]');b.disabled=true;const fd=new FormData(form),data=Object.fromEntries(fd);
 data.placements=fd.getAll('placements');data.gallery=form.elements.gallery.checked;data.published=form.elements.published.checked;data.sort=Number(data.sort);
 try{await api('/api/admin/media/'+editingMedia.id,{method:'PATCH',body:JSON.stringify(data)});$('#media-dialog').close();await loadMedia();toast(data.published?'Foto en plaatsing opgeslagen op uw website.':'Foto opgeslagen als concept.');}catch(err){error($('#media-dialog .dialog-error'),err.message);}finally{b.disabled=false;}
});
$('#trash-photo').addEventListener('click',()=>$('#confirm-dialog').showModal());$('#confirm-cancel').addEventListener('click',()=>$('#confirm-dialog').close());
$('#confirm-delete').addEventListener('click',async()=>{const b=$('#confirm-delete');b.disabled=true;try{await api('/api/admin/media/'+editingMedia.id,{method:'DELETE'});$('#confirm-dialog').close();$('#media-dialog').close();await loadMedia();toast('Foto verplaatst naar de prullenbak.');}catch(err){$('#confirm-dialog').close();error($('#media-dialog .dialog-error'),err.message);}finally{b.disabled=false;}});
$('#upload-open').addEventListener('click',()=>{$('#upload-form').reset();$('#upload-preview').hidden=true;error($('#upload-dialog .dialog-error'),'');$('#upload-dialog').showModal();});
function previewUpload(file){
 error($('#upload-dialog .dialog-error'),'');
 if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6*1024*1024){error($('#upload-dialog .dialog-error'),'Kies een JPG-, PNG- of WebP-foto van maximaal 6 MB.');$('#upload-file').value='';$('#upload-preview').hidden=true;return;}
 if(uploadURL)URL.revokeObjectURL(uploadURL);uploadURL=URL.createObjectURL(file);$('#upload-preview').src=uploadURL;$('#upload-preview').hidden=false;
 const form=$('#upload-form');if(!form.elements.title.value)form.elements.title.value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').slice(0,120);
}
$('#upload-file').addEventListener('change',()=>previewUpload($('#upload-file').files[0]));
$('#drop-zone').addEventListener('dragover',event=>{event.preventDefault();$('#drop-zone').classList.add('drag');});$('#drop-zone').addEventListener('dragleave',()=>$('#drop-zone').classList.remove('drag'));
$('#drop-zone').addEventListener('drop',event=>{event.preventDefault();$('#drop-zone').classList.remove('drag');if(event.dataTransfer.files.length){const dt=new DataTransfer();dt.items.add(event.dataTransfer.files[0]);$('#upload-file').files=dt.files;previewUpload(dt.files[0]);}});
$('#upload-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,b=form.querySelector('[type=submit]'),original=b.textContent;b.disabled=true;b.textContent='Foto wordt opgeslagen…';
 try{const file=form.elements.file.files[0];if(!file||file.size>6*1024*1024)throw new Error('Kies een foto van maximaal 6 MB.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('De foto kon niet worden gelezen.'));reader.readAsDataURL(file);});
  const result=await api('/api/admin/media',{method:'POST',body:JSON.stringify({title:form.elements.title.value,alt:form.elements.alt.value,data})});$('#upload-dialog').close();await loadMedia();openMedia(result.id);toast('Foto toegevoegd. Kies nu waar de foto moet verschijnen.');
 }catch(err){error($('#upload-dialog .dialog-error'),err.message);}finally{b.disabled=false;b.textContent=original;}
});
function renderSettings(){
 const items=[['MySQL-database','Aanvragen, foto’s en statistieken','Verbonden'],['E-mailmeldingen','Meldingen van nieuwe offerteaanvragen',system.email?'Gekoppeld':'Nog instellen'],['Beheeraccount',session.username,'Aangemeld'],['Bezoekersstatistieken','Zonder trackingcookies, bewaartermijn 90 dagen','Actief'],['Foto-opslag','Geüploade foto’s worden in MySQL bewaard','Persistent']];
 $('#connections').innerHTML=items.map(([a,b,c])=>`<div class="connection"><div><b>${e(a)}</b><p>${e(b)}</p></div><strong>${e(c)}</strong></div>`).join('');
}
$('#password-form').addEventListener('submit',async event=>{
 event.preventDefault();const f=event.currentTarget,b=f.querySelector('button');if(f.elements.password.value!==f.elements.confirm.value){toast('De nieuwe wachtwoorden komen niet overeen.');return;}
 b.disabled=true;try{await api('/api/admin/password',{method:'POST',body:JSON.stringify({current:f.elements.current.value,password:f.elements.password.value})});f.reset();toast('Uw wachtwoord is gewijzigd.');}catch(err){toast(err.message);}finally{b.disabled=false;}
});
$$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
setInterval(()=>{if(session&&activeView==='overzicht'&&!document.hidden&&!document.querySelector('dialog[open]'))void loadOverview().catch(()=>{});},60000);
try{const auth=await api('/api/auth/session');if(auth.authenticated)await enterDashboard(auth);else showLogin(auth.configured?'':'Het dashboard wordt nog ingesteld. De database en beheerlogin moeten eerst worden gekoppeld.');}catch(err){showLogin(err.message);}
