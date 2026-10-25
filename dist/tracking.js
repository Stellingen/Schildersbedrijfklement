// No tracking cookie, localStorage identifier, URL query or customer data is sent.
if(!location.pathname.startsWith('/admin')&&navigator.doNotTrack!=='1'&&!navigator.globalPrivacyControl){
 const track=()=>{
  if(document.visibilityState!=='visible')return;
  const id=crypto.randomUUID();
  let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
  void fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,path:location.pathname,referrer}),keepalive:true}).catch(()=>{});
  document.removeEventListener('visibilitychange',track);
 };
 if(document.visibilityState==='visible')track();else document.addEventListener('visibilitychange',track);
}
