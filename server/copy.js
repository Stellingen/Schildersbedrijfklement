import {readFile} from 'node:fs/promises';
import {HttpError,escapeHtml} from './security.js';
export const copyDefaults=JSON.parse(await readFile(new URL('./copy-defaults.json',import.meta.url),'utf8'));
export const copyKey=(page,id)=>'copy:'+page+':'+id;
export async function renderCopy(html,page,store){
 const rows=await store.all("SELECT setting_key,value FROM settings WHERE setting_key LIKE ?",['copy:'+page+':%']);
 const values=new Map(rows.map(r=>[r.setting_key,r.value]));
 return html.replace(/<site-copy data-copy="([a-f0-9]{16})">([\s\S]*?)<\/site-copy>/g,(_tag,id,original)=>'<site-copy data-copy="'+id+'">'+(values.has(copyKey(page,id))?escapeHtml(values.get(copyKey(page,id))):original)+'</site-copy>');
}
export function copyRoutes(app,store,wrap){
 app.patch('/api/admin/copy',wrap(async(req,res)=>{
  const {page,id,value,expected}=req.body;
  if(!Object.hasOwn(copyDefaults,page||'')||!Object.hasOwn(copyDefaults[page],id||''))throw new HttpError(400,'Deze tekst is niet beschikbaar om te bewerken.');
  if(typeof value!=='string'||!value.trim()||value.length>4000||typeof expected!=='string')throw new HttpError(400,'Vul een tekst in van maximaal 4000 tekens.');
  const key=copyKey(page,id),cx=await store.pool.getConnection();
  try{await cx.beginTransaction();await cx.execute('INSERT IGNORE INTO settings (setting_key,value) VALUES (?,?)',[key,copyDefaults[page][id]]);
   const [[current]]=await cx.execute('SELECT value FROM settings WHERE setting_key=? FOR UPDATE',[key]);
   if(current.value!==expected)throw new HttpError(409,'Deze tekst is ondertussen gewijzigd. Vernieuw de pagina voordat u opnieuw opslaat.');
   await cx.execute('UPDATE settings SET value=? WHERE setting_key=?',[value,key]);await cx.commit();
  }catch(err){await cx.rollback();throw err;}finally{cx.release();}
  await store.audit('Websitetekst gewijzigd · '+page);res.json({ok:true,value});
 }));
}
