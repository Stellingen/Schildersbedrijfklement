import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString('hex');
export const hash = value => createHash('sha256').update(value).digest('hex');
export const fingerprint = (secret,value) => createHmac('sha256',secret).update(value).digest('hex');
export async function hashPassword(password) {
  const salt=randomBytes(16).toString('hex');
  const key=await scrypt(password,salt,64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password,stored) {
  const [scheme,salt,hex]=String(stored).split(':');
  if(scheme!=='scrypt'||!salt||!hex)return false;
  const key=await scrypt(password,salt,64);
  const expected=Buffer.from(hex,'hex');
  return expected.length===key.length&&timingSafeEqual(expected,key);
}
export function same(a,b) { const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y); }
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function text(value,max=500,required=false) {
  if(typeof value!=='string' || value.length>max || (required&&!value.trim()))throw new HttpError(400,'Controleer de ingevulde gegevens.');
  return value.trim();
}
export const optionalText = (value,max=500)=>text(value??'',max);
export function passwordValue(value){if(typeof value!=='string'||!value.length||value.length>200)throw new HttpError(400,'Vul uw wachtwoord in.');return value;}
export const serviceNames={binnen:'Binnen- & kozijnwerk',buiten:'Buitenschilderwerk',latex:'Latex spuiten',stuc:'Stucwerk',behang:'Behangwerk',plinten:'Plinten & afwerking',advies:'Persoonlijk overleg'};
export const statuses={nieuw:'Nieuw',contact:'In contact',offerte:'Offerte verstuurd',gepland:'Ingepland',afgerond:'Afgerond',verloren:'Niet geworden',archief:'Gearchiveerd'};
export function validateRequest(body) {
  if(!body||typeof body!=='object')throw new HttpError(400,'Ongeldige aanvraag.');
  const id=text(body.id,36,true);
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new HttpError(400,'Ververs het formulier en probeer opnieuw.');
  const services=Array.isArray(body.services)?[...new Set(body.services)]:[];
  if(!services.length||services.length>7||services.some(s=>!Object.hasOwn(serviceNames,s))||(services.includes('advies')&&services.length>1))throw new HttpError(400,'Kies een geldige combinatie van diensten.');
  const email=text(body.email,120,true);
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||/[\r\n]/.test(email))throw new HttpError(400,'Vul een geldig e-mailadres in.');
  const planning=text(body.planning,80,true),property=text(body.property,80,true);
  if(!['Zo snel mogelijk, in overleg','Binnen 1 tot 3 maanden','Over 3 tot 6 maanden','Later / nog in overleg'].includes(planning)||!['Een koopwoning','Een huurwoning','Een bedrijfspand','Een VvE / meerdere woningen','Iets anders'].includes(property))throw new HttpError(400,'Controleer uw planning en woningtype.');
  if(body.consent!==true)throw new HttpError(400,'Geef toestemming voor contact over uw aanvraag.');
  let color=null;
  if(body.color) {
    if(!/^#[\da-f]{6}$/i.test(body.color.value||''))throw new HttpError(400,'Controleer de kleurkeuze.');
    color={};for(const k of ['name','value','code','scene','surface','wall','finish','texture'])if(body.color[k]!=null)color[k]=text(body.color[k],180);
  }
  return {id,name:text(body.name,80,true),email,phone:optionalText(body.phone,24),place:text(body.place,80,true),planning,property,description:optionalText(body.description,600),services,color,consent:true};
}
export function csvCell(value) { let v=String(value??'');if(/^[\s]*[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"'; }
