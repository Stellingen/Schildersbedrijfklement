export const slotDefinitions = [
  ['hero-main','Startpagina · grote foto','work-5'], ['hero-detail','Startpagina · kleine foto','craft'],
  ['service-binnen','Dienst · binnen- en kozijnwerk','craft'], ['service-buiten','Dienst · buitenschilderwerk','work-1'],
  ['service-latex','Dienst · latex spuiten','spray'], ['service-stuc','Dienst · stucwerk','plaster'],
  ['service-behang','Dienst · behangwerk','wallpaper'], ['service-plinten','Dienst · plinten & afwerking','skirting'],
  ['project-dark','Projectalbum · donkere kozijnen','work-1'], ['project-white','Projectalbum · witte kozijnen','work-5'],
  ['about','Over Lijn & Laag · foto','work-0']
];
export const defaultMedia = [
  ['work-0','dark-detail','dark','Donker houtwerk, van dichtbij','Sfeerillustratie van kozijnen, verfkleuren en een verzorgde kamer.','Sfeerillustratie in groene tinten'],
  ['work-1','dark-overview','dark','Het geheel maakt het verschil','Illustratief kleuridee; geen uitgevoerd klantproject.','Illustratie van warmgroene wanden en kozijnen'],
  ['work-2','white-window','white','Aandacht voor het kozijn','Illustratie van een lichte interieurafwerking.','Illustratie van lichte verf en kozijnen'],
  ['work-3','white-overhang','white','Ook boven uw hoofd','Illustratief idee voor zachte tinten en houtwerk.','Illustratieve afwerking van een lichte kamer'],
  ['work-4','white-edge','white','Tot aan de laatste rand','Sfeerillustratie voor verfkleuren en aansluitingen.','Illustratie van zachte kleuren en houtwerk'],
  ['work-5','white-overview','white','Fris wit aan de buitenkant','Kleurinspiratie met lichte tinten; geen klantreferentie.','Sfeerillustratie met lichte kleuren en verzorgd houtwerk'],
  ['craft','craft','other','Schilderwerk aan een kozijn','','Illustratie van kleur en verfafwerking'],
  ['spray','spray','other','Latex spuiten','','Illustratie voor gelijkmatige wandafwerking'],
  ['plaster','plaster','other','Stucwerk','','Illustratie voor een gladde ondergrond'],
  ['wallpaper','wallpaper','other','Behangwerk','','Illustratie van een accentwand'],
  ['skirting','skirting','other','Plinten plaatsen','','Illustratie van plinten en vloeraansluiting']
].map(([id,photoId,album,title,caption,alt],i)=>({id,photoId,album,title:'Sfeerillustratie · '+title,caption,alt,src:`/assets/${id}.svg`,gallery:i<6,published:true,sort:i,deletedAt:null}));
export const defaultContent = { media:defaultMedia, slots:Object.fromEntries(slotDefinitions.map(([key,,id])=>[key,id])) };
