import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import {randomUUID,randomBytes} from 'node:crypto';
import {createStore} from '../server/store.js';
import {createApp} from '../server/app.js';

test('MySQL API integration: protected admin, durable enquiries, statistics and photo lifecycle',{skip:!process.env.TEST_MYSQL_URL},async t=>{
 const dbName='klement_test_'+randomBytes(8).toString('hex');
 const root=await mysql.createConnection(process.env.TEST_MYSQL_URL);
 await root.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 const url=new URL(process.env.TEST_MYSQL_URL);url.pathname='/'+dbName;
 const password=randomBytes(16).toString('hex');
 const env={MYSQL_URL:url.toString(),ADMIN_USERNAME:'Kevin',ADMIN_PASSWORD:password,APP_URL:'http://localhost',NODE_ENV:'test'};
 const store=createStore(env);let server,backend;
 t.after(async()=>{backend?.stopJobs();if(server)await new Promise(resolve=>server.close(resolve));await store.close();await root.query(`DROP DATABASE ${dbName}`);await root.end();});
 await store.ensure();backend=createApp({store,env});server=backend.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function call(route,{method='GET',body,auth=false,origin='http://localhost',csrfOverride}={}){
   const response=await fetch(base+route,{method,headers:{...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{}),...(auth?{Cookie:cookie,'X-CSRF-Token':csrfOverride??csrf}:{}),'User-Agent':'KlementIntegrationTest',...(body?.dnt?{DNT:'1'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   return {response,status:response.status,data:response.headers.get('content-type')?.includes('application/json')?await response.json():await response.text()};
 }
 await t.test('Public site remains reachable; internal files and customer data are protected',async()=>{
   assert.equal((await call('/health')).status,200);assert.equal((await call('/')).status,200);assert.equal((await call('/admin/')).status,200);
   for(const p of ['/server/schema.sql','/.env','/package.json'])assert.equal((await call(p)).status,404);
   assert.equal((await call('/api/admin/enquiries')).status,401);assert.equal((await call('/api/admin/export')).status,401);
 });
 await t.test('Login rejects forged origins and passwords, sets secure session properties',async()=>{
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Kevin',password},origin:'https://attacker.invalid'})).status,403);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Kevin',password:'incorrect'}})).status,401);
   const login=await call('/api/auth/login',{method:'POST',body:{username:'Kevin',password}});assert.equal(login.status,200);csrf=login.data.csrf;
   const header=login.response.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);cookie=header.split(';')[0];
   assert.equal((await call('/api/admin/system',{auth:true})).data.database,true);
   assert.equal((await call('/api/admin/logout',{method:'POST',auth:true,csrfOverride:'wrong'})).status,403);
 });
 let enquiry;
 await t.test('Submission is persisted once with consent and complete 3D choices',async()=>{
   const body={id:randomUUID(),name:'Testklant',email:'klant@example.com',phone:'0612345678',place:'Enschede',planning:'Binnen 1 tot 3 maanden',property:'Een huurwoning',description:'Het plafond en de kozijnen.',services:['stuc'],color:{name:'Plafond · fijne structuur',value:'#F0EFE5',code:'RAL 9010',scene:'plaster',surface:'ceiling',texture:'fine'},consent:true};
   const result=await call('/api/enquiries',{method:'POST',body});assert.equal(result.status,201);assert.equal(result.data.received,true);assert.ok(!result.data.email);enquiry={...body,reference:result.data.reference};
   const retry=await call('/api/enquiries',{method:'POST',body});assert.equal(retry.status,200);assert.equal(retry.data.reference,result.data.reference);
   const list=await call('/api/admin/enquiries',{auth:true});assert.equal(list.data.total,1);assert.equal(list.data.items[0].color.texture,'fine');assert.ok(list.data.items[0].consent_at);
   assert.equal((await call('/api/enquiries',{method:'POST',body:{...body,id:randomUUID(),consent:false}})).status,400);
   const [db]=await store.all('SELECT * FROM enquiries WHERE id=?',[body.id]);assert.equal(db.property,'Een huurwoning');
 });
 await t.test('Administrator can update, filter, export and follow up an enquiry',async()=>{
   const data={status:'contact',name:'Testklant bijgewerkt',email:'klant@example.com',phone:'0612345678',place:'Hengelo',notes:'Gebeld. Kleurstaal bespreken.',followUp:'2026-11-05'};
   assert.equal((await call('/api/admin/enquiries/'+enquiry.id,{method:'PATCH',auth:true,body:data})).status,200);
   const detail=await call('/api/admin/enquiries/'+enquiry.id,{auth:true});assert.equal(detail.data.notes,data.notes);assert.equal(detail.data.status,'contact');
   assert.equal((await call('/api/admin/enquiries?status=contact&q=Hengelo',{auth:true})).data.total,1);
   assert.equal((await call('/api/admin/enquiries?status=nieuw',{auth:true})).data.total,0);
   assert.equal((await call('/api/admin/enquiries/'+enquiry.id,{method:'PATCH',auth:true,body:{...data,followUp:'2026-02-31'}})).status,400);
   const csv=await call('/api/admin/export',{auth:true});assert.match(csv.data,/Kleurstaal bespreken/);assert.match(csv.data,/'0612345678|0612345678/);
 });
 await t.test('Anonymous traffic is deduplicated; DNT and private dashboard traffic are excluded',async()=>{
   const body={id:randomUUID(),path:'/projecten/',referrer:'https://www.google.nl/search?q=private'};
   assert.equal((await call('/api/track',{method:'POST',body})).status,204);await call('/api/track',{method:'POST',body});
   await call('/api/track',{method:'POST',body:{...body,id:randomUUID(),dnt:true}});
   assert.equal((await call('/api/track',{method:'POST',body:{...body,path:'/admin/',id:randomUUID()}})).status,400);
   const stats=await call('/api/admin/stats?days=30',{auth:true});assert.equal(stats.status,200);assert.equal(stats.data.daily.reduce((n,d)=>n+Number(d.views),0),1);assert.equal(stats.data.sources[0].source,'www.google.nl');assert.equal(Number(stats.data.requests.total),1);
   const [saved]=await store.all('SELECT * FROM page_views');assert.match(saved.visitor,/^[a-f0-9]{64}$/);assert.ok(!('ip' in saved));assert.ok(!JSON.stringify(saved).includes('private'));
 });
 let photoId;
 await t.test('A real image is processed, saved as a private draft, then placed in the public site',async()=>{
   const image=await sharp({create:{width:64,height:48,channels:3,background:'#1676bd'}}).png().toBuffer();
   const added=await call('/api/admin/media',{method:'POST',auth:true,body:{title:'Testproject',alt:'Blauw testvlak',data:'data:image/png;base64,'+image.toString('base64')}});assert.equal(added.status,201);photoId=added.data.id;
   assert.equal((await call('/media/'+photoId+'.webp')).status,404);assert.ok(!(await call('/api/content')).data.media.some(m=>m.id===photoId));
   const preview=await fetch(base+'/api/admin/media/'+photoId+'/image',{headers:{Cookie:cookie}});assert.equal(preview.status,200);assert.equal(preview.headers.get('content-type'),'image/webp');
   const [m]=await store.all('SELECT image_data FROM media WHERE id=?',[photoId]);assert.equal((await sharp(m.image_data).metadata()).format,'webp');
   const updated=await call('/api/admin/media/'+photoId,{method:'PATCH',auth:true,body:{title:'Nieuw project',alt:'Een blauw testvlak',caption:'Testcaption',album:'other',sort:1,gallery:true,published:true,placements:['hero-main']}});assert.equal(updated.status,200);
   const content=(await call('/api/content')).data;assert.equal(content.slots['hero-main'],photoId);assert.ok(content.media.some(m=>m.id===photoId&&m.gallery));
   const html=await call('/');assert.ok(html.data.includes('src="/media/'+photoId+'.webp"'));
   const imageResponse=await fetch(base+'/media/'+photoId+'.webp');assert.equal(imageResponse.status,200);
   assert.equal((await call('/api/admin/media',{method:'POST',auth:true,body:{title:'Invalid',alt:'invalid',data:'data:image/png;base64,'+Buffer.from('<svg/>').toString('base64')}})).status,400);
 });
 await t.test('Photo removal clears live placement, and restore returns an unpublished draft',async()=>{
   assert.equal((await call('/api/admin/media/'+photoId,{method:'DELETE',auth:true})).status,200);
   assert.equal((await call('/media/'+photoId+'.webp')).status,404);assert.equal((await call('/api/content')).data.slots['hero-main'],null);
   assert.ok(!(await call('/')).data.includes('/media/'+photoId+'.webp'));
   assert.equal((await call('/api/admin/media/'+photoId+'/restore',{method:'POST',auth:true})).status,200);
   const m=(await call('/api/admin/media',{auth:true})).data.media.find(m=>m.id===photoId);assert.equal(m.published,false);assert.equal(m.deletedAt,null);
 });
 await t.test('Reinitialising the server preserves data, placement choices and sessions',async()=>{
   const second=createStore(env);await second.ensure();assert.equal((await second.content()).slots['hero-main'],null);assert.equal((await second.listRequests()).total,1);await second.close();
   const auth=await call('/api/auth/session',{auth:true});assert.equal(auth.data.authenticated,true);
 });
 await t.test('Password can be changed and logout revokes the session',async()=>{
   const next=randomBytes(16).toString('hex');assert.equal((await call('/api/admin/password',{method:'POST',auth:true,body:{current:password,password:next}})).status,200);
   assert.equal((await call('/api/admin/logout',{method:'POST',auth:true})).status,200);
   assert.equal((await call('/api/admin/enquiries',{auth:true})).status,401);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Kevin',password}})).status,401);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Kevin',password:next}})).status,200);
 });
});
