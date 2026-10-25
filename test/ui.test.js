import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../dist/admin/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../dist/admin/admin.js',import.meta.url),'utf8');
const pause=()=>new Promise(resolve=>setTimeout(resolve,15));
function domFixture(authenticated){
 const dom=new JSDOM(html,{url:'https://www.schildersbedrijfklement.nl/admin/',runScripts:'outside-only'});
 const w=dom.window;w.setInterval=()=>0;w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const requests=[{id:'test-id',reference:'KL-TEST',name:'Testklant',email:'test@example.com',phone:'0612345678',place:'Enschede',services:['stuc'],property:'Een huurwoning',planning:'Later / nog in overleg',description:'Plafond',color:{name:'Plafond fijn',value:'#ffffff'},consent_at:'2026-10-25T12:00:00Z',created_at:'2026-10-25T12:00:00Z',status:'nieuw',notes:'',email_status:'disabled'}];
 const media=[{id:'photo-1',photoId:'photo-1',title:'Testproject',caption:'Bijschrift',alt:'Schilderwerk',published:true,gallery:true,sort:0,album:'dark',src:'/assets/work-1.jpg',bytes:10000,deletedAt:null}];
 w.fetch=async(url,options={})=>{
  let value={};
  if(url==='/api/auth/session')value={authenticated,configured:true,username:'Kevin',csrf:'test-csrf'};
  else if(url==='/api/admin/system')value={database:true,email:false,emailLabels:{disabled:'Nog niet gekoppeld'},slots:[{key:'hero-main',label:'Startpagina · grote foto'}]};
  else if(url.startsWith('/api/admin/stats'))value={daily:[],pages:[],sources:[],devices:[],requestDays:[],requests:{total:1,fresh:1,followUps:0},pictures:{total:1,bytes:0},activity:[],since:null};
  else if(url.startsWith('/api/admin/enquiries?')||url==='/api/admin/enquiries')value={items:requests,total:1};
  else if(url==='/api/admin/enquiries/test-id')value=requests[0];
  else if(url==='/api/admin/media')value={media,slots:{'hero-main':'photo-1'}};
  else if(url==='/api/admin/logout')value={ok:true};
  else throw Error('Unexpected UI request: '+url);
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
 };
 return {dom,w,async run(){await w.eval('(async()=>{'+script+'})()');}};
}
test('Dashboard DOM: overview, navigation, enquiry details, photo editor and logout work together',async t=>{
 const f=domFixture(true);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;
 assert.equal(d.querySelector('#dashboard').hidden,false);assert.equal(d.querySelectorAll('.stat').length,4);assert.ok(d.querySelector('#recent-requests').textContent.includes('Testklant'));
 assert.equal(d.querySelector('#visitors-chart svg').getAttribute('role'),'img');
 d.querySelector('[data-request]').click();await pause();assert.ok(d.querySelector('#request-dialog').open);assert.equal(d.querySelector('#request-form').elements.name.value,'Testklant');d.querySelector('#request-dialog .dialog-close').click();
 f.w.location.hash='#fotos';await pause();assert.equal(d.querySelector('#view-fotos').hidden,false);assert.equal(d.querySelectorAll('.media-card').length,1);
 d.querySelector('[data-media]').click();assert.ok(d.querySelector('#media-dialog').open);assert.equal(d.querySelector('#media-form').elements.title.value,'Testproject');assert.equal(d.querySelector('#media-form').elements.placements.checked,true);d.querySelector('#media-dialog .dialog-close').click();
 f.w.location.hash='#instellingen';await pause();assert.equal(d.querySelectorAll('.connection').length,5);
 d.querySelector('#logout').click();await pause();assert.equal(d.querySelector('#login').hidden,false);assert.equal(d.querySelector('#dashboard').hidden,true);
});
test('Unauthenticated dashboard shows only login and supports the password visibility toggle',async t=>{
 const f=domFixture(false);t.after(()=>f.dom.window.close());await f.run();const d=f.w.document;
 assert.equal(d.querySelector('#login').hidden,false);assert.equal(d.querySelector('#dashboard').hidden,true);
 d.querySelector('#show-password').click();assert.equal(d.querySelector('#login-form [name=password]').type,'text');d.querySelector('#show-password').click();assert.equal(d.querySelector('#login-form [name=password]').type,'password');
});
