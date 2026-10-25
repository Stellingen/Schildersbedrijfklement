import {createPhotoPicker} from './photo-picker.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg aria-hidden="true"><use href="/admin/icons.svg#${name}"/></svg>`;
const fmt=n=>Number(n||0).toLocaleString('nl-NL');
const money=n=>Number(n||0).toLocaleString('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const date=(v,full=false)=>v?new Date(v).toLocaleString('nl-NL',{day:'numeric',month:'short',...(full?{hour:'2-digit',minute:'2-digit',year:'numeric'}:{})}):'—';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const names={binnen:'Binnen- & kozijnwerk',buiten:'Buitenschilderwerk',latex:'Latex spuiten',stuc:'Stucwerk',behang:'Behangwerk',plinten:'Plinten & afwerking',advies:'Persoonlijk overleg'};
const statusNames={nieuw:'Nieuw',contact:'In contact',offerte:'Offerte verstuurd',gepland:'Ingepland',afgerond:'Afgerond',verloren:'Niet doorgegaan',archief:'Gearchiveerd'};
const sourceNames={website:'Website',telefoon:'Telefoon',email:'E-mail',aanbeveling:'Aanbeveling',anders:'Anders'};
const pageNames={'/':'Startpagina','/diensten/':'Ons vakwerk','/projecten/':'Projecten','/over-klement/':'Over Klement','/kleurstudio/':'3D-studio','/werkwijze/':'Werkwijze','/offerte/':'Offerte aanvragen','/contact/':'Contact','/privacy/':'Privacy'};
const viewNames={overzicht:'Overzicht',aanvragen:'Leads & aanvragen',fotos:'Foto’s & plaatsing',instellingen:'Instellingen'};
let session=null,system=null,activeView='overzicht',requestPage=1,requestSequence=0,mediaState={media:[],slots:{}},mediaFilter='active',editingRequest=null,editingMedia=null,uploadURL=null,toastTimer=null,leadView='board',chartMetric='visitors',chartStats=null,chartData=[],draggedLead=null;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function error(target,message){target.textContent=message;target.hidden=!message;}
function empty(title,description='',compact=false){return `<div class="empty${compact?' compact-empty':''}">${icon('inbox')}<strong>${e(title)}</strong><span>${e(description)}</span></div>`;}
async function api(url,options={}){
 const response=await fetch(url,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(session?.csrf?{'X-CSRF-Token':session.csrf}:{}),...options.headers}});
 const result=await response.json().catch(()=>({error:'De server gaf geen geldig antwoord.'}));
 if(!response.ok){if(response.status===401&&url!=='/api/auth/login')showLogin('Uw sessie is verlopen. Log opnieuw in.');throw new Error(result.error||'Deze actie is niet gelukt.');}return result;
}
const picker=createPhotoPicker({api,async onSaved(){if($('#media-dialog').open)$('#media-dialog').close();await loadMedia();toast('Foto bijgewerkt op uw website.');}});
const pickSlot=key=>picker.open(key).catch(err=>toast(err.message));
function showLogin(message=''){session=null;$('#loading').hidden=true;$('#login').hidden=false;$('#dashboard').hidden=true;$$('dialog[open]').forEach(d=>d.close());error($('#login-error'),message);}
async function enterDashboard(auth){session=auth;system=await api('/api/admin/system');$('#login').hidden=true;$('#loading').hidden=true;$('#dashboard').hidden=false;$('#account-name').textContent=auth.username;$('#welcome-name').textContent=auth.username;$('#login-form').reset();await navigate();}
$('#show-password').addEventListener('click',()=>{const input=$('#login-form [name=password]'),show=input.type==='password';input.type=show?'text':'password';$('#show-password').textContent=show?'Verberg':'Toon';$('#show-password').setAttribute('aria-label',show?'Wachtwoord verbergen':'Wachtwoord tonen');});
$('#login-form').addEventListener('submit',async event=>{event.preventDefault();const b=$('#login-form [type=submit]');b.disabled=true;error($('#login-error'),'');try{const f=new FormData(event.currentTarget);await enterDashboard(await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})}));}catch(err){error($('#login-error'),err.message);}finally{b.disabled=false;}});
$('#logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});showLogin();}catch(err){toast(err.message);}});
$('#menu-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'Menu sluiten':'Menu openen');});
document.addEventListener('click',event=>{if(!event.target.closest('#sidebar,#menu-toggle')){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
async function navigate(){
 if(!session)return;const [route,search='']=location.hash.slice(1).split('?'),params=new URLSearchParams(search);activeView=Object.hasOwn(viewNames,route)?route:'overzicht';
 $$('.view').forEach(v=>v.hidden=v.id!=='view-'+activeView);$$('[data-nav]').forEach(a=>{const active=a.dataset.nav===activeView;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#breadcrumb').textContent=viewNames[activeView];document.title=viewNames[activeView]+' | Klement beheer';$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');error($('#page-error'),'');
 try{
  if(activeView==='overzicht')await loadOverview();
  if(activeView==='aanvragen'){if(params.has('status')){$('#status-filter').value=params.get('status');requestPage=1;}await loadRequests();if(params.has('nieuw'))openNewLead();}
  if(activeView==='fotos'){await loadMedia();if(params.has('plek'))await pickSlot(params.get('plek'));}
  if(activeView==='instellingen')renderSettings();
  if(search)history.replaceState(null,'','#'+activeView);
 }catch(err){error($('#page-error'),err.message);}
}
window.addEventListener('hashchange',()=>void navigate());
const badge=status=>`<span class="status status-${e(status)}">${e(statusNames[status]||status)}</span>`;
function requestTable(items){
 if(!items.length)return empty('Nog geen leads in dit overzicht','Websiteaanvragen verschijnen automatisch. Een telefoontje kunt u zelf toevoegen.');
 return '<table><thead><tr><th>Klant</th><th>Werkzaamheden</th><th>Locatie</th><th>Ontvangen</th><th>Status</th><th></th></tr></thead><tbody>'+items.map(r=>`<tr data-id="${e(r.id)}"><td><button type="button" data-request="${e(r.id)}">${e(r.name)}</button><small>${e(sourceNames[r.lead_source]||'Website')} · ${e(r.reference)}</small></td><td>${e(r.services.map(s=>names[s]||s).join(', '))}</td><td>${e(r.place||'—')}</td><td>${e(date(r.created_at))}</td><td>${badge(r.status)}</td><td aria-hidden="true">↗</td></tr>`).join('')+'</tbody></table>';
}
function bindRequestRows(container){container.querySelectorAll('tr[data-id]').forEach(row=>row.addEventListener('click',()=>openRequest(row.dataset.id)));}
function selectChartDay(index){
 const d=chartData[index];if(!d)return;$$('[data-chart-day]').forEach(p=>{const selected=Number(p.dataset.chartDay)===index;p.classList.toggle('selected',selected);p.setAttribute('aria-pressed',String(selected));p.setAttribute('tabindex',selected?'0':'-1');});
 $('#chart-detail').innerHTML=`<span>${e(date(d.day+'T12:00:00Z'))}</span><b>${fmt(d.visitors)} bezoekers</b><span>${fmt(d.views)} weergaven</span><span>${fmt(d.leads)} leads</span>`;
}
function renderChart(){
 const daily=chartStats?.daily||[],requests=chartStats?.requestDays||[],days=Number($('#period').value),now=new Date(today()+'T12:00:00Z');
 chartData=Array.from({length:days},(_,i)=>{const d=new Date(now);d.setUTCDate(d.getUTCDate()-(days-1-i));const key=d.toISOString().slice(0,10);return {day:key,visitors:0,views:0,...daily.find(v=>v.day===key),leads:Number(requests.find(v=>v.day===key)?.count||0)};});
 const label={visitors:'Geschatte bezoekers',views:'Paginaweergaven',leads:'Nieuwe leads'}[chartMetric],max=Math.max(4,...chartData.map(d=>Number(d[chartMetric]))),w=650,h=220,left=35,right=15,top=15,bottom=37;
 const x=i=>left+i*(w-left-right)/Math.max(1,days-1),y=v=>h-bottom-v/max*(h-top-bottom),points=chartData.map((d,i)=>`${x(i)},${y(d[chartMetric])}`).join(' ');
 let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label} in de afgelopen ${days} dagen"><title>${label} per dag. Kies een punt of gebruik de pijltjestoetsen. De gegevens staan ook in de tabel.</title>`;
 for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`;}
 svg+=`<polygon class="chart-area" points="${left},${y(0)} ${points} ${w-right},${y(0)}"/><polyline class="chart-line" points="${points}"/>`;
 chartData.forEach((d,i)=>{svg+=`<g class="chart-point" data-chart-day="${i}" role="button" tabindex="${i===days-1?0:-1}" aria-pressed="false" aria-label="${e(date(d.day+'T12:00:00Z'))}: ${fmt(d[chartMetric])} ${label.toLowerCase()}"><circle class="chart-hit" cx="${x(i)}" cy="${y(d[chartMetric])}" r="12"/><circle class="chart-dot" cx="${x(i)}" cy="${y(d[chartMetric])}" r="${days>30?2:3}"/></g>`;if(i===0||i===days-1||i===Math.floor(days/2))svg+=`<text class="chart-label" x="${x(i)}" y="${h-9}" text-anchor="${i===0?'start':i===days-1?'end':'middle'}">${e(date(d.day+'T12:00:00Z'))}</text>`;});
 $('#visitors-chart').innerHTML=svg+'</svg>';$('#chart-subtitle').textContent=label+' · kies een dag voor meer details';
 $$('[data-chart-day]').forEach(p=>{const select=()=>selectChartDay(Number(p.dataset.chartDay));p.addEventListener('pointerenter',select);p.addEventListener('focus',select);p.addEventListener('click',select);p.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?days-1:Math.max(0,Math.min(days-1,Number(p.dataset.chartDay)+(event.key==='ArrowLeft'?-1:1)));selectChartDay(index);$(`[data-chart-day="${index}"]`).focus();}else if(event.key===' '||event.key==='Enter'){event.preventDefault();select();}});});
 selectChartDay(days-1);$('#chart-table').innerHTML='<table><thead><tr><th>Datum</th><th>Geschatte bezoekers</th><th>Weergaven</th><th>Leads</th></tr></thead><tbody>'+chartData.map(d=>`<tr><td>${e(date(d.day+'T12:00:00Z'))}</td><td>${fmt(d.visitors)}</td><td>${fmt(d.views)}</td><td>${fmt(d.leads)}</td></tr>`).join('')+'</tbody></table>';
}
function rankList(items,label){return items.length?'<div class="rank-list">'+items.map(r=>`<div class="rank-row"><span>${e(label(r))}</span><strong>${fmt(r.views)}</strong></div>`).join('')+'</div>':empty('Nog geen metingen','Dit overzicht groeit met uw website mee.',true);}
async function loadOverview(){
 const [s,recent]=await Promise.all([api('/api/admin/stats?days='+$('#period').value),api('/api/admin/enquiries')]);chartStats=s;
 const views=s.daily.reduce((n,d)=>n+Number(d.views),0),visitors=s.daily.reduce((n,d)=>n+Number(d.visitors),0),enquiries=s.requestDays.reduce((n,d)=>n+Number(d.count),0);
 const cards=[['Geschatte bezoekers',visitors,'visitors','Dagtotalen in gekozen periode','visitors'],['Paginaweergaven',views,'trend','Bekijk welke dagen eruit springen','views'],['Binnengekomen leads',enquiries,'inbox',`${fmt(s.requests.fresh)} nog nieuw · ${fmt(s.requests.total)} in totaal`,'#aanvragen?status=nieuw'],['Foto’s in beheer',s.pictures.total,'photo','Kies en wijzig de plek op uw website','#fotos']];
 $('#stats-cards').innerHTML=cards.map(([label,value,i,foot,target])=>`<button class="stat" ${target.startsWith('#')?`data-route="${target}"`:`data-chart-metric="${target}"`}><span class="stat-label">${label}</span><span class="stat-icon">${icon(i)}</span><strong class="stat-value">${fmt(value)}</strong><span class="stat-foot">${foot} <b>↗</b></span></button>`).join('');
 $$('[data-route]').forEach(b=>b.addEventListener('click',()=>location.hash=b.dataset.route));$$('[data-chart-metric]').forEach(b=>b.addEventListener('click',()=>{changeMetric(b.dataset.chartMetric);$('#visitors-chart').scrollIntoView({behavior:'smooth',block:'center'});}));
 $('#welcome-summary').textContent=Number(s.requests.fresh)?`${fmt(s.requests.fresh)} nieuwe lead${Number(s.requests.fresh)===1?' wacht':'s wachten'} op uw aandacht. Maak er een mooie klus van.`:'Alles bij de hand voor uw volgende mooie klus.';
 $('#nav-new').hidden=!Number(s.requests.fresh);$('#nav-new').textContent=fmt(s.requests.fresh);
 $('#system-notice').hidden=system.email;$('#system-notice').textContent='Aanvragen worden hier opgeslagen. E-mailmeldingen zijn nog niet gekoppeld; controleer uw nieuwe leads in dit dashboard.';
 const stages=['nieuw','contact','offerte','gepland'];$('#lead-pulse').innerHTML=`<div class="pipeline-heading"><div><h2>Van aanvraag naar opdracht.</h2><p>Uw openstaande kansen, in één oogopslag.</p></div><div class="pipeline-value"><small>Geschatte waarde open leads</small><strong>${money(s.requests.pipelineValue)}</strong></div></div><div class="pipeline-stages">${stages.map(k=>`<a href="#aanvragen?status=${k}" class="pipeline-stage stage-${k}"><span>${e(statusNames[k])}</span><strong>${fmt(s.pipeline?.find(p=>p.status===k)?.count)}</strong><b aria-hidden="true">→</b></a>`).join('')}</div>`;
 renderChart();
 $('#quick-actions').innerHTML=`<a href="#aanvragen?status=nieuw" class="quick-action"><span>${icon('inbox')}</span><div><strong>${fmt(s.requests.fresh)} nieuwe leads</strong><small>Bekijk de vraag en neem contact op</small></div><span>→</span></a><a href="#fotos" class="quick-action"><span>${icon('photo')}</span><div><strong>Een nieuwe foto plaatsen</strong><small>Hoofdfoto, dienst of project</small></div><span>→</span></a><a href="/?bewerken=1" target="_blank" rel="noopener" class="quick-action"><span>${icon('external')}</span><div><strong>Bewerk op de website</strong><small>Klik op de foto die u wilt wijzigen</small></div><span>↗</span></a>`;
 $('#followups').innerHTML=s.followUps?.length?s.followUps.map(r=>{const day=String(r.follow_up).slice(0,10),due=day<today()?'Te laat':day===today()?'Vandaag':date(day+'T12:00:00Z');return `<button class="followup-row" data-followup="${e(r.id)}"><span class="followup-avatar">${e(r.name.charAt(0).toUpperCase())}</span><span><strong>${e(r.name)}</strong><small>${e(r.place||r.reference)} · ${e(statusNames[r.status])}</small></span><span class="due ${day<=today()?'due-now':''}">${e(due)}</span><b>→</b></button>`;}).join(''):empty('Ruimte voor de volgende stap','Stel bij een lead een opvolgdatum in. Uw afspraken verschijnen hier.',true);
 $$('[data-followup]').forEach(b=>b.addEventListener('click',()=>openRequest(b.dataset.followup)));
 $('#top-pages').innerHTML=rankList(s.pages,r=>pageNames[r.path]||r.path);$('#top-sources').innerHTML=rankList(s.sources,r=>r.source);$('#devices').innerHTML=s.devices.map(d=>`<span>${e(d.device)} <b>${fmt(d.views)}</b></span>`).join('');
 $('#activity').innerHTML=s.activity.length?s.activity.map(a=>`<div class="activity-item"><p>${e(a.action)}</p><time>${e(date(a.created_at,true))}</time></div>`).join(''):empty('Nog geen activiteit','Uw wijzigingen verschijnen hier.',true);
 $('#recent-requests').innerHTML=requestTable(recent.items.slice(0,5));bindRequestRows($('#recent-requests'));$('#updated').textContent='Bijgewerkt '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})+(s.since?' · Telling sinds '+date(s.since):' · Telling start bij het eerste gemeten bezoek');
}
function changeMetric(metric){chartMetric=metric;$$('[data-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metric===metric)));renderChart();}
$$('[data-metric]').forEach(b=>b.addEventListener('click',()=>changeMetric(b.dataset.metric)));
$('#period').addEventListener('change',()=>loadOverview().catch(err=>error($('#page-error'),err.message)));
$('#refresh').addEventListener('click',async()=>{const b=$('#refresh');b.disabled=true;try{await loadOverview();toast('Overzicht bijgewerkt.');}catch(err){error($('#page-error'),err.message);}finally{b.disabled=false;}});
$('#chart-table-toggle').addEventListener('click',()=>{const show=$('#chart-table').hidden;$('#chart-table').hidden=!show;$('#chart-table-toggle').textContent=show?'Verberg tabel':'Toon tabel';$('#chart-table-toggle').setAttribute('aria-expanded',String(show));});
async function moveLead(id,status){await api('/api/admin/enquiries/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status})});await loadRequests();toast('Lead verplaatst naar '+statusNames[status].toLowerCase()+'.');}
function renderBoard(data){
 const filter=$('#status-filter').value,stages=filter?[filter]:Object.keys(statusNames);$('#lead-board').innerHTML=stages.map(k=>{const items=data.items.filter(r=>r.status===k);return `<section class="board-column stage-${k}" data-drop-status="${k}" aria-label="${e(statusNames[k])}"><header><h2>${e(statusNames[k])}</h2><span>${items.length}</span></header><div class="board-cards">${items.map(r=>`<article class="lead-card" draggable="true" data-lead="${e(r.id)}"><div class="lead-card-meta"><span>${e(sourceNames[r.lead_source]||'Website')}</span>${r.priority==='hoog'?'<b class="priority-high">Hoge prioriteit</b>':''}</div><button class="lead-open" data-request="${e(r.id)}"><strong>${e(r.name)}</strong><span>${e(r.services.map(k=>names[k]||k).join(', '))}</span><small>${e(r.place||'Plaats nog niet ingevuld')}</small></button>${r.estimated_value!=null?`<p class="lead-value">${money(r.estimated_value)}</p>`:''}<div class="lead-card-bottom"><time>${e(date(r.created_at))}</time>${r.follow_up?`<span class="due ${String(r.follow_up).slice(0,10)<=today()?'due-now':''}">↻ ${e(date(String(r.follow_up).slice(0,10)+'T12:00:00Z'))}</span>`:''}</div><label class="lead-status-label"><span class="sr-only">Status van ${e(r.name)}</span><select data-lead-status="${e(r.id)}">${Object.entries(statusNames).map(([key,name])=>`<option value="${key}" ${key===r.status?'selected':''}>${name}</option>`).join('')}</select></label></article>`).join('')||'<div class="board-empty">Nog geen leads<br><small>Sleep een kaart hierheen</small></div>'}</div></section>`;}).join('');
 $$('#lead-board [data-request]').forEach(b=>b.addEventListener('click',()=>openRequest(b.dataset.request)));
 $$('[data-lead-status]').forEach(s=>s.addEventListener('change',async()=>{s.disabled=true;try{await moveLead(s.dataset.leadStatus,s.value);}catch(err){toast(err.message);await loadRequests();}}));
 $$('[data-lead]').forEach(card=>{card.addEventListener('dragstart',event=>{draggedLead=card.dataset.lead;event.dataTransfer.setData('text/plain',draggedLead);event.dataTransfer.effectAllowed='move';card.classList.add('dragging');});card.addEventListener('dragend',()=>{draggedLead=null;card.classList.remove('dragging');$$('.drag-over').forEach(c=>c.classList.remove('drag-over'));});});
 $$('[data-drop-status]').forEach(column=>{column.addEventListener('dragover',event=>{if(!draggedLead)return;event.preventDefault();event.dataTransfer.dropEffect='move';column.classList.add('drag-over');});column.addEventListener('dragleave',event=>{if(!column.contains(event.relatedTarget))column.classList.remove('drag-over');});column.addEventListener('drop',async event=>{event.preventDefault();column.classList.remove('drag-over');if(!draggedLead)return;const id=draggedLead;draggedLead=null;try{await moveLead(id,column.dataset.dropStatus);}catch(err){toast(err.message);}});});
}
async function loadRequests(){
 const seq=++requestSequence,query=new URLSearchParams({page:leadView==='board'?1:requestPage,q:$('#request-search').value,status:$('#status-filter').value,priority:$('#priority-filter').value,view:leadView});
 const data=await api('/api/admin/enquiries?'+query);if(seq!==requestSequence)return;
 $('#lead-board').hidden=leadView!=='board';$('#lead-table-panel').hidden=leadView!=='table';$('#board-note').hidden=leadView!=='board'||data.total<=100;
 renderBoard(data);$('#requests-table').innerHTML=requestTable(data.items);bindRequestRows($('#requests-table'));$('#request-count').textContent=fmt(data.total)+' lead'+(data.total===1?'':'s');$('#page-label').textContent=`Pagina ${requestPage} van ${Math.max(1,Math.ceil(data.total/20))}`;$('#page-prev').disabled=requestPage<=1;$('#page-next').disabled=requestPage*20>=data.total;
}
const loadLeads=()=>loadRequests().catch(err=>error($('#page-error'),err.message));
$$('[data-lead-view]').forEach(b=>b.addEventListener('click',()=>{leadView=b.dataset.leadView;requestPage=1;$$('[data-lead-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));void loadLeads();}));
let searchTimer;$('#request-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{requestPage=1;void loadLeads();},250);});
['status-filter','priority-filter'].forEach(id=>$('#'+id).addEventListener('change',()=>{requestPage=1;void loadLeads();}));$('#page-prev').addEventListener('click',()=>{requestPage--;void loadLeads();});$('#page-next').addEventListener('click',()=>{requestPage++;void loadLeads();});
function openNewLead(){$('#new-lead-form').reset();error($('#new-lead-dialog .dialog-error'),'');$('#new-lead-dialog').showModal();}
$('#new-lead').addEventListener('click',openNewLead);
$('#new-lead-form').addEventListener('submit',async event=>{event.preventDefault();const f=event.currentTarget,b=f.querySelector('[type=submit]'),data=Object.fromEntries(new FormData(f));data.services=[data.service];b.disabled=true;
 try{const r=await api('/api/admin/enquiries',{method:'POST',body:JSON.stringify(data)});$('#new-lead-dialog').close();$('#status-filter').value='';$('#priority-filter').value='';$('#request-search').value='';requestPage=1;await loadRequests();toast('Lead toegevoegd. U kunt nu de opvolging instellen.');await openRequest(r.id);}catch(err){error($('#new-lead-dialog .dialog-error'),err.message);}finally{b.disabled=false;}});
async function openRequest(id){
 try{const r=await api('/api/admin/enquiries/'+encodeURIComponent(id));editingRequest=r;$('#request-reference').textContent=r.reference+' · '+date(r.created_at,true);$('#request-title').textContent=r.name;
 const summary=[['Werkzaamheden',r.services.map(k=>names[k]||k).join(', ')],['Woningtype',r.property],['Planning',r.planning],['Uw klant schrijft',r.description||'Geen aanvullende toelichting'],['3D-keuze',r.color?Object.entries(r.color).map(([k,v])=>`${({name:'Keuze',value:'Kleur',code:'Code',scene:'Onderdeel',surface:'Oppervlak',wall:'Wanden',finish:'Glans',texture:'Structuur'})[k]||k}: ${v}`).join('\n'):'Geen kleur- of afwerkingskeuze'],['Herkomst',sourceNames[r.lead_source]||'Website'],['Contacttoestemming',r.consent_at?date(r.consent_at,true):'Handmatig toegevoegd · geen websiteformulier ingevuld']];
 $('#request-summary').innerHTML='<dl>'+summary.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')+'</dl>';
 const actions=$('#contact-actions');actions.replaceChildren();if(r.email){const mail=document.createElement('a');mail.className='btn';mail.href='mailto:'+r.email+'?subject='+encodeURIComponent('Uw aanvraag bij Klement · '+r.reference);mail.textContent='E-mail klant ↗';actions.append(mail);}if(r.phone&&/^[+\d\s().-]+$/.test(r.phone)){const phone=document.createElement('a');phone.className='btn';phone.href='tel:'+r.phone.replace(/[^+\d]/g,'');phone.textContent='Bel klant ↗';actions.append(phone);}
 const f=$('#request-form');for(const key of ['name','email','phone','place','status','notes'])f.elements[key].value=r[key]||'';f.elements.followUp.value=r.follow_up?String(r.follow_up).slice(0,10):'';f.elements.leadSource.value=r.lead_source||'website';f.elements.priority.value=r.priority||'normaal';f.elements.estimatedValue.value=r.estimated_value??'';
 $('#request-email-status').textContent='E-mailmelding: '+(system.emailLabels[r.email_status]||r.email_status);$('#resend-email').hidden=!system.email||r.lead_source&&r.lead_source!=='website';$('#resend-email').disabled=r.email_status==='sending';error($('#request-dialog .dialog-error'),'');$('#request-dialog').showModal();
 }catch(err){toast(err.message);}
}
$('#request-form').addEventListener('submit',async event=>{event.preventDefault();const f=event.currentTarget,b=f.querySelector('[type=submit]');b.disabled=true;try{await api('/api/admin/enquiries/'+editingRequest.id,{method:'PATCH',body:JSON.stringify(Object.fromEntries(new FormData(f)))});$('#request-dialog').close();toast('Lead bijgewerkt.');await navigate();}catch(err){error($('#request-dialog .dialog-error'),err.message);}finally{b.disabled=false;}});
$('#resend-email').addEventListener('click',async()=>{const b=$('#resend-email');b.disabled=true;try{await api('/api/admin/enquiries/'+editingRequest.id+'/notify',{method:'POST'});$('#request-email-status').textContent='De e-mailmelding staat klaar voor verzending.';toast('E-mailmelding opnieuw klaargezet.');}catch(err){error($('#request-dialog .dialog-error'),err.message);}finally{b.disabled=false;}});
function renderSlots(){
 const group=$('#placement-filter').value;
 $('#slot-grid').innerHTML=system.slots.filter(s=>group==='all'||s.key.startsWith(group)).map(s=>{const m=mediaState.media.find(m=>m.id===mediaState.slots[s.key]&&!m.deletedAt&&m.published),category=s.key.startsWith('hero')?'Startpagina':s.key.startsWith('service')?'Diensten':s.key.startsWith('project')?'Projecten':'Over Klement';return `<article class="slot-card"><div class="slot-image">${m?`<img src="/api/admin/media/${e(m.id)}/image?thumb=1" alt="${e(m.alt)}" loading="lazy"><span class="slot-live">● Live op uw website</span>`:`<div class="slot-empty">${icon('photo')}<span>Nog geen foto ingesteld</span></div>`}</div><div class="slot-body"><p>${category}</p><h3>${e(s.label.split(' · ').slice(1).join(' · ')||s.label)}</h3><span>${e(m?.title||'Kies een passende foto voor deze plek')}</span><button class="btn ${m?'':'primary'}" data-pick-slot="${e(s.key)}">${m?'Foto wijzigen':'Foto kiezen'} <b>↗</b></button></div></article>`;}).join('');
 $$('[data-pick-slot]').forEach(b=>b.addEventListener('click',()=>pickSlot(b.dataset.pickSlot)));
}
$('#placement-filter').addEventListener('change',renderSlots);
$$('[data-photo-mode]').forEach(b=>b.addEventListener('click',()=>{$$('[data-photo-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#photo-placement-view').hidden=b.dataset.photoMode!=='placement';$('#photo-library-view').hidden=b.dataset.photoMode!=='library';}));
$('#replace-image').addEventListener('click',()=>picker.replace(editingMedia).catch(err=>toast(err.message)));
async function loadMedia(){mediaState=await api('/api/admin/media');renderMedia();}
function placementsFor(id){return system.slots.filter(s=>mediaState.slots[s.key]===id);}
function renderMedia(){
 renderSlots();
 const active=mediaState.media.filter(m=>!m.deletedAt);$('#photo-count').textContent=active.length;
 const search=$('#media-search').value.toLowerCase();
 const media=mediaState.media.filter(m=>(mediaFilter==='trash'?!!m.deletedAt:!m.deletedAt)&& (mediaFilter!=='gallery'||m.gallery&&m.published)&& (mediaFilter!=='draft'||!m.published)&&(m.title+' '+m.alt+' '+m.caption).toLowerCase().includes(search));
 $('#media-grid').innerHTML=media.length?media.map(m=>`<article class="media-card"><button class="media-open" data-media="${e(m.id)}"><div class="media-image"><img loading="lazy" src="/api/admin/media/${e(m.id)}/image?thumb=1" alt="${e(m.alt)}"><span class="status ${m.published?'status-public':''}">${m.deletedAt?'Prullenbak':m.published?'Gepubliceerd':'Concept'}</span></div><div class="media-card-body"><h3>${e(m.title)}</h3><p>${placementsFor(m.id).length?placementsFor(m.id).length+' vaste plek'+(placementsFor(m.id).length===1?'':'ken'):'Geen vaste plek'}${m.gallery?' · In projectgalerij':''}</p><div class="media-tags">${placementsFor(m.id).slice(0,2).map(s=>`<span>${e(s.label.split(' · ')[0])}</span>`).join('')}${m.gallery?'<span>Galerij</span>':''}${m.bytes?`<span>${(m.bytes/1024/1024).toFixed(1)} MB</span>`:''}</div></div></button>${m.deletedAt?`<button class="btn restore" data-restore="${e(m.id)}">Herstellen</button>`:''}</article>`).join(''):empty(mediaFilter==='trash'?'De prullenbak is leeg':'Geen foto’s gevonden','Voeg een foto toe of pas uw filter aan.');
 $$('#media-grid [data-media]').forEach(b=>b.addEventListener('click',()=>{const m=mediaState.media.find(x=>x.id===b.dataset.media);if(!m.deletedAt)openMedia(m.id);}));
 $$('#media-grid [data-restore]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api('/api/admin/media/'+b.dataset.restore+'/restore',{method:'POST'});await loadMedia();toast('Foto hersteld als concept. Kies de plaatsing en publiceer de foto.');}catch(err){toast(err.message);b.disabled=false;}}));
 $('#placements').innerHTML=system.slots.map(s=>{const m=active.find(m=>m.id===mediaState.slots[s.key]);return `<button class="placement-row" data-slot="${e(s.key)}" >${m?`<img src="/api/admin/media/${e(m.id)}/image?thumb=1" alt="">`:icon('photo')}<span><strong>${e(s.label)}</strong><small>${e(m?.title||'Nog leeg · kies een foto')}</small></span><span aria-hidden="true">${m?'↗':''}</span></button>`;}).join('');
 $$('#placements [data-slot]').forEach(b=>b.addEventListener('click',()=>pickSlot(b.dataset.slot)));
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
