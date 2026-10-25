import {randomUUID} from 'node:crypto';
import {HttpError,text,optionalText,serviceNames} from './security.js';
export const leadSources={website:'Websiteformulier',telefoon:'Telefoon',email:'E-mail',aanbeveling:'Aanbeveling',anders:'Anders'};
export const priorities={normaal:'Normaal',hoog:'Hoog',laag:'Laag'};
export function leadDetails(body){
 const source=body.leadSource||'website',priority=body.priority||'normaal';
 if(!Object.hasOwn(leadSources,source)||!Object.hasOwn(priorities,priority))throw new HttpError(400,'Controleer de herkomst en prioriteit.');
 const raw=body.estimatedValue;
 const estimated=raw===''||raw==null?null:Number(raw);
 if(estimated!==null&&(!Number.isFinite(estimated)||estimated<0||estimated>9999999||Math.abs(estimated*100-Math.round(estimated*100))>1e-6))throw new HttpError(400,'Vul een geldige geschatte waarde in, met maximaal twee decimalen.');
 return {source,priority,estimated};
}
export function manualLead(body){
 const details=leadDetails({...body,leadSource:body.leadSource||'telefoon'});
 const email=optionalText(body.email,120),phone=optionalText(body.phone,24);
 if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw new HttpError(400,'Controleer het e-mailadres.');
 if(!email&&!phone)throw new HttpError(400,'Vul een e-mailadres of telefoonnummer in.');
 const services=Array.isArray(body.services)?[...new Set(body.services)]:['advies'];
 if(!services.length||services.some(k=>!Object.hasOwn(serviceNames,k))||(services.includes('advies')&&services.length>1))throw new HttpError(400,'Kies geldige werkzaamheden.');
 return {id:randomUUID(),name:text(body.name,80,true),email,phone,place:optionalText(body.place,80),planning:optionalText(body.planning,80)||'Later / nog in overleg',property:optionalText(body.property,80)||'Iets anders',description:optionalText(body.description,600),services,...details};
}
