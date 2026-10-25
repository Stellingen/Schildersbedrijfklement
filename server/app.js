import {copyRoutes,renderCopy} from './copy.js';
import {leadSources,priorities,leadDetails,manualLead} from './leads.js';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { defaultContent,slotDefinitions } from '../dist/media-defaults.js';
import { token,hash,fingerprint,hashPassword,verifyPassword,same,HttpError,text,optionalText,validateRequest,serviceNames,statuses,csvCell,escapeHtml,passwordValue } from './security.js';
import { mediaRow,requestRow } from './store.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const publicPaths=new Set(['/','/diensten/','/projecten/','/over-klement/','/kleurstudio/','/werkwijze/','/offerte/','/contact/','/privacy/']);
const emailLabels={pending:'Wacht op verzending',sending:'Wordt verstuurd',sent:'Verstuurd',failed:'Verzending mislukt',disabled:'E-mail nog niet gekoppeld'};
const wrap=handler=>(req,res,next)=>Promise.resolve(handler(req,res,next)).catch(next);
async function processImage(data){
    const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z\d+/=]+)$/.exec(data);if(!match)throw new HttpError(400,'Gebruik een JPG-, PNG- of WebP-afbeelding.');
    const input=Buffer.from(match[2],'base64');if(input.length>6*1024*1024)throw new HttpError(413,'Kies een foto kleiner dan 6 MB.');
    let output;
    try{const image=sharp(input,{limitInputPixels:40000000});const metadata=await image.metadata();if(!['jpeg','png','webp'].includes(metadata.format))throw new Error('format');output=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new HttpError(400,'Deze afbeelding kan niet worden verwerkt. Kies een andere JPG-, PNG- of WebP-foto.');}
    if(output.length>6*1024*1024)throw new HttpError(413,'De foto is te groot. Kies een kleinere afbeelding.');
    return output;
}
export function createApp({store,env=process.env}={}){
  const app=express();app.disable('x-powered-by');app.enable('strict routing');app.set('trust proxy',1);
  let transport=null;
  if(env.SMTP_HOST&&env.SMTP_USER&&env.SMTP_PASSWORD&&env.SMTP_FROM){
    const port=Number(env.SMTP_PORT||587);
    transport=nodemailer.createTransport({host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},connectionTimeout:8000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
  }
  app.use((req,res,next)=>{
    res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
    if(req.path.startsWith('/api/')||req.path.startsWith('/admin'))res.set('Cache-Control','no-store');
    if(req.path.startsWith('/admin'))res.set({'X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'self'; img-src 'self' blob: data:; style-src 'self'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'"});
    next();
  });
  app.get('/health',(_req,res)=>res.type('text').send('ok'));
  app.get(['/dash','/dash/','/admin/login','/admin/login/'],(_req,res)=>res.redirect(302,'/admin/'));
  app.get('/admin',(_req,res)=>res.redirect(302,'/admin/'));
  app.get('/admin/',(_req,res)=>res.sendFile(path.join(root,'admin/index.html')));
  const originGuard=(req,res,next)=>{
    const origin=req.get('origin');
    let expected;try{expected=env.APP_URL?new URL(env.APP_URL).origin:`${req.protocol}://${req.get('host')}`;}catch{return next(new HttpError(503,'De website-instellingen moeten nog worden afgerond.'));}
    if(!origin||origin!==expected)return next(new HttpError(403,'Deze actie is alleen vanaf de eigen website toegestaan.'));
    next();
  };
  app.use('/api', (req,res,next)=>{
    res.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
    if(!['GET','HEAD'].includes(req.method))return originGuard(req,res,next);
    next();
  });
  app.use('/api',express.json({limit:'9mb',strict:true}));
  const database=wrap(async(_req,_res,next)=>{
    if(!store)throw new HttpError(503,'Het dashboard wordt nog ingesteld. Bel of mail Klement om uw aanvraag door te geven.');
    await store.ensure();next();
  });
  const requireAuth=wrap(async(req,res,next)=>{
    const cookies=String(req.get('cookie')||'').split(';').map(s=>s.trim());
    const raw=cookies.find(s=>s.startsWith('klement_session='))?.slice(16)||'';
    if(!/^[a-f0-9]{64}$/.test(raw))throw new HttpError(401,'Log opnieuw in om verder te gaan.');
    const [session]=await store.all('SELECT * FROM sessions WHERE token_hash=? AND expires_at>UTC_TIMESTAMP()',[hash(raw)]);
    if(!session)throw new HttpError(401,'Uw sessie is verlopen. Log opnieuw in.');
    if(!['GET','HEAD'].includes(req.method)&&!same(req.get('x-csrf-token'),session.csrf))throw new HttpError(403,'Ververs het dashboard en probeer opnieuw.');
    req.admin=session;next();
  });
  app.get('/api/content',wrap(async(_req,res)=>{
    if(!store)return res.json({...defaultContent,connected:false});
    try{await store.ensure();res.json({...await store.content(),connected:true});}catch{res.json({...defaultContent,connected:false});}
  }));
  app.get('/media/:id.webp',database,wrap(async(req,res)=>{
    if(!/^[a-z\d-]{1,40}$/i.test(req.params.id))throw new HttpError(404,'Foto niet gevonden.');
    const [m]=await store.all('SELECT image_data,etag FROM media WHERE id=? AND published=1 AND deleted_at IS NULL',[req.params.id]);
    if(!m?.image_data)throw new HttpError(404,'Foto niet gevonden.');
    res.set({'Cache-Control':'no-cache','ETag':'"'+m.etag+'"'});
    if(req.get('if-none-match')==='"'+m.etag+'"')return res.status(304).end();
    res.type('image/webp').send(m.image_data);
  }));
  app.get('/api/auth/session',wrap(async(req,res)=>{
    if(!store)return res.json({authenticated:false,configured:false});
    try{await store.ensure();}catch{return res.json({authenticated:false,configured:false});}
    const admins=await store.all('SELECT username FROM admins LIMIT 1');
    const raw=String(req.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('klement_session='))?.slice(16)||'';
    const [s]=/^[a-f0-9]{64}$/.test(raw)?await store.all('SELECT username,csrf FROM sessions WHERE token_hash=? AND expires_at>UTC_TIMESTAMP()',[hash(raw)]):[];
    res.json(s?{authenticated:true,configured:true,username:s.username,csrf:s.csrf}:{authenticated:false,configured:!!admins.length});
  }));
  app.post('/api/auth/login',database,wrap(async(req,res)=>{
    const username=text(req.body.username,80,true),password=passwordValue(req.body.password);
    await store.limit('login-ip:'+req.ip,8,900000);await store.limit('login-user:'+username.toLowerCase(),40,900000);
    const [admin]=await store.all('SELECT * FROM admins WHERE username=?',[username]);
    const fallback='scrypt:00000000000000000000000000000000:'+ '00'.repeat(64);
    if(!await verifyPassword(password,admin?.password_hash||fallback))throw new HttpError(401,'Gebruikersnaam of wachtwoord is onjuist.');
    const raw=token(),csrf=token();
    await store.run('INSERT INTO sessions (token_hash,username,csrf,expires_at) VALUES (?,?,?,?)',[hash(raw),admin.username,csrf,new Date(Date.now()+8*3600000)]);
    res.cookie('klement_session',raw,{httpOnly:true,secure:env.NODE_ENV==='production'||req.secure,sameSite:'strict',path:'/',maxAge:8*3600000});
    await store.audit('Kevin heeft ingelogd');
    res.json({authenticated:true,username:admin.username,csrf});
  }));
  app.post('/api/enquiries',database,wrap(async(req,res)=>{
    if(req.body.website)throw new HttpError(400,'Uw aanvraag kon niet worden verwerkt.');
    const data=validateRequest(req.body);
    // A retry returns only a generic receipt, never stored customer information.
    const [exists]=await store.all('SELECT id FROM enquiries WHERE id=?',[data.id]);
    if(!exists){await store.limit('enquiry:'+req.ip,5,900000);}
    const r=await store.addRequest(data);
    if(!exists){await store.audit('Nieuwe offerteaanvraag ontvangen · '+r.reference);void notify(r.id);}
    res.status(exists?200:201).json({received:true,reference:r.reference});
  }));
  app.post('/api/track',database,wrap(async(req,res)=>{
    if(req.get('dnt')==='1'||req.get('sec-gpc')==='1')return res.status(204).end();
    if(/bot|spider|crawler|headless|preview|uptime/i.test(req.get('user-agent')||''))return res.status(204).end();
    const p=text(req.body.path,160,true),id=text(req.body.id,36,true);
    if(!publicPaths.has(p)||! /^[a-f\d-]{36}$/i.test(id))throw new HttpError(400,'Ongeldige pagina.');
    await store.limit('track:'+req.ip,120,900000);
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const ua=req.get('user-agent')||'';
    const visitor=fingerprint(store.secret,day+'|'+req.ip+'|'+ua.slice(0,200));
    let source='Direct / onbekend';
    try{const u=new URL(String(req.body.referrer||'').slice(0,2000));if(u.origin!==new URL(env.APP_URL||`${req.protocol}://${req.get('host')}`).origin)source=u.hostname.slice(0,120);}catch{}
    const device=/ipad|tablet/i.test(ua)?'tablet':/mobi|iphone|android/i.test(ua)?'mobiel':'desktop';
    await store.run('INSERT IGNORE INTO page_views (event_id,day,visitor,path,source,device) VALUES (?,?,?,?,?,?)',[id,day,visitor,p,source,device]);
    res.status(204).end();
  }));
  app.use('/api/admin',database,requireAuth);
  app.post('/api/admin/logout',wrap(async(req,res)=>{
    await store.run('DELETE FROM sessions WHERE token_hash=?',[req.admin.token_hash]);res.clearCookie('klement_session',{path:'/'});res.json({ok:true});
  }));
  app.get('/api/admin/system',wrap(async(req,res)=>res.json({database:true,email:!!transport,emailLabels,statuses,leadSources,priorities,slots:slotDefinitions.map(([key,label])=>({key,label})),username:req.admin.username,retentionDays:90})));
  app.get('/api/admin/stats',wrap(async(req,res)=>{
    const days=Number(req.query.days||30);if(![7,30,90].includes(days))throw new HttpError(400,'Ongeldige periode.');res.json(await store.stats(days));
  }));
  app.get('/api/admin/enquiries',wrap(async(req,res)=>{
    const status=String(req.query.status||''),q=String(req.query.q||'').slice(0,120),page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1));
    if(status&&!Object.hasOwn(statuses,status))throw new HttpError(400,'Ongeldige status.');
    const priority=String(req.query.priority||''),source=String(req.query.source||'');
    if((priority&&!Object.hasOwn(priorities,priority))||(source&&!Object.hasOwn(leadSources,source)))throw new HttpError(400,'Ongeldig filter.');
    res.json(await store.listRequests({q,status,page,priority,source,limit:req.query.view==='board'?100:20}));
  }));
  app.post('/api/admin/enquiries',wrap(async(req,res)=>{
    const d=manualLead(req.body),reference='KL-'+randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
    await store.run("INSERT INTO enquiries (id,reference,name,email,phone,place,planning,property,description,services,color,consent_at,notes,lead_source,priority,estimated_value,email_status) VALUES (?,?,?,?,?,?,?,?,?,?,NULL,NULL,?,?,?,?, 'disabled')",[d.id,reference,d.name,d.email,d.phone,d.place,d.planning,d.property,d.description,JSON.stringify(d.services),'',d.source,d.priority,d.estimated]);
    await store.audit('Lead handmatig toegevoegd · '+reference);res.status(201).json({id:d.id,reference});
  }));
  app.patch('/api/admin/enquiries/:id/status',wrap(async(req,res)=>{
    const status=text(req.body.status,20,true);if(!Object.hasOwn(statuses,status))throw new HttpError(400,'Ongeldige status.');
    const r=await store.run('UPDATE enquiries SET status=?,updated_at=UTC_TIMESTAMP() WHERE id=?',[status,req.params.id]);
    if(!r.affectedRows)throw new HttpError(404,'Lead niet gevonden.');
    await store.audit('Leadstatus bijgewerkt · '+statuses[status]);res.json({ok:true});
  }));
  app.get('/api/admin/export',wrap(async(req,res)=>{
    const {items}=await store.listRequests({limit:10000});
    const rows=[['Referentie','Ontvangen','Status','Naam','E-mail','Telefoon','Plaats','Woningtype','Planning','Diensten','Wensen','3D-keuze','Notities','Opvolgen op','Herkomst','Prioriteit','Geschatte waarde'],...items.map(r=>[r.reference,r.created_at?.toISOString?.()||r.created_at,statuses[r.status],r.name,r.email,r.phone,r.place,r.property,r.planning,r.services.map(s=>serviceNames[s]).join(', '),r.description,r.color?.name||'',r.notes,r.follow_up||'',leadSources[r.lead_source]||r.lead_source,priorities[r.priority]||r.priority,r.estimated_value??''])];
    res.set('Content-Disposition','attachment; filename="klement-aanvragen.csv"').type('text/csv').send('\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'));
  }));
  app.get('/api/admin/enquiries/:id',wrap(async(req,res)=>{
    const [r]=await store.all('SELECT * FROM enquiries WHERE id=?',[req.params.id]);if(!r)throw new HttpError(404,'Aanvraag niet gevonden.');res.json(requestRow(r));
  }));
  app.patch('/api/admin/enquiries/:id',wrap(async(req,res)=>{
    const [r]=await store.all('SELECT id FROM enquiries WHERE id=?',[req.params.id]);if(!r)throw new HttpError(404,'Aanvraag niet gevonden.');
    const b=req.body,status=text(b.status,20,true);if(!Object.hasOwn(statuses,status))throw new HttpError(400,'Ongeldige status.');
    const email=optionalText(b.email,120);if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw new HttpError(400,'Controleer het e-mailadres.');
    const follow=optionalText(b.followUp,10);if(follow&&(!/^\d{4}-\d{2}-\d{2}$/.test(follow)||Number.isNaN(Date.parse(follow))||new Date(follow).toISOString().slice(0,10)!==follow))throw new HttpError(400,'Controleer de opvolgdatum.');
    const details=leadDetails(b),phone=optionalText(b.phone,24);
    if(!email&&!phone)throw new HttpError(400,'Vul een e-mailadres of telefoonnummer in.');
    await store.run('UPDATE enquiries SET status=?,name=?,email=?,phone=?,place=?,notes=?,follow_up=?,lead_source=?,priority=?,estimated_value=?,updated_at=UTC_TIMESTAMP() WHERE id=?',[status,text(b.name,80,true),email,phone,optionalText(b.place,80),optionalText(b.notes,5000),follow||null,details.source,details.priority,details.estimated,req.params.id]);
    await store.audit('Aanvraag bijgewerkt · '+req.params.id.slice(0,8));res.json({ok:true});
  }));
  app.post('/api/admin/enquiries/:id/notify',wrap(async(req,res)=>{
    if(!transport)throw new HttpError(409,'Koppel eerst de e-mailinstellingen in Railway.');
    const [r]=await store.all('SELECT id,email_status FROM enquiries WHERE id=?',[req.params.id]);if(!r)throw new HttpError(404,'Aanvraag niet gevonden.');
    if(r.email_status==='sending')throw new HttpError(409,'De e-mail wordt al verstuurd.');
    await store.run("UPDATE enquiries SET email_status='pending',email_attempts=0 WHERE id=?",[r.id]);void notify(r.id);res.json({ok:true});
  }));
  app.get('/api/admin/media',wrap(async(_req,res)=>{
    const media=(await store.all('SELECT id,photo_id,title,caption,alt,album,src,in_gallery,published,sort_order,bytes,deleted_at,created_at FROM media ORDER BY sort_order,created_at DESC')).map(mediaRow);
    const slots=Object.fromEntries((await store.all('SELECT * FROM site_slots')).map(s=>[s.slot_key,s.media_id]));res.json({media,slots});
  }));
  // Admin previews are protected, including drafts and recoverable deleted images.
  app.get('/api/admin/media/:id/image',wrap(async(req,res)=>{
    const [m]=await store.all('SELECT image_data,src FROM media WHERE id=?',[req.params.id]);if(!m)throw new HttpError(404,'Foto niet gevonden.');
    if(m.image_data){
      const data=req.query.thumb==='1'?await sharp(m.image_data).resize({width:480,height:360,fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer():m.image_data;
      return res.type('image/webp').send(data);
    }
    if(!/^\/assets\/[a-z\d-]+\.jpg$/.test(m.src))throw new HttpError(404,'Foto niet gevonden.');res.sendFile(path.join(root,m.src));
  }));
  app.post('/api/admin/media',wrap(async(req,res)=>{
    const title=text(req.body.title,120,true),alt=text(req.body.alt||title,240,true),data=text(req.body.data,8500000,true);
    const output=await processImage(data);
    const [{total}]=await store.all('SELECT COUNT(*) AS total FROM media');if(total>=500)throw new HttpError(409,'Er zijn al 500 foto’s opgeslagen.');
    const id=randomUUID();
    await store.run('INSERT INTO media (id,photo_id,title,caption,alt,album,src,in_gallery,published,sort_order,image_data,bytes,etag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',[id,id,title,'',alt,'other','/media/'+id+'.webp',0,0,Number(total),output,output.length,hash(output)]);
    await store.audit('Foto toegevoegd als concept: '+title);res.status(201).json({id});
  }));
  app.put('/api/admin/media/:id/image',wrap(async(req,res)=>{
    const [m]=await store.all('SELECT id FROM media WHERE id=? AND deleted_at IS NULL',[req.params.id]);
    if(!m)throw new HttpError(404,'Foto niet gevonden.');
    const output=await processImage(text(req.body.data,8500000,true));
    await store.run('UPDATE media SET image_data=?,bytes=?,etag=?,src=? WHERE id=?',[output,output.length,hash(output),'/media/'+m.id+'.webp',m.id]);
    await store.audit('Actieve afbeelding vervangen');res.json({ok:true});
  }));
  app.patch('/api/admin/slots/:key',wrap(async(req,res)=>{
    const key=req.params.key;
    if(!slotDefinitions.some(([k])=>k===key))throw new HttpError(400,'Onbekende plek op de website.');
    const id=text(req.body.mediaId,40,true),cx=await store.pool.getConnection();
    try{
      await cx.beginTransaction();
      const [[m]]=await cx.execute('SELECT id FROM media WHERE id=? AND deleted_at IS NULL FOR UPDATE',[id]);
      if(!m)throw new HttpError(404,'Deze foto is niet beschikbaar.');
      if(key==='project-dark'||key==='project-white')await cx.execute('UPDATE media SET published=1,in_gallery=1,album=? WHERE id=?',[key==='project-dark'?'dark':'white',id]);
      else await cx.execute('UPDATE media SET published=1 WHERE id=?',[id]);
      await cx.execute('INSERT INTO site_slots (slot_key,media_id) VALUES (?,?) ON DUPLICATE KEY UPDATE media_id=VALUES(media_id)',[key,id]);
      await cx.commit();
    }catch(error){await cx.rollback();throw error;}finally{cx.release();}
    await store.audit('Foto geplaatst · '+slotDefinitions.find(([k])=>k===key)[1]);res.json({ok:true});
  }));
  app.patch('/api/admin/media/:id',wrap(async(req,res)=>{
    const b=req.body;
    const m={title:text(b.title,120,true),alt:text(b.alt,240,true),caption:optionalText(b.caption,400),album:text(b.album,20,true),sort:Number(b.sort),gallery:b.gallery===true,published:b.published===true};
    if(!['dark','white','other'].includes(m.album)||!Number.isInteger(m.sort)||m.sort<0||m.sort>9999)throw new HttpError(400,'Controleer album en volgorde.');
    const placements=Array.isArray(b.placements)?[...new Set(b.placements)]:[];
    if(placements.some(k=>!slotDefinitions.some(([key])=>key===k)))throw new HttpError(400,'Ongeldige fotoplek.');
    await store.saveMedia(req.params.id,m,placements);res.json({ok:true});
  }));
  app.delete('/api/admin/media/:id',wrap(async(req,res)=>{
    const cx=await store.pool.getConnection();try{await cx.beginTransaction();await cx.execute('UPDATE media SET deleted_at=UTC_TIMESTAMP(),published=0 WHERE id=?',[req.params.id]);await cx.execute('UPDATE site_slots SET media_id=NULL WHERE media_id=?',[req.params.id]);await cx.commit();}catch(e){await cx.rollback();throw e;}finally{cx.release();}
    await store.audit('Foto naar prullenbak verplaatst');res.json({ok:true});
  }));
  app.post('/api/admin/media/:id/restore',wrap(async(req,res)=>{
    await store.run('UPDATE media SET deleted_at=NULL,published=0 WHERE id=?',[req.params.id]);await store.audit('Foto hersteld als concept');res.json({ok:true});
  }));
  app.post('/api/admin/password',wrap(async(req,res)=>{
    await store.limit('password:'+req.ip,5,900000);
    const current=passwordValue(req.body.current),password=passwordValue(req.body.password);
    if(password.length<12)throw new HttpError(400,'Kies een nieuw wachtwoord van minimaal 12 tekens.');
    const [a]=await store.all('SELECT password_hash FROM admins WHERE username=?',[req.admin.username]);if(!await verifyPassword(current,a.password_hash))throw new HttpError(400,'Het huidige wachtwoord klopt niet.');
    await store.run('UPDATE admins SET password_hash=? WHERE username=?',[await hashPassword(password),req.admin.username]);
    await store.run('DELETE FROM sessions WHERE username=? AND token_hash<>?',[req.admin.username,req.admin.token_hash]);
    await store.audit('Beheerwachtwoord gewijzigd');res.json({ok:true});
  }));
  copyRoutes(app,store,wrap);
  app.use('/api',(_req,_res,next)=>next(new HttpError(404,'Niet gevonden.')));
  // Photo changes also apply to the delivered HTML, before JavaScript runs.
  app.get([...publicPaths],wrap(async(req,res,next)=>{
    if(!store)return next();
    try{
      await store.ensure();
      const content=await store.content();
      let html=await readFile(path.join(root,req.path,'index.html'),'utf8');
      html=html.replace(/<img\b[^>]*data-media-slot="([^"]+)"[^>]*>/g,(tag,key)=>{
        const m=content.media.find(m=>m.id===content.slots[key]);
        if(!m)return '';
        return tag.replace(/src="[^"]*"/,'src="'+escapeHtml(m.src)+'"').replace(/alt="[^"]*"/,'alt="'+escapeHtml(m.alt)+'"');
      });
      const gallery=content.media.filter(m=>m.gallery);
      html=html.replace(/<div class="photo-contact-sheet">[\s\S]*?<\/div>/,()=>'<div class="photo-contact-sheet">'+gallery.map(m=>`<button class="photo-detail" data-gallery="all" data-photo="${escapeHtml(m.photoId)}"><span><img src="${escapeHtml(m.src)}" alt="${escapeHtml(m.alt)}" loading="lazy" width="600" height="450"></span><strong>${escapeHtml(m.title)}</strong></button>`).join('')+'</div>');
      html=await renderCopy(html,req.path,store);
      res.set('Cache-Control','no-cache').type('html').send(html);
    }catch{next();}
  }));
  app.use(express.static(root,{dotfiles:'deny',index:'index.html',maxAge:0,setHeaders(res){res.setHeader('Cache-Control','no-cache');}}));
  app.use((_req,res)=>res.status(404).type('html').send('<!doctype html><html lang="nl"><meta charset="utf-8"><title>Pagina niet gevonden | Klement</title><h1>Pagina niet gevonden</h1><a href="/">Terug naar de website</a></html>'));
  app.use((error,req,res,_next)=>{
    const status=error.status|| (error.type==='entity.too.large'?413:500);
    if(status>=500)console.error('Request failed:',error.code||error.name);
    const message=status===413?'Het bestand is te groot. Kies een foto kleiner dan 6 MB.':status>=500?'Deze actie is tijdelijk niet beschikbaar. Probeer het later opnieuw of neem rechtstreeks contact op met Klement.':error.message||'Controleer de ingevulde gegevens.';
    res.status(status).json({error:message});
  });
  async function notify(id){
    if(!store)return;
    try{
      if(!transport){await store.run("UPDATE enquiries SET email_status='disabled' WHERE id=? AND email_status='pending'",[id]);return;}
      const result=await store.run("UPDATE enquiries SET email_status='sending',email_attempts=email_attempts+1,last_email_at=UTC_TIMESTAMP() WHERE id=? AND email_status IN ('pending','failed','disabled') AND email_attempts<3",[id]);
      if(!result.affectedRows)return;
      const [raw]=await store.all('SELECT * FROM enquiries WHERE id=?',[id]);const r=requestRow(raw);
      const body=[`Nieuwe aanvraag ${r.reference}`,`Naam: ${r.name}`,`E-mail: ${r.email}`,`Telefoon: ${r.phone||'Niet opgegeven'}`,`Plaats: ${r.place}`,`Woningtype: ${r.property}`,`Planning: ${r.planning}`,`Diensten: ${r.services.map(k=>serviceNames[k]).join(', ')}`,`Wensen: ${r.description}`,`3D-keuze: ${r.color?.name||'Geen'}`,`Dashboard: ${env.APP_URL||'https://www.schildersbedrijfklement.nl'}/admin/`].join('\n\n');
      await transport.sendMail({from:env.SMTP_FROM,to:env.NOTIFICATION_EMAIL||'info@schildersbedrijfklement.nl',replyTo:r.email,subject:`Nieuwe offerteaanvraag · ${r.reference}`,text:body});
      await store.run("UPDATE enquiries SET email_status='sent' WHERE id=?",[id]);
    }catch(e){console.error('Notification delivery:',e.code||'failed');try{await store?.run("UPDATE enquiries SET email_status='failed' WHERE id=?",[id]);}catch{}}
  }
  let maintenance=null;
  async function maintain(){
    if(!store)return;try{
      await store.ensure();await store.cleanup();
      await store.run("UPDATE enquiries SET email_status='failed' WHERE email_status='sending' AND last_email_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 10 MINUTE)");
      if(transport){const pending=await store.all("SELECT id FROM enquiries WHERE lead_source='website' AND email_status IN ('pending','failed','disabled') AND email_attempts<3 AND (last_email_at IS NULL OR last_email_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 MINUTE)) ORDER BY created_at LIMIT 5");for(const r of pending)await notify(r.id);}
    }catch{}
  }
  return {app,startJobs(){void maintain();maintenance=setInterval(()=>void maintain(),60000);maintenance.unref();},stopJobs(){clearInterval(maintenance);transport?.close();},notify};
}
