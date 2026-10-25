export const slotDefinitions = [
  ['hero-main','Startpagina · grote foto','work-5'], ['hero-detail','Startpagina · kleine foto','craft'],
  ['service-binnen','Dienst · binnen- en kozijnwerk','craft'], ['service-buiten','Dienst · buitenschilderwerk','work-1'],
  ['service-latex','Dienst · latex spuiten','spray'], ['service-stuc','Dienst · stucwerk','plaster'],
  ['service-behang','Dienst · behangwerk','wallpaper'], ['service-plinten','Dienst · plinten & afwerking','skirting'],
  ['project-dark','Projectalbum · donkere kozijnen','work-1'], ['project-white','Projectalbum · witte kozijnen','work-5'],
  ['about','Over Klement · foto','work-0']
];
export const defaultMedia = [
  ['work-0','dark-detail','dark','Donker houtwerk, van dichtbij','Kozijnen en het houtwerk rondom de ramen.','Detail van donker geschilderde kozijnen en buitenhoutwerk aan een bakstenen woning'],
  ['work-1','dark-overview','dark','Het geheel maakt het verschil','De aansluiting van de donkere kozijnen op de gevel.','Overzicht van donker geschilderde kozijnen en een erker aan een woning'],
  ['work-2','white-window','white','Aandacht voor het kozijn','Een kijkje langs het witte raamwerk.','Detail van een wit geschilderd raamkozijn'],
  ['work-3','white-overhang','white','Ook boven uw hoofd','De afwerking van het houtwerk onder de overstek.','Wit schilderwerk onder een overstek bij de ramen van een woning'],
  ['work-4','white-edge','white','Tot aan de laatste rand','Het witte houtwerk langs de gevel.','Detail van wit afgewerkt houtwerk langs een bakstenen gevel'],
  ['work-5','white-overview','white','Fris wit aan de buitenkant','Kozijnen en overstek in één overzicht.','Overzicht van witte kozijnen en een overstek aan een woning'],
  ['craft','craft','other','Schilderwerk aan een kozijn','','Een kozijn wordt zorgvuldig met de hand geschilderd'],
  ['spray','spray','other','Latex spuiten','','Een schilder brengt latex aan met een verfspuit'],
  ['plaster','plaster','other','Stucwerk','','Een stukadoor werkt een wand glad af'],
  ['wallpaper','wallpaper','other','Behangwerk','','Voorbereiding van een wand voor nieuw behang'],
  ['skirting','skirting','other','Plinten plaatsen','','Een vakman plaatst een plint langs de muur']
].map(([id,photoId,album,title,caption,alt],i)=>({id,photoId,album,title,caption,alt,src:`/assets/${id}.jpg`,gallery:i<6,published:true,sort:i,deletedAt:null}));
export const defaultContent = { media:defaultMedia, slots:Object.fromEntries(slotDefinitions.map(([key,,id])=>[key,id])) };
