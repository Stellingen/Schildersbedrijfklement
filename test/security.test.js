import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {hashPassword,verifyPassword,validateRequest,csvCell} from '../server/security.js';
const request=()=>({id:randomUUID(),name:'Testklant',email:'test@example.com',phone:'',place:'Enschede',planning:'Later / nog in overleg',property:'Een huurwoning',description:'Test',services:['binnen'],consent:true});
test('Password hashes have random salts and verify exact password bytes',async()=>{
 const password=' testing passphrase ';
 const a=await hashPassword(password),b=await hashPassword(password);assert.notEqual(a,b);assert.ok(!a.includes(password));assert.ok(await verifyPassword(password,a));assert.equal(await verifyPassword(password.trim(),a),false);
});
test('Server rejects invalid services, consent, color, contacts and oversized data',()=>{
 assert.equal(validateRequest(request()).property,'Een huurwoning');
 for(const change of [{services:['binnen','advies']},{services:['something']},{consent:false},{email:'bad\r\naddress'},{description:'x'.repeat(601)},{color:{value:'javascript:alert(1)'}},{planning:'tomorrow'},{id:'x'}])assert.throws(()=>validateRequest({...request(),...change}));
 const color={value:'#123456',name:'Kozijnen — zijdeglans',scene:'frames',finish:'satin'};assert.deepEqual(validateRequest({...request(),color}).color,color);
});
test('CSV exports prevent formula execution and escape quotes',()=>{
 assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell(' hi "there"'),'" hi ""there"""');assert.equal(csvCell('+31612345678'),'"\'+31612345678"');
});
