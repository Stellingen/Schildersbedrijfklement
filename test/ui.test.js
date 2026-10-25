import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../dist/admin/index.html',import.meta.url),'utf8');
const pickerScript=(await readFile(new URL('../dist/admin/photo-picker.js',import.meta.url),'utf8')).replace('export function createPhotoPicker','function createPhotoPicker');
const script=(await readFile(new URL('../dist/admin/admin.js',import.meta.url),'utf8')).replace("import {createPhotoPicker} from './photo-picker.js';",'');
const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
function domFixture(authenticated){
 const dom=new JSDOM(html,{url:'https://www.schildersbedrijfklement.nl/admin/',runScripts:'outside-only'}),w=dom.window;
 w.setInterval=()=>0;w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const requests=[{id:'test-id',reference:'KL-TEST',name:'Testklant <img src=x onerror=alert(1)>',email:'test@example.com',phone:'0612345678',place:'Enschede',services:['stuc'],property:'Een huurwoning',planning:'Later / nog in overleg',description:'Plafond',color:{name:'Plafond fijn',value:'#ffffff'},consent_at:'2026-10-25T12:00:00Z',created_at:'2026-10-25T12:00:00Z',status:'nieuw',notes:'',email_status:'disabled',lead_source:'website',priority:'hoog',estimated_value:'1234.56'}];
 const media=[{id:'photo-1',photoId:'photo-1',title:'Testproject',caption:'Bijschrift',alt:'Schilderwerk',published:true,gallery:true,sort:0,album:'dark',src:'/assets/work-1.jpg',bytes:10000,deletedAt:null},{id:'photo-2',title:'Nieuwe foto',caption:'',alt:'Nieuw werk',published:false,gallery:false,sort:1,album:'other',bytes:100,deletedAt:null}],slots={'hero-main':'photo-1','hero-detail':null},calls=[];
 w.fetch=async(url,options={})=>{
  calls.push({url,options});let value={},status=200;const body=options.body?JSON.parse(options.body):{};
  if(url==='/api/auth/session')value={authenticated,configured:true,username:'Kevin',csrf:'test-csrf'};
  else if(url==='/api/admin/system')value={database:true,email:false,emailLabels:{disabled:'Nog niet gekoppeld'},slots:[{key:'hero-main',label:'Startpagina · grote foto'},{key:'hero-detail',label:'Startpagina · kleine foto'}]};
  else if(url.startsWith('/api/admin/stats')){const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());value={daily:[{day,visitors:3,views:12}],pages:[],sources:[],devices:[],requestDays:[{day,count:2}],requests:{total:1,fresh:1,followUps:0,pipelineValue:1234.56},pictures:{total:2,bytes:0},pipeline:[{status:'nieuw',count:1}],followUps:[],activity:[],since:null};}
  else if(url==='/api/admin/enquiries'&&options.method==='POST'){value={id:'manual-id'};requests.push({...requests[0],...body,id:'manual-id',lead_source:body.leadSource});status=201;}
  else if(url.startsWith('/api/admin/enquiries?')||url==='/api/admin/enquiries')value={items:requests,total:requests.length};
  else if(url.endsWith('/status')){requests.find(r=>url.includes(r.id)).status=body.status;value={ok:true};}
  else if(url.startsWith('/api/admin/enquiries/'))value=requests.find(r=>url.endsWith(r.id));
  else if(url==='/api/admin/media')value={media,slots};
  else if(url.startsWith('/api/admin/slots/')){slots[url.split('/').pop()]=body.mediaId;media.find(m=>m.id===body.mediaId).published=true;value={ok:true};}
  else if(url==='/api/admin/logout')value={ok:true};
  else throw Error('Unexpected UI request: '+url);
  return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 };
 return {dom,w,calls,slots,requests,async run(){await w.eval('(async()=>{'+pickerScript+'\n'+script+'})()');}};
}
test('Dashboard combines real metrics, keyboard chart interaction, safe lead details and logout',async t=>{
 const f=domFixture(true);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;
 assert.equal(d.querySelector('#dashboard').hidden,false);assert.equal(d.querySelectorAll('.stat').length,4);assert.ok(d.querySelector('#recent-requests').textContent.includes('Testklant'));assert.equal(d.querySelector('#recent-requests img'),null);
 d.querySelector('[data-metric=views]').click();assert.match(d.querySelector('#chart-subtitle').textContent,/Paginaweergaven/);assert.match(d.querySelector('#chart-detail').textContent,/12 weergaven/);
 const last=d.querySelector('[data-chart-day][tabindex="0"]');last.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.notEqual(d.querySelector('[data-chart-day][tabindex="0"]'),last);
 d.querySelector('[data-request]').click();await pause();assert.ok(d.querySelector('#request-dialog').open);assert.match(d.querySelector('#request-form').elements.name.value,/Testklant/);assert.equal(d.querySelector('#request-form').elements.estimatedValue.value,'1234.56');d.querySelector('#request-dialog .dialog-close').click();
 f.w.location.hash='#instellingen';await pause();assert.equal(d.querySelectorAll('.connection').length,5);d.querySelector('#logout').click();await pause();assert.equal(d.querySelector('#login').hidden,false);assert.equal(d.querySelector('#dashboard').hidden,true);
});
test('Lead board can move leads and add a phone lead, with accessible list alternative',async t=>{
 const f=domFixture(true);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;f.w.location.hash='#aanvragen';await pause();
 assert.equal(d.querySelector('#lead-board').hidden,false);assert.equal(d.querySelectorAll('.lead-card').length,1);
 const status=d.querySelector('[data-lead-status]');status.value='offerte';status.dispatchEvent(new f.w.Event('change'));await pause();assert.equal(f.requests[0].status,'offerte');assert.ok(d.querySelector('[data-drop-status=offerte] .lead-card'));
 d.querySelector('[data-lead-view=table]').click();await pause();assert.equal(d.querySelector('#lead-table-panel').hidden,false);assert.equal(d.querySelector('#lead-board').hidden,true);
 d.querySelector('#new-lead').click();const form=d.querySelector('#new-lead-form');form.elements.name.value='Telefonische lead';form.elements.phone.value='0612345678';form.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));await pause();
 const call=f.calls.find(c=>c.url==='/api/admin/enquiries'&&c.options.method==='POST');assert.ok(call);assert.equal(call.options.headers['X-CSRF-Token'],'test-csrf');assert.equal(JSON.parse(call.options.body).leadSource,'telefoon');assert.ok(d.querySelector('#request-dialog').open);
});
test('Photo placement can fill an empty slot and publish a chosen draft without changing another slot',async t=>{
 const f=domFixture(true);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;f.w.location.hash='#fotos';await pause();
 assert.equal(d.querySelectorAll('.slot-card').length,2);const blank=d.querySelector('[data-pick-slot="hero-detail"]');assert.equal(blank.disabled,false);blank.click();await pause();
 assert.ok(d.querySelector('.photo-picker').open);d.querySelector('[data-pick="photo-2"]').click();assert.equal(d.querySelector('.picker-save').disabled,false);d.querySelector('.picker-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));await pause();
 assert.equal(f.slots['hero-detail'],'photo-2');assert.equal(f.slots['hero-main'],'photo-1');assert.equal(d.querySelector('.photo-picker').open,false);
 d.querySelector('[data-photo-mode=library]').click();assert.equal(d.querySelector('#photo-library-view').hidden,false);d.querySelector('[data-media="photo-1"]').click();assert.ok(d.querySelector('#media-dialog').open);assert.equal(d.querySelector('#media-form').elements.title.value,'Testproject');
});
test('Unauthenticated dashboard shows login and supports password visibility',async t=>{
 const f=domFixture(false);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;assert.equal(d.querySelector('#login').hidden,false);assert.equal(d.querySelector('#dashboard').hidden,true);d.querySelector('#show-password').click();assert.equal(d.querySelector('#login-form [name=password]').type,'text');d.querySelector('#show-password').click();assert.equal(d.querySelector('#login-form [name=password]').type,'password');
});

test('Inline text editor previews safely, saves the selected text and lets links work when disabled',async t=>{
 const dom=new JSDOM('<main><h1><site-copy data-copy="abc">Welkom</site-copy></h1><a href="/contact/"><site-copy data-copy="def">Contact</site-copy></a></main><div id="bar"><button>Klaar</button></div>',{url:'https://www.schildersbedrijfklement.nl/',runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const source=(await readFile(new URL('../dist/text-editor.js',import.meta.url),'utf8')).replace('export function','function');const calls=[];w.testApi=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {value:JSON.parse(options.body).value};};
 w.eval(source+';enableTextEditing({api:window.testApi,bar:document.querySelector("#bar")});');
 d.querySelector('site-copy').click();assert.ok(d.querySelector('dialog').open);const input=d.querySelector('textarea');input.value='<img src=x onerror=alert(1)>';input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('.k-text-preview img'),null);assert.match(d.querySelector('.k-text-preview p').textContent,/<img/);
 d.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.equal(calls[0].body.expected,'Welkom');assert.equal(calls[0].body.page,'/');assert.equal(d.querySelector('h1 site-copy').textContent,input.value);assert.equal(d.querySelector('h1 img'),null);assert.equal(d.querySelector('dialog').open,false);
 d.querySelector('#bar [aria-pressed]').click();assert.equal(d.querySelector('site-copy').hasAttribute('role'),false);
});
