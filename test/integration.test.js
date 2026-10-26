import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import {randomUUID,randomBytes} from 'node:crypto';
import {createStore} from '../server/store.js';
import {createApp} from '../server/app.js';

test('MySQL API integration: protected admin, durable enquiries, statistics and photo lifecycle',{skip:!process.env.TEST_MYSQL_URL},async t=>{
 const dbName='lijnenlaag_test_'+randomBytes(8).toString('hex');
 const root=await mysql.createConnection(process.env.TEST_MYSQL_URL);
 await root.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 const url=new URL(process.env.TEST_MYSQL_URL);url.pathname='/'+dbName;
 const password=randomBytes(16).toString('hex');
 const env={MYSQL_URL:url.toString(),BRAND_ADMIN_USERNAME:'Beheer',BRAND_ADMIN_PASSWORD:password,APP_URL:'http://localhost',NODE_ENV:'test'};
 const store=createStore(env);let server,backend;
 t.after(async()=>{backend?.stopJobs();if(server)await new Promise(resolve=>server.close(resolve));await store.close();await root.query(`DROP DATABASE ${dbName}`);await root.end();});
 await store.ensure();backend=createApp({store,env});server=backend.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function call(route,{method='GET',body,auth=false,origin='http://localhost',csrfOverride}={}){
   const response=await fetch(base+route,{method,headers:{...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{}),...(auth?{Cookie:cookie,'X-CSRF-Token':csrfOverride??csrf}:{}),'User-Agent':'Lijn & LaagIntegrationTest',...(body?.dnt?{DNT:'1'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   return {response,status:response.status,data:response.headers.get('content-type')?.includes('application/json')?await response.json():await response.text()};
 }
 await t.test('Public site remains reachable; internal files and customer data are protected',async()=>{
   assert.equal((await call('/health')).status,200);assert.equal((await call('/')).status,200);assert.equal((await call('/admin/')).status,200);
   for(const p of ['/server/schema.sql','/.env','/package.json'])assert.equal((await call(p)).status,404);
   assert.equal((await call('/api/admin/enquiries')).status,401);assert.equal((await call('/api/admin/export')).status,401);
 });
 await t.test('Login rejects forged origins and passwords, sets secure session properties',async()=>{
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Beheer',password},origin:'https://attacker.invalid'})).status,403);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Beheer',password:'incorrect'}})).status,401);
   const login=await call('/api/auth/login',{method:'POST',body:{username:'Beheer',password}});assert.equal(login.status,200);csrf=login.data.csrf;
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
 await t.test('Manual leads preserve phone-only contacts, source, value and priorities without inventing consent',async()=>{
   const body={name:'Telefonische klant',phone:'0612345678',leadSource:'telefoon',priority:'hoog',estimatedValue:'1234.56',description:'Kozijnen schilderen',services:['buiten']};
   assert.equal((await call('/api/admin/enquiries',{method:'POST',body})).status,401);
   assert.equal((await call('/api/admin/enquiries',{method:'POST',auth:true,csrfOverride:'wrong',body})).status,403);
   const added=await call('/api/admin/enquiries',{method:'POST',auth:true,body});assert.equal(added.status,201);
   const path='/api/admin/enquiries/'+added.data.id;
   const lead=(await call(path,{auth:true})).data;assert.equal(lead.email,'');assert.equal(lead.consent_at,null);assert.equal(lead.lead_source,'telefoon');assert.equal(lead.priority,'hoog');assert.equal(Number(lead.estimated_value),1234.56);
   assert.equal((await call('/api/admin/enquiries?priority=hoog&source=telefoon&view=board',{auth:true})).data.total,1);
   assert.equal((await call(path+'/status',{method:'PATCH',auth:true,body:{status:'offerte'}})).status,200);
   assert.equal((await call(path+'/status',{method:'PATCH',auth:true,body:{status:'invented'}})).status,400);
   const saved=await call(path,{method:'PATCH',auth:true,body:{...body,status:'offerte',followUp:'2020-01-01',notes:'Offerte nabellen'}});assert.equal(saved.status,200);
   const stats=(await call('/api/admin/stats',{auth:true})).data;assert.equal(Number(stats.requests.pipelineValue),1234.56);assert.equal(Number(stats.requests.followUps),1);assert.ok(stats.followUps.some(r=>r.id===added.data.id));assert.ok(stats.pipeline.some(p=>p.status==='offerte'&&Number(p.count)===1));
   assert.equal((await call(path+'/status',{method:'PATCH',auth:true,body:{status:'verloren'}})).status,200);
   const closed=(await call('/api/admin/stats',{auth:true})).data;assert.equal(Number(closed.requests.followUps),0);assert.equal(Number(closed.requests.pipelineValue),0);
   assert.equal((await call('/api/admin/enquiries',{method:'POST',auth:true,body:{...body,phone:''}})).status,400);
   assert.equal((await call('/api/admin/enquiries',{method:'POST',auth:true,body:{...body,estimatedValue:'1.234'}})).status,400);
 });
 await t.test('Slot selection publishes a draft, updates only the chosen spot and can fill an empty spot',async()=>{
   const before=(await call('/api/content')).data;
   assert.equal((await call('/api/admin/slots/hero-main',{method:'PATCH',auth:true,body:{mediaId:photoId}})).status,200);
   const after=(await call('/api/content')).data;assert.equal(after.slots['hero-main'],photoId);assert.equal(after.slots['hero-detail'],before.slots['hero-detail']);assert.ok(after.media.some(m=>m.id===photoId));
   assert.equal((await call('/api/admin/slots/project-dark',{method:'PATCH',auth:true,body:{mediaId:photoId}})).status,200);
   const project=(await call('/api/content')).data.media.find(m=>m.id===photoId);assert.equal(project.album,'dark');assert.equal(project.gallery,true);
   assert.equal((await call('/api/admin/slots/not-a-slot',{method:'PATCH',auth:true,body:{mediaId:photoId}})).status,400);
   assert.equal((await call('/api/admin/slots/hero-main',{method:'PATCH',auth:true,body:{mediaId:'missing'}})).status,404);
 });
 await t.test('Replacing an active image preserves every placement and changes cache validators',async()=>{
   const before=await fetch(base+'/media/'+photoId+'.webp'),etag=before.headers.get('etag');
   const content=(await call('/api/content')).data,metadata=content.media.find(m=>m.id===photoId);
   const image=await sharp({create:{width:50,height:40,channels:3,background:'#ff0011'}}).png().toBuffer();
   assert.equal((await call('/api/admin/media/'+photoId+'/image',{method:'PUT',body:{data:'bad'}})).status,401);
   assert.equal((await call('/api/admin/media/'+photoId+'/image',{method:'PUT',auth:true,body:{data:'bad'}})).status,400);
   const replaced=await call('/api/admin/media/'+photoId+'/image',{method:'PUT',auth:true,body:{data:'data:image/png;base64,'+image.toString('base64')}});assert.equal(replaced.status,200);
   const live=await fetch(base+'/media/'+photoId+'.webp',{headers:{'If-None-Match':etag}});assert.equal(live.status,200);assert.notEqual(live.headers.get('etag'),etag);assert.equal((await sharp(Buffer.from(await live.arrayBuffer())).metadata()).width,50);
   const after=(await call('/api/content')).data;assert.deepEqual(after.slots,content.slots);assert.equal(after.media.find(m=>m.id===photoId).title,metadata.title);assert.equal(after.media.find(m=>m.id===photoId).photoId,metadata.photoId);
   assert.ok((await call('/')).data.includes('src="/media/'+photoId+'.webp"'));
   assert.equal((await fetch(base+'/media/'+photoId+'.webp',{headers:{'If-None-Match':live.headers.get('etag')}})).status,304);
 });
 await t.test('An older database upgrades additively and retains enquiries, sessions and photos',async()=>{
   // Reproduce the schema used before this release; a newly started server must migrate it.
   await store.run('UPDATE enquiries SET consent_at=COALESCE(consent_at,UTC_TIMESTAMP())');
   await store.pool.query('ALTER TABLE enquiries DROP COLUMN lead_source, DROP COLUMN priority, DROP COLUMN estimated_value, MODIFY consent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
   const second=createStore(env);try{await second.ensure();const rows=await second.listRequests();assert.equal(rows.total,2);assert.equal(rows.items[0].priority,'normaal');assert.equal((await second.content()).slots['hero-main'],photoId);assert.equal((await call('/api/auth/session',{auth:true})).data.authenticated,true);}finally{await second.close();}
 });
 await t.test('Website text editing persists safely, rejects conflicts and protects all edits',async()=>{
   const {copyDefaults}=await import('../server/copy.js');const [id,expected]=Object.entries(copyDefaults['/'])[0];const body={page:'/',id,expected,value:'Nieuwe tekst <script>alert(1)</script>'};
   assert.equal((await call('/api/admin/copy',{method:'PATCH',body})).status,401);
   assert.equal((await call('/api/admin/copy',{method:'PATCH',auth:true,csrfOverride:'bad',body})).status,403);
   assert.equal((await call('/api/admin/copy',{method:'PATCH',auth:true,body:{...body,id:'unknown'}})).status,400);
   assert.equal((await call('/api/admin/copy',{method:'PATCH',auth:true,body})).status,200);
   const page=await call('/');assert.ok(page.data.includes('Nieuwe tekst &lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!page.data.includes('<script>alert(1)</script>'));
   assert.equal((await call('/api/admin/copy',{method:'PATCH',auth:true,body})).status,409);
   const second=createStore(env);try{await second.ensure();const rows=await second.all('SELECT value FROM settings WHERE setting_key=?',['copy:lijnlaag:/:'+id]);assert.equal(rows[0].value,body.value);}finally{await second.close();}
   assert.equal((await call('/api/admin/copy',{method:'PATCH',auth:true,body:{...body,expected:body.value,value:expected}})).status,200);
 });
 await t.test('Lost leads keep contacts and consent; permanent deletion requires an authenticated CSRF-protected action',async()=>{
   const path='/api/admin/enquiries/'+enquiry.id;
   const before=(await call(path,{auth:true})).data;
   assert.equal((await call(path+'/status',{method:'PATCH',auth:true,body:{status:'verloren'}})).status,200);
   const kept=(await call(path,{auth:true})).data;assert.equal(kept.status,'verloren');for(const key of ['email','phone','notes','consent_at'])assert.equal(kept[key],before[key]);
   assert.ok((await call('/api/admin/enquiries?status=verloren',{auth:true})).data.items.some(r=>r.id===enquiry.id));
   assert.equal((await call(path,{method:'DELETE'})).status,401);
   assert.equal((await call(path,{method:'DELETE',auth:true,csrfOverride:'wrong'})).status,403);
   assert.equal((await call(path,{method:'DELETE',auth:true})).status,200);
   assert.equal((await call(path,{auth:true})).status,404);
   assert.equal((await store.all('SELECT id FROM enquiries WHERE id=?',[enquiry.id])).length,0);
   assert.equal((await call(path,{method:'DELETE',auth:true})).status,404);
 });
 await t.test('An independent brand database never imports legacy customers, accounts, sessions or photos',async()=>{
   const brandName='brand_'+randomBytes(8).toString('hex'),before=await store.listRequests();
   const brand=createStore({...env,BRAND_DATABASE:brandName,BRAND_ADMIN_USERNAME:'NieuwBeheer'});
   try{await brand.ensure();assert.equal((await brand.listRequests()).total,0);assert.equal((await brand.all('SELECT * FROM sessions')).length,0);assert.equal((await brand.all('SELECT username FROM admins'))[0].username,'NieuwBeheer');assert.equal((await store.listRequests()).total,before.total);const content=await brand.content();assert.ok(content.media.every(m=>m.src.endsWith('.svg')));assert.equal((await brand.all('SELECT value FROM settings WHERE setting_key LIKE ?',['copy:%'])).length,0);}
   finally{await brand.close();await root.query(`DROP DATABASE ${brandName}`);}
 });
 await t.test('Password can be changed and logout revokes the session',async()=>{
   const next=randomBytes(16).toString('hex');assert.equal((await call('/api/admin/password',{method:'POST',auth:true,body:{current:password,password:next}})).status,200);
   assert.equal((await call('/api/admin/logout',{method:'POST',auth:true})).status,200);
   assert.equal((await call('/api/admin/enquiries',{auth:true})).status,401);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Beheer',password}})).status,401);
   assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'Beheer',password:next}})).status,200);
 });
});
