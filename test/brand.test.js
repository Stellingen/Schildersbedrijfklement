import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const routes=['/','/diensten/','/projecten/','/over-lijn-en-laag/','/kleurstudio/','/werkwijze/','/offerte/','/contact/','/privacy/','/werkgebied/'];
test('Independent brand pages have unique headings, working internal assets and no legacy identity',async()=>{
 const titles=new Set();
 for(const route of routes){const html=await readFile(new URL('../dist'+route+'index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/klement|87316374|43683995|11434984041496167320|Simone Kaal|Yassir Khateb/i);const dom=new JSDOM(html,{url:'https://lijnenlaag.example'+route}),d=dom.window.document;
 assert.equal(d.querySelectorAll('main h1').length,1,route);assert.match(d.title,/Lijn & Laag/);assert.ok(!titles.has(d.title));titles.add(d.title);assert.equal(d.querySelector('link[rel=canonical]').href,'https://lijnenlaag.example'+route);assert.equal(d.querySelector('meta[name=robots]').content,'noindex,follow');
 const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size,route);
 for(const element of d.querySelectorAll('img[src],script[src],link[rel=stylesheet],a[href]')){const attribute=element.matches('a,link')?'href':'src',raw=element.getAttribute(attribute);if(!raw||/^(#|https?:|mailto:|tel:|data:)/.test(raw))continue;const u=new URL(raw,'https://lijnenlaag.example'+route);let path=u.pathname;if(path.endsWith('/'))path+='index.html';await stat(new URL('../dist'+path,import.meta.url));}
 dom.window.close();
 }
});
test('Regional hub covers all fourteen Twentse municipalities without invented offices or reviews',async()=>{
 const html=await readFile(new URL('../dist/werkgebied/index.html',import.meta.url),'utf8'),dom=new JSDOM(html),d=dom.window.document;
 assert.equal(d.querySelectorAll('.region-card').length,14);
 for(const place of ['Enschede','Hengelo','Almelo','Borne','Haaksbergen','Oldenzaal','Losser','Dinkelland','Tubbergen','Hof van Twente','Hellendoorn','Rijssen-Holten','Twenterand','Wierden'])assert.ok([...d.querySelectorAll('.region-card h2')].some(e=>e.textContent===place));
 assert.equal(d.querySelectorAll('.region-card a[href*="plaats="]').length,14);assert.match(d.body.textContent,/geen afzonderlijke vestiging/);dom.window.close();
});
test('New contact information is explicitly illustrative; contact consent and phone field remain available',async()=>{
 const contact=new JSDOM(await readFile(new URL('../dist/contact/index.html',import.meta.url),'utf8'));assert.match(contact.window.document.body.textContent,/00000000/);assert.match(contact.window.document.body.textContent,/Voorbeeldnummer/);assert.match(contact.window.document.body.textContent,/geen actieve mailbox/);contact.window.close();
 const quote=new JSDOM(await readFile(new URL('../dist/offerte/index.html',import.meta.url),'utf8')),d=quote.window.document;assert.equal(d.querySelector('[name=phone]').type,'tel');assert.equal(d.querySelector('[name=phone]').required,false);assert.equal(d.querySelector('[name=consent]').required,true);assert.equal(d.querySelector('[name=consent]').checked,false);assert.match(d.querySelector('.consent').textContent,/Lijn & Laag toestemming/);quote.window.close();
});
