import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import { defaultMedia, slotDefinitions } from '../dist/media-defaults.js';
import { hashPassword, token, fingerprint, HttpError } from './security.js';
const decode = v=>typeof v==='string'?JSON.parse(v):v;
export function mediaRow(m) { return {id:m.id,photoId:m.photo_id,title:m.title,caption:m.caption,alt:m.alt,album:m.album,src:m.src,gallery:!!m.in_gallery,published:!!m.published,sort:m.sort_order,bytes:m.bytes,deletedAt:m.deleted_at,createdAt:m.created_at}; }
export function requestRow(r){return {...r,services:decode(r.services),color:r.color?decode(r.color):null};}
export function createStore(env=process.env) {
  if(!env.MYSQL_URL&&!env.MYSQLHOST)return null;
  const options=env.MYSQL_URL ? {uri:env.MYSQL_URL} : {host:env.MYSQLHOST,port:Number(env.MYSQLPORT||3306),user:env.MYSQLUSER,password:env.MYSQLPASSWORD,database:env.MYSQLDATABASE};
  const pool=mysql.createPool({...options,connectionLimit:5,queueLimit:30,connectTimeout:8000,charset:'utf8mb4',timezone:'Z',...(env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
  let ready=false,initialising=null,retryAt=0,secret='';
  const all=async(sql,args=[]) => (await pool.execute(sql,args))[0];
  const run=async(sql,args=[]) => (await pool.execute(sql,args))[0];
  async function ensure(){
    if(ready)return;
    if(initialising)return initialising;
    if(Date.now()<retryAt)throw new HttpError(503,'De verbinding is tijdelijk niet beschikbaar. Probeer het zo opnieuw.');
    initialising=(async()=>{
      const schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
      for(const sql of schema.split(';').map(s=>s.trim()).filter(Boolean))await pool.query(sql);
      // One transaction and a row lock make first-run seeding safe across replicas.
      const cx=await pool.getConnection();
      try{
        await cx.beginTransaction();
        await cx.execute("INSERT IGNORE INTO settings (setting_key,value) VALUES ('seed','pending')");
        const [[seed]]=await cx.execute("SELECT value FROM settings WHERE setting_key='seed' FOR UPDATE");
        if(seed.value!=='done'){
          for(const m of defaultMedia)await cx.execute('INSERT IGNORE INTO media (id,photo_id,title,caption,alt,album,src,in_gallery,published,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',[m.id,m.photoId,m.title,m.caption,m.alt,m.album,m.src,m.gallery?1:0,1,m.sort]);
          for(const [key,,id] of slotDefinitions)await cx.execute('INSERT IGNORE INTO site_slots (slot_key,media_id) VALUES (?,?)',[key,id]);
          await cx.execute("UPDATE settings SET value='done' WHERE setting_key='seed'");
        }
        await cx.commit();
      }catch(e){await cx.rollback();throw e;}finally{cx.release();}
      await run("INSERT IGNORE INTO settings (setting_key,value) VALUES ('stats_secret',?)",[token()]);
      secret=(await all("SELECT value FROM settings WHERE setting_key='stats_secret'"))[0].value;
      const username=String(env.ADMIN_USERNAME||'Kevin').trim();
      if(env.ADMIN_PASSWORD && !(await all('SELECT username FROM admins WHERE username=?',[username])).length){
        if(env.ADMIN_PASSWORD.length<8||env.ADMIN_PASSWORD.length>200)throw new Error('ADMIN_PASSWORD_LENGTH');
        await run('INSERT IGNORE INTO admins (username,password_hash) VALUES (?,?)',[username,await hashPassword(env.ADMIN_PASSWORD)]);
      }
      ready=true;
    })().catch(e=>{retryAt=Date.now()+10000;console.error('Database initialisation:',e.code||'unavailable');throw new HttpError(503,'De verbinding is tijdelijk niet beschikbaar. Probeer het zo opnieuw.');}).finally(()=>{initialising=null;});
    return initialising;
  }
  async function audit(action){await run('INSERT INTO activity (action) VALUES (?)',[action.slice(0,200)]);}
  async function limit(key,max,windowMs){
    const bucket=fingerprint(secret,`${key}:${Math.floor(Date.now()/windowMs)}`);
    await run('INSERT INTO rate_limits (bucket,hits,expires_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=hits+1',[bucket,new Date(Date.now()+windowMs*2)]);
    const [r]=await all('SELECT hits FROM rate_limits WHERE bucket=?',[bucket]);
    if(r.hits>max)throw new HttpError(429,'Te veel pogingen. Wacht een kwartier en probeer opnieuw.');
  }
  async function content(){
    const media=(await all('SELECT id,photo_id,title,caption,alt,album,src,in_gallery,published,sort_order,bytes,deleted_at,created_at FROM media WHERE deleted_at IS NULL AND published=1 ORDER BY sort_order,created_at')).map(mediaRow);
    const valid=new Set(media.map(m=>m.id));
    const slots=Object.fromEntries((await all('SELECT * FROM site_slots')).map(s=>[s.slot_key,valid.has(s.media_id)?s.media_id:null]));
    return {media,slots};
  }
  async function addRequest(data){
    const reference='KL-'+randomBytes(5).toString('hex').toUpperCase();
    await run('INSERT IGNORE INTO enquiries (id,reference,name,email,phone,place,planning,property,description,services,color,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[data.id,reference,data.name,data.email,data.phone,data.place,data.planning,data.property,data.description,JSON.stringify(data.services),data.color?JSON.stringify(data.color):null,'']);
    const [r]=await all('SELECT * FROM enquiries WHERE id=?',[data.id]);
    return requestRow(r);
  }
  async function listRequests({q='',status='',page=1,limit=20}={}){
    const args=[],where=[];
    if(status){where.push('status=?');args.push(status);}
    if(q){where.push('(name LIKE ? OR email LIKE ? OR place LIKE ? OR reference LIKE ?)');args.push(...Array(4).fill('%'+q+'%'));}
    const clause=where.length?' WHERE '+where.join(' AND '):'';
    const [{total}]=await all('SELECT COUNT(*) AS total FROM enquiries'+clause,args);
    const rows=await all('SELECT * FROM enquiries'+clause+` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${(Number(page)-1)*Number(limit)}`,args);
    return {total,items:rows.map(requestRow),page};
  }
  async function stats(days){
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const since=new Date(new Date(today+'T12:00:00Z').getTime()-(days-1)*86400000).toISOString().slice(0,10);
    const daily=await all('SELECT CAST(day AS CHAR) AS day, COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM page_views WHERE day>=? GROUP BY day ORDER BY day',[since]);
    const pages=await all('SELECT path,COUNT(*) AS views FROM page_views WHERE day>=? GROUP BY path ORDER BY views DESC LIMIT 8',[since]);
    const sources=await all('SELECT source,COUNT(*) AS views FROM page_views WHERE day>=? GROUP BY source ORDER BY views DESC LIMIT 6',[since]);
    const devices=await all('SELECT device,COUNT(*) AS views FROM page_views WHERE day>=? GROUP BY device',[since]);
    const requestDays=await all('SELECT CAST(DATE(created_at) AS CHAR) AS day,COUNT(*) AS count FROM enquiries WHERE created_at>=? GROUP BY DATE(created_at)',[since]);
    const [requests]=await all("SELECT COUNT(*) AS total,COALESCE(SUM(status='nieuw'),0) AS fresh,COALESCE(SUM(follow_up<=UTC_DATE() AND status NOT IN ('afgerond','archief')),0) AS followUps FROM enquiries");
    const [pictures]=await all('SELECT COUNT(*) AS total,COALESCE(SUM(bytes),0) AS bytes FROM media WHERE deleted_at IS NULL');
    const activity=await all('SELECT action,created_at FROM activity ORDER BY id DESC LIMIT 7');
    const [first]=await all('SELECT MIN(created_at) AS since FROM page_views');
    return {daily,pages,sources,devices,requestDays,requests,pictures,activity,since:first.since};
  }
  async function saveMedia(id,m,placements){
    const cx=await pool.getConnection();
    try{
      await cx.beginTransaction();
      const [found]=await cx.execute('SELECT id FROM media WHERE id=? AND deleted_at IS NULL FOR UPDATE',[id]);
      if(!found.length)throw new HttpError(404,'Deze foto is niet meer beschikbaar.');
      await cx.execute('UPDATE media SET title=?,caption=?,alt=?,album=?,in_gallery=?,published=?,sort_order=? WHERE id=?',[m.title,m.caption,m.alt,m.album,m.gallery?1:0,m.published?1:0,m.sort,id]);
      await cx.execute('UPDATE site_slots SET media_id=NULL WHERE media_id=?',[id]);
      if(m.published)for(const key of placements)await cx.execute('INSERT INTO site_slots (slot_key,media_id) VALUES (?,?) ON DUPLICATE KEY UPDATE media_id=VALUES(media_id)',[key,id]);
      await cx.commit();
    }catch(e){await cx.rollback();throw e;}finally{cx.release();}
    await audit('Foto bijgewerkt: '+m.title);
  }
  async function cleanup(){
    await run('DELETE FROM sessions WHERE expires_at<UTC_TIMESTAMP()');
    await run('DELETE FROM rate_limits WHERE expires_at<UTC_TIMESTAMP()');
    await run('DELETE FROM page_views WHERE day<DATE_SUB(UTC_DATE(),INTERVAL 90 DAY)');
    await run('DELETE FROM activity WHERE created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 180 DAY)');
  }
  return {ensure,all,run,pool,audit,limit,content,addRequest,listRequests,stats,saveMedia,cleanup,get isReady(){return ready;},get secret(){return secret;},async close(){await pool.end();}};
}
