export const slotDefinitions = [
  ['hero-main','Startpagina · grote foto','work-5'], ['hero-detail','Startpagina · kleine foto','craft'],
  ['service-binnen','Dienst · binnen- en kozijnwerk','craft'], ['service-buiten','Dienst · buitenschilderwerk','work-1'],
  ['service-latex','Dienst · latex spuiten','spray'], ['service-stuc','Dienst · stucwerk','plaster'],
  ['service-behang','Dienst · behangwerk','wallpaper'], ['service-plinten','Dienst · plinten & afwerking','skirting'],
  ['project-dark','Projectalbum · donkere kozijnen','work-1'], ['project-white','Projectalbum · witte kozijnen','work-5'],
  ['about','Over Lijn & Laag · foto','work-0']
];
export const defaultMedia = [
  ['work-0','dark-detail','dark','Donker houtwerk, van dichtbij','AI-voorbeeldfoto van kozijnen, verfkleuren en een verzorgde kamer.','AI-voorbeeldfoto in groene tinten'],
  ['work-1','dark-overview','dark','Het geheel maakt het verschil','AI-voorbeeldfotof kleuridee; geen uitgevoerd klantproject.','AI-voorbeeldfoto van warmgroene wanden en kozijnen'],
  ['work-2','white-window','white','Aandacht voor het kozijn','AI-voorbeeldfoto van een lichte interieurafwerking.','AI-voorbeeldfoto van lichte verf en kozijnen'],
  ['work-3','white-overhang','white','Ook boven uw hoofd','AI-voorbeeldfotof idee voor zachte tinten en houtwerk.','AI-voorbeeldfotove afwerking van een lichte kamer'],
  ['work-4','white-edge','white','Tot aan de laatste rand','AI-voorbeeldfoto voor verfkleuren en aansluitingen.','AI-voorbeeldfoto van zachte kleuren en houtwerk'],
  ['work-5','white-overview','white','Fris wit aan de buitenkant','Kleurinspiratie met lichte tinten; geen klantreferentie.','AI-voorbeeldfoto met lichte kleuren en verzorgd houtwerk'],
  ['craft','craft','other','Schilderwerk aan een kozijn','','AI-voorbeeldfoto van kleur en verfafwerking'],
  ['spray','spray','other','Latex spuiten','','AI-voorbeeldfoto voor gelijkmatige wandafwerking'],
  ['plaster','plaster','other','Stucwerk','','AI-voorbeeldfoto voor een gladde ondergrond'],
  ['wallpaper','wallpaper','other','Behangwerk','','AI-voorbeeldfoto van een accentwand'],
  ['skirting','skirting','other','Plinten plaatsen','','AI-voorbeeldfoto van plinten en vloeraansluiting']
].map(([id,photoId,album,title,caption,alt],i)=>({id,photoId,album,title:'AI-voorbeeldfoto · '+title,caption,alt,src:'/assets/demo-photo-'+({"work-5":0,"work-4":0,"work-3":0,"work-2":0,"work-0":1,craft:1,spray:1,plaster:0,wallpaper:0,skirting:0,"work-1":2}[id]??0)+'.webp',gallery:i<6,published:true,sort:i,deletedAt:null}));
export const defaultContent = { media:defaultMedia, slots:Object.fromEntries(slotDefinitions.map(([key,,id])=>[key,id])) };
