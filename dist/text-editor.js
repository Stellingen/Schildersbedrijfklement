export function enableTextEditing({api,bar}){
 const items=[...document.querySelectorAll('site-copy[data-copy]')];
 const panel=document.createElement('dialog');panel.className='k-text-editor';panel.setAttribute('aria-labelledby','text-editor-title');
 panel.innerHTML='<form><header><div><small>WEBSITE BEWERKEN · TEKST</small><h2 id="text-editor-title">Uw woorden. Direct op de website.</h2><p>De bestaande opmaak en links blijven behouden.</p></div><button type="button" data-close aria-label="Teksteditor sluiten">×</button></header><div class="k-text-body"><label>Tekst op deze plek<textarea rows="6" maxlength="4000" required></textarea></label><div class="k-text-meta"><span data-count></span><button type="button" data-undo>Wijziging ongedaan maken</button></div><div class="k-text-preview"><small>VOORBEELD</small><p></p></div><p class="k-text-error" role="alert" hidden></p><p class="k-text-note">Opslaan publiceert de tekst meteen. U kunt daarna opnieuw op de tekst klikken om hem te wijzigen.</p></div><footer><button type="button" data-close>Annuleren</button><button type="submit">Opslaan op website →</button></footer></form>';
 document.body.append(panel);const $=s=>panel.querySelector(s),input=$('textarea');let active=null,original='',busy=false;
 const update=()=>{$('[data-count]').textContent=input.value.length+' / 4000 tekens';$('.k-text-preview p').textContent=input.value;$('[type=submit]').disabled=busy||!input.value.trim()||input.value===original;};
 const close=()=>{if(!busy)panel.close();};panel.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);panel.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 input.addEventListener('input',update);$('[data-undo]').onclick=()=>{input.value=original;update();};
 let enabled=true;const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Tekst bewerken: aan';toggle.setAttribute('aria-pressed','true');bar.insertBefore(toggle,bar.lastElementChild);
 const mode=()=>{items.forEach(el=>{el.classList.toggle('k-copy-editable',enabled);if(enabled){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Tekst wijzigen: '+el.textContent.trim().slice(0,60));}else{el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label');}});toggle.textContent='Tekst bewerken: '+(enabled?'aan':'uit');toggle.setAttribute('aria-pressed',String(enabled));};
 toggle.onclick=()=>{enabled=!enabled;mode();};mode();
 function open(el,event){if(!enabled)return;event.preventDefault();event.stopPropagation();active=el;original=el.textContent;input.value=original;$('.k-text-error').hidden=true;update();panel.showModal();input.focus();}
 items.forEach(el=>{el.addEventListener('click',event=>open(el,event));el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')open(el,event);});});
 $('form').addEventListener('submit',async event=>{event.preventDefault();if(busy||!active)return;busy=true;update();$('[type=submit]').textContent='Wordt opgeslagen…';$('.k-text-error').hidden=true;
  try{const saved=await api('/api/admin/copy',{method:'PATCH',body:JSON.stringify({page:location.pathname,id:active.dataset.copy,value:input.value,expected:original})});active.textContent=saved.value;original=saved.value;busy=false;panel.close();mode();toggle.textContent='✓ Tekst opgeslagen';setTimeout(()=>mode(),2200);}
  catch(err){$('.k-text-error').textContent=err.message;$('.k-text-error').hidden=false;}
  finally{busy=false;update();$('[type=submit]').textContent='Opslaan op website →';}
 });
}
