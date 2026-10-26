"""Build the static pages using Python's standard library. Railway serves dist directly."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
import re, json
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
source=(ROOT/'src/site.html').read_text()
VERSION='beheer-20261025'
PRODUCTION='https://lijnenlaag.example'
ROUTES={'diensten':'/diensten/','projecten':'/projecten/','over':'/over-lijn-en-laag/','kleur':'/kleurstudio/','werkwijze':'/werkwijze/','offerte':'/offerte/','contact':'/contact/','bedrijfsgegevens':'/contact/#bedrijfsgegevens','reviews':'/over-lijn-en-laag/#reviews'}
# Remove decorative numbering from the HTML itself, including screen-reader output.
source=re.sub(r'\b0[1-9] / ', '', source)
source=re.sub(r'<span class="card-number">\d+</span>', '', source)
source=re.sub(r'<span class="scenario-index">\d+ ↗</span>', '<span class="scenario-index" aria-hidden="true">↗</span>', source)
source=re.sub(r'<span class="step-no">0[1-9]<span>↗</span></span>', '', source)
source=re.sub(r'<span class="step-no">0[1-9]<svg[^>]*>.*?</svg></span>', '', source, flags=re.S)

class MainParts(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False); self.text=text; self.lines=[0]; self.inside=False; self.depth=0; self.parts={};self.main_start=0;self.main_end=0
        for m in re.finditer('\n',text):self.lines.append(m.end())
    def pos(self):
        l,c=self.getpos();return self.lines[l-1]+c
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='main':self.inside=True;self.main_start=self.pos();return
        if not self.inside:return
        if self.depth==0:
            self.start=self.pos(); self.key=attrs.get('id') or next((c for c in attrs.get('class','').split() if c in ['hero','quick-start','promise-bar','faq']),None)
        if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.depth+=1
    def handle_startendtag(self,tag,attrs):pass
    def handle_endtag(self,tag):
        if tag=='main':self.inside=False;self.main_end=self.pos()+len('</main>');return
        if self.inside:
            self.depth-=1
            if self.depth==0 and self.key:self.parts[self.key]=self.text[self.start:self.pos()+len(tag)+3]
parser=MainParts(source);parser.feed(source)
parts=parser.parts
assert all(k in parts for k in ['hero','quick-start','promise-bar','diensten','projecten','over','kleur','werkwijze','reviews','offerte','faq','bedrijfsgegevens','contact']),parts.keys()
head=source[:parser.main_start];tail=source[parser.main_end:]
head=head.replace('https://lijnenlaag.example', PRODUCTION)
# Shared, ordinary navigation remains usable even if JavaScript is disabled.
navitems=[('/', 'Home'),('/diensten/','Ons vakwerk'),('/projecten/','Projecten'),('/over-lijn-en-laag/','Over Lijn & Laag'),('/kleurstudio/','3D-studio'),('/contact/','Contact')]
nav='<nav class="nav" aria-label="Hoofdnavigatie" id="navigation">'+''.join(f'<a href="{u}">{t}</a>' for u,t in navitems)+'</nav>'
head=re.sub(r'<nav class="nav".*?</nav>',nav,head,flags=re.S)
head=re.sub(r'<script type="module" src="color-lab.js[^\"]*"></script>\s*','',head)
head=re.sub(r'<script type="module" src="gallery.js[^\"]*"></script>\s*','',head)
head=head.replace('href="studio.css?v=bedrijf-20261025"',f'href="studio.css?v={VERSION}"')
head=re.sub(r'src="app.js[^\"]*"', f'src="app.js?v={VERSION}"', head)
head=head.replace('</head>',f'<link rel="stylesheet" href="/pages.css?v={VERSION}"><script type="module" src="/tracking.js?v={VERSION}"></script>\n</head>')
tail=tail.replace('<button class="privacy-trigger">Privacy</button>','<a href="/privacy/">Privacy</a>')
tail=tail.replace('<a href="#">Terug naar boven ↑</a>','<a href="#main">Terug naar boven ↑</a>')
# All pages carry accessible native dialogs; initialisation is page-aware.
privacy=re.search(r'<dialog id="privacy-dialog".*?</dialog>',tail,re.S).group(0)
privacy_content=re.search(r'<div class="dialog-content">(.*)</div></dialog>',privacy,re.S).group(1)
privacy_content=re.sub(r'<p class="eyebrow">.*?</p>','',privacy_content,count=1)
privacy_content=re.sub(r'<h2>.*?</h2>','',privacy_content,count=1)


def intro(label,title,description):
    return f'<section class="page-intro"><div class="container"><nav class="breadcrumbs" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{escape(label)}</span></nav><p class="eyebrow">LIJN & LAAG · TWENTE</p><h1>{title}</h1><p class="page-lead">{description}</p></div></section>'

def route_links(html):
    # Scope transformations to HTML attributes, leaving SVG fragment references intact.
    for key,url in ROUTES.items():html=html.replace(f'href="#{key}"',f'href="{url}"')
    html=html.replace('href="#"','href="/"')
    html=re.sub(r'((?:src|href)=")assets/',r'\1/assets/',html)
    html=re.sub(r'href="((?:style|studio)\.css)',r'href="/\1',html)
    html=re.sub(r'src="((?:app|color-lab|gallery)\.js)',r'src="/\1',html)
    # Import-map URLs resolve against the document rather than this script.
    html=html.replace('"three":"./assets/three.module.js"','"three":"/assets/three.module.js"')
    return html

# Homepage teasers introduce the subject without duplicating every full page.
about_teaser='''<section class="section home-about"><div class="container home-about-grid"><div><p class="eyebrow">AANGENAAM, LIJN & LAAG</p><h2>Goed werk begint<br>met goed contact.</h2></div><div><p>Van de eerste kleurkeuze tot de laatste plint: we luisteren naar uw plannen en denken mee over de afwerking. Voor uw woning of bedrijfspand in Twente.</p><a class="text-link" href="/over-lijn-en-laag/">Maak kennis met Lijn & Laag <svg class="icon"><use href="#arrow-up"/></svg></a></div></div></section>'''
studio_teaser='''<section class="section studio-teaser"><div class="container studio-teaser-grid"><div><p class="eyebrow">UW IDEE, ALVAST IN BEELD</p><h2>Een nieuwe kleur.<br>Een andere uitstraling.</h2><p>Probeer wandkleuren, stucafwerkingen en kozijnkleuren in onze 3D-studio. Bekijk het verschil tussen vóór en na en neem uw idee mee in uw aanvraag.</p><a class="button button-blue" href="/kleurstudio/">Open de 3D-afwerkstudio <svg class="icon"><use href="#arrow-up"/></svg></a></div><a class="studio-teaser-art" href="/kleurstudio/" aria-label="Ontdek wandkleuren, stucwerk en kozijnen in de 3D-studio"><span><svg class="icon"><use href="#service-window"/></svg></span><strong>Uw woning.<br>Uw afwerking.</strong><div class="teaser-swatches" aria-hidden="true"><i style="background:#F0EFE5"></i><i style="background:#829C78"></i><i style="background:#363E42"></i></div><small>Wanden · Plafonds · Kozijnen ↗</small></a></div></section>'''
common_cta=parts['contact']
process_note='''<section class="section preparation"><div class="container"><div class="section-heading"><div><p class="eyebrow">GOED OM TE WETEN</p><h2>Een eerste idee<br>is al genoeg.</h2></div><p class="heading-aside">U hoeft de kleur en afmetingen nog niet precies te weten. Samen maken we uw plannen concreet.</p></div><div class="preparation-grid"><article><svg class="icon"><use href="#home"/></svg><h3>Vertel wat u wilt aanpakken</h3><p>Een ruimte, enkele kozijnen of meerdere werkzaamheden? Geef aan welke onderdelen aandacht nodig hebben.</p></article><article><svg class="icon"><use href="#pin"/></svg><h3>Noem uw plaats en planning</h3><p>We werken in Twente. Vermeld uw plaats en uw gewenste periode, ook als die nog in overleg is.</p></article><article><svg class="icon"><use href="#mail"/></svg><h3>Foto’s helpen bij uw uitleg</h3><p>U kunt foto’s en afmetingen later per e-mail toevoegen. Zo krijgen we een beter beeld van uw klus.</p></article></div></div></section>'''
projects_extra='''<section class="section project-details"><div class="container"><p class="eyebrow">BEKIJK HET VAN DICHTBIJ</p><h2>Oog voor de details.</h2><div class="photo-contact-sheet">'''
photos=[('demo-photo-1.webp','dark-detail','Donker houtwerk, van dichtbij'),('demo-photo-2.webp','dark-overview','Donkere kozijnen aan de gevel'),('demo-photo-0.webp','white-window','Witte kozijnen, tot aan de rand'),('demo-photo-0.webp','white-overhang','De afwerking onder de overstek'),('demo-photo-0.webp','white-edge','Wit houtwerk langs de gevel'),('demo-photo-0.webp','white-overview','Het geheel aan de buitenkant')]
for file,photoid,caption in photos:
    projects_extra+=f'<button class="photo-detail" data-gallery="all" data-photo="{photoid}"><span><img src="/assets/{file}" alt="{caption}" loading="lazy" width="600" height="450"><svg class="icon"><use href="#arrow-up"/></svg></span><strong>{caption}</strong></button>'
projects_extra+='</div></div></section>'
quote=parts['offerte'].replace('<h2>Vertel ons<br>over uw klus.</h2>','<h1 class="quote-page-title">Vertel ons<br>over uw klus.</h1>',1)
quote=re.sub(r'<h2>(.*?)</h2>',r'<h1 class="quote-page-title">\1</h1>',quote,count=1,flags=re.S)
quote=quote.replace('id="next">','id="next" disabled>')
studio=parts['kleur'].replace('<div class="studio-scenarios"', '<fieldset class="studio-setup" id="studio-setup" disabled><legend class="sr-only">Interactieve 3D-afwerkstudio</legend><div class="studio-scenarios"', 1)
end=studio.rfind('</div></section>')
studio=studio[:end]+'</fieldset>'+studio[end:]
privacy_page=f'<section class="section privacy-page"><div class="container"><article class="privacy-reading">{privacy_content}</article></div></section>'
pages={
 'home':{'path':'/','title':'Lijn & Laag | Schilderwerk en afwerking in Twente','description':'Schilderwerk, stucwerk, behang en afwerking in Twente. Bekijk ons werk, ontdek de 3D-studio en vraag vrijblijvend een offerte aan.','html':parts['hero']+parts['quick-start']+parts['promise-bar']+parts['diensten']+about_teaser+parts['projecten']+studio_teaser+parts['reviews']+common_cta},
 'diensten':{'path':'/diensten/','title':'Schilderwerk en afwerking in Twente | Lijn & Laag','description':'Binnen- en buitenschilderwerk, kozijnen, latex spuiten, stucwerk, behang en plinten. Bekijk de diensten van Lijn & Laag.','html':intro('Ons vakwerk','Schilderwerk.<br>En alles eromheen.','Een enkele ruimte of meerdere werkzaamheden in uw woning. Ontdek wat Lijn & Laag voor u kan betekenen in Twente.')+parts['diensten'].replace('<h2>Schilderwerk.<br>En alles eromheen.</h2>','<h2>Wat mogen we<br>voor u doen?</h2>',1)+common_cta},
 'projecten':{'path':'/projecten/','title':'Projecten en schilderwerk in beeld | Lijn & Laag','description':'Bekijk de echte projectfoto’s van Lijn & Laag. Ontdek geschilderde kozijnen, houtwerk en de afwerking van dichtbij.','html':intro('Projecten','Ons vakwerk.<br>Van dichtbij.','Een selectie uit de projectfoto’s van Lijn & Laag. Klik op een album of foto om de kozijnen en de afwerking beter te bekijken.')+parts['projecten']+projects_extra+common_cta},
 'over':{'path':'/over-lijn-en-laag/','title':'Over Lijn & Laag | Uw schilder in Twente','description':'Maak kennis met Lijn & Laag. Persoonlijk contact, een voorstel op maat en aandacht voor schilderwerk en afwerking in Twente.','html':intro('Over Lijn & Laag','Aangenaam.<br>Wij zijn Lijn & Laag.','Uw schilder voor binnen, buiten en de afwerking eromheen. Met persoonlijk contact en aandacht voor uw woning of bedrijfspand in Twente.')+parts['over']+'<section class="section next-page"><div class="container"><h2>Weten hoe we werken?</h2><p>Van het eerste gesprek tot de laatste streek: bekijk wat u kunt verwachten.</p><a class="button button-blue" href="/werkwijze/">Ontdek onze werkwijze <svg class="icon"><use href="#arrow-up"/></svg></a></div></section>'+parts['reviews']+common_cta},
 'kleur':{'path':'/kleurstudio/','title':'Interactieve 3D-afwerkstudio | Lijn & Laag','description':'Probeer kleuren op wanden, plafonds en kozijnen in de 3D-studio van Lijn & Laag. Vergelijk vóór en na en neem uw keuze mee in de offertehulp.','html':intro('3D-afwerkstudio','Uw idee.<br>Alvast in beeld.','Verken kleuren en afwerkingen in een ontworpen voorbeeldkamer. Een handig begin voor het gesprek over uw eigen woning.')+studio+common_cta,'studio':True},
 'werkwijze':{'path':'/werkwijze/','title':'Onze werkwijze | Lijn & Laag','description':'Van uw eerste idee tot de laatste streek. Lees hoe Lijn & Laag uw wensen bespreekt, een offerte maakt en de afwerking met u naloopt.','html':intro('Werkwijze','Een helder plan.<br>Van begin tot afwerking.','U vertelt wat u wilt aanpakken. Wij denken mee, stemmen het werk en de planning af en hebben aandacht voor de laatste details.')+parts['werkwijze']+process_note+parts['faq']+common_cta},
 'offerte':{'path':'/offerte/','title':'Vrijblijvende offerte aanvragen | Lijn & Laag','description':'Vertel Lijn & Laag over uw schilder- of afwerkingsklus in Twente. Stel in een paar stappen uw vrijblijvende offerteaanvraag samen.','html':quote+parts['faq']},
 'contact':{'path':'/contact/','title':'Contact en bedrijfsgegevens | Lijn & Laag','description':'Neem contact op met Lijn & Laag in Twente: 0000000000 of info@lijnenlaag.example. KvK 00000000.','html':intro('Contact','Een klein idee?<br>Begin met een gesprek.','Bel ons, mail uw plannen of gebruik de offertehulp. We bespreken graag wat er nodig is voor uw woning of bedrijfspand in Twente.')+parts['bedrijfsgegevens']+parts['faq']+common_cta},
 'privacy':{'path':'/privacy/','title':'Privacy bij uw aanvraag | Lijn & Laag','description':'Lees hoe de website van Lijn & Laag met uw aanvraag en contactgegevens omgaat.','html':intro('Privacy','Uw gegevens.<br>Duidelijk uitgelegd.','Zo gaan we om met uw websitebezoek en het versturen van uw aanvraag.')+privacy_page}
}

# Lijn & Laag: original, readable content and one complete regional hub.
PRODUCTION='https://lijnenlaag.example'
VERSION='lijn-en-laag-20261026'
navitems=[('/', 'Home'),('/diensten/','Wat we doen'),('/projecten/','Inspiratie'),('/werkgebied/','In Twente'),('/kleurstudio/','3D-studio'),('/contact/','Contact')]
nav='<nav class="nav" aria-label="Hoofdnavigatie" id="navigation">'+''.join(f'<a href="{u}">{t}</a>' for u,t in navitems)+'</nav>'
head=re.sub(r'<nav class="nav".*?</nav>',nav,head,flags=re.S)
head=head.replace('<link rel="stylesheet" href="/brand.css">','')
head=head.replace('</head>','<meta name="robots" content="noindex,follow"><link rel="stylesheet" href="/brand.css">\n</head>')
municipalities={
 'Enschede':['Enschede','Boekelo','Glanerbrug','Lonneker','Usselo'],
 'Hengelo':['Hengelo','Beckum','Oele'], 'Almelo':['Almelo','Aadorp','Bornerbroek'],
 'Borne':['Borne','Hertme','Zenderen'], 'Haaksbergen':['Haaksbergen','Buurse','Sint Isidorushoeve'],
 'Oldenzaal':['Oldenzaal'], 'Losser':['Losser','De Lutte','Overdinkel','Beuningen','Glane'],
 'Dinkelland':['Denekamp','Ootmarsum','Weerselo','Rossum','Deurningen','Saasveld','Lattrop','Tilligte'],
 'Tubbergen':['Tubbergen','Albergen','Geesteren','Vasse','Reutum','Fleringen','Langeveen'],
 'Hof van Twente':['Goor','Delden','Diepenheim','Markelo','Hengevelde','Bentelo'],
 'Hellendoorn':['Hellendoorn','Nijverdal','Haarle','Daarle','Daarlerveen'],
 'Rijssen-Holten':['Rijssen','Holten','Dijkerhoek'],
 'Twenterand':['Vriezenveen','Vroomshoop','Den Ham','Westerhaar-Vriezenveensewijk'],
 'Wierden':['Wierden','Enter','Hoge Hexel']}
region_cards=''.join('<article class="region-card"><h2>'+escape(name)+'</h2><p>'+escape(', '.join(places))+'</p><a href="/offerte/?plaats='+escape(places[0],quote=True)+'">Bespreek uw klus in '+escape(places[0])+' ↗</a></article>' for name,places in municipalities.items())
region_teaser='<section class="section region-teaser"><div class="container"><p class="eyebrow">DICHTBIJ, IN TWENTE</p><h2>Van Enschede tot Enter.<br>Van Almelo tot Haaksbergen.</h2><p>Schilderwerk en afwerking beginnen bij uw eigen huis. Bekijk het werkgebied, geef uw woonplaats door en bespreek wat er op uw adres nodig is.</p><a class="button button-blue" href="/werkgebied/">Bekijk alle plaatsen in Twente ↗</a></div></section>'
about_teaser='<section class="section home-about"><div class="container home-about-grid"><div><p class="eyebrow">DE LIJN ACHTER LIJN & LAAG</p><h2>Van wens naar wand.<br>Met een duidelijk plan.</h2></div><div><p>U hoeft nog niet alle kleuren of materialen te kennen. Vertel wat u aan uw huis wilt veranderen. We brengen de werkzaamheden samen en maken de volgende stap begrijpelijk.</p><a class="text-link" href="/over-lijn-en-laag/">Meer over de aanpak ↗</a></div></div></section>'
pages['home'].update(title='Lijn & Laag | Schilder en afwerking in Twente',description='Een nieuwe laag, een fijner huis. Schilderwerk, stucwerk, behang en plinten in Enschede, Hengelo, Almelo en de rest van Twente.',html=parts['hero']+parts['quick-start']+parts['promise-bar']+parts['diensten']+about_teaser+parts['projecten']+studio_teaser+region_teaser+parts['reviews']+parts['contact'])
pages['diensten'].update(title='Schilderwerk, stucwerk en behang in Twente | Lijn & Laag',description='Binnen schilderen, buitenkozijnen, latex spuiten, stucwerk, behang en plinten. Bekijk wat Lijn & Laag voor uw huis kan doen.',html=intro('Wat we doen','Van eerste basis.<br>Tot laatste laag.','Een frisse kamer, gladde wanden of verzorgd houtwerk buiten. Kies het werk dat uw huis nodig heeft en combineer werkzaamheden in één plan.')+parts['diensten']+region_teaser+parts['contact'])
pages['over'].update(path='/over-lijn-en-laag/',title='Over Lijn & Laag | Een duidelijk plan voor uw woning',description='De aanpak van Lijn & Laag: uw wensen bespreken, de voorbereiding meenemen en aandacht voor randen, kozijnen en afwerking.',html=intro('Over Lijn & Laag','Goed wonen begint<br>bij aandacht.','Kleur en afwerking maken uw huis persoonlijk. Lijn & Laag brengt schilderwerk en de kleine afwerkingen eromheen bij elkaar.')+parts['over']+parts['reviews']+parts['contact'])
pages['projecten'].update(title='Kleurinspiratie voor muren en kozijnen | Lijn & Laag',description='Verken warme groentinten en lichte interieurs. AI-gegenereerde voorbeeldfoto’s voor schilderwerk en afwerking, met een interactieve galerij.',html=intro('Inspiratie','Zie wat een nieuwe<br>laag kan doen.','AI-gegenereerde voorbeeldfoto’s voor kleur en afwerking. Geen klantprojecten of referenties: wel ideeën voor uw eigen woning.')+parts['projecten']+projects_extra.replace('Oog voor de details.','Materialen en kleuren bij elkaar.')+parts['contact'])
pages['kleur'].update(title='Probeer uw wandkleur in 3D | Lijn & Laag',description='Bekijk kleuren op muren, plafonds en kozijnen in een interactieve voorbeeldkamer. Neem uw keuze mee naar de aanvraag.',html=intro('3D-kleurstudio','Eerst even proberen.<br>Dan pas kiezen.','Verander de kleur, bekijk het licht en vergelijk de sfeer. Deze voorbeeldkamer helpt bij het gesprek; het is geen exacte voorspelling van verf in uw eigen huis.')+studio+parts['contact'])
process='<section class="section preparation"><div class="container"><div class="brand-promises"><article><span>01</span><h2>Vertel over uw huis</h2><p>Welke ruimte of welk houtwerk wilt u aanpakken? Voeg uw plaats en gewenste periode toe. Een eerste idee is voldoende.</p></article><article><span>02</span><h2>Een voorstel zonder ruis</h2><p>Voorbereiding, afwerking en planning horen bij elkaar. We bespreken wat inbegrepen is en welke keuzes nog openstaan.</p></article><article><span>03</span><h2>Van voorbereiding tot controle</h2><p>Beschermen, herstellen, afwerken en samen nalopen. De werkzaamheden worden afgestemd op de staat van de ondergrond.</p></article></div></div></section>'
pages['werkwijze'].update(title='Zo werken we | Lijn & Laag schilderwerk in Twente',description='Van uw eerste woonidee tot de controle van de afwerking. Lees hoe een aanvraag voor schilderwerk of een afwerkingsklus wordt voorbereid.',html=intro('De aanpak','Een goed begin.<br>Een verzorgd einde.','Maak uw plannen concreet, bespreek het voorstel en kijk samen naar de afwerking. Zo blijft duidelijk wat er gebeurt.')+process+parts['faq']+parts['contact'])
pages['offerte'].update(title='Bespreek uw schilderklus in Twente | Lijn & Laag',description='Kies uw werkzaamheden, woonplaats en gewenste periode. Probeer het aanvraagformulier voor schilderwerk en afwerking van Lijn & Laag.')
pages['contact'].update(title='Contact en conceptgegevens | Lijn & Laag',description='Bekijk het werkgebied en de voorbeeldgegevens van Lijn & Laag. Conceptadres info@lijnenlaag.example, KvK 00000000.',html=intro('Contact','Een eerste idee<br>is al een begin.','Vertel welke ruimte of welk onderdeel u wilt aanpakken. De gegevens hieronder zijn voorbeelden; een actief contactadres volgt bij ingebruikname.')+parts['bedrijfsgegevens']+region_teaser)
pages['privacy'].update(title='Uw gegevens bij een aanvraag | Lijn & Laag',description='Lees hoe de conceptwebsite Lijn & Laag formulieren, contacttoestemming en bezoekersstatistieken verwerkt.')
pages['werkgebied']={'path':'/werkgebied/','title':'Schilder in Twente | Enschede, Hengelo, Almelo en omgeving | Lijn & Laag','description':'Schilderwerk en afwerking in alle 14 Twentse gemeenten. Van Enschede, Hengelo en Almelo tot Haaksbergen, Oldenzaal, Losser en de dorpen daaromheen.','html':intro('Werkgebied Twente','Uw huis staat hier.<br>Uw plannen beginnen hier.','Binnen schilderen in Enschede, kozijnen opfrissen in Hengelo of een wand afwerken in Almelo? Lijn & Laag is opgezet voor schilderwerk en afwerking door heel Twente.')+'<section class="section"><div class="container"><div class="region-intro"><h2>Schilderwerk en afwerking in alle 14 gemeenten</h2><p>Hieronder vindt u de Twentse gemeenten en een selectie van hun plaatsen. Staat uw dorp er niet bij? Geef het gewoon door. Werkzaamheden en beschikbaarheid worden per adres besproken; deze lijst betekent geen afzonderlijke vestiging in iedere plaats.</p></div><div class="region-grid">'+region_cards+'</div><div class="region-intro"><h2>Wat wilt u in uw woning aanpakken?</h2><p>Muren en plafonds schilderen, binnenkozijnen, buitenhoutwerk, stucwerk, behang of plinten: begin bij het onderdeel dat voor u telt. Vertel ook iets over de ondergrond en uw planning. Zo kan de aanvraag gericht worden voorbereid.</p><a class="button button-blue" href="/diensten/">Bekijk de werkzaamheden ↗</a></div></div></section>'+parts['contact']}

for key,page in pages.items():
    pagehead=head
    pagehead=re.sub(r'<title>.*?</title>', '<title>'+escape(page['title'])+'</title>',pagehead,count=1)
    pagehead=re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*',lambda m:m.group(1)+escape(page['description'],quote=True),pagehead)
    pagehead=re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m.group(1)+escape(page['title'],quote=True),pagehead)
    if key!='home':pagehead=re.sub(r'<link rel="preload" href="assets/demo-photo-0.webp".*?>\s*','',pagehead)
    if page.get('studio'):pagehead=pagehead.replace('</head>',f'<script type="module" src="/color-lab.js?v={VERSION}"></script>\n</head>')
    if 'data-gallery' in page['html']:pagehead=pagehead.replace('</head>',f'<script type="module" src="/gallery.js?v={VERSION}"></script>\n</head>')
    active=page['path']
    pagehead=pagehead.replace('</head>',f'<link rel="canonical" href="{PRODUCTION}{active}">\n<meta property="og:url" content="{PRODUCTION}{active}">\n</head>')
    pagehead=pagehead.replace(f'<a href="{active}">',f'<a href="{active}" aria-current="page">',1)
    pagehead=pagehead.replace('<body>',f'<body class="page-{key}" data-page="{key}">')
    html=route_links(pagehead+'<main id="main">'+page['html']+'</main>'+tail)
    destination=DIST/active.strip('/')/'index.html' if active!='/' else DIST/'index.html'
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(html)
(DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+PRODUCTION+page['path']+'</loc></url>' for page in pages.values())+'</urlset>\n')
(DIST/'robots.txt').write_text('User-agent: *\nDisallow: /\nDisallow: /admin\nDisallow: /dash\nDisallow: /api/\nSitemap: '+PRODUCTION+'/sitemap.xml\n')
print('Built',len(pages),'static pages:',', '.join(page['path'] for page in pages.values()))

# Keep website text editing identities current after generating pages.
import runpy
runpy.run_path(str(Path(__file__).resolve().parent / 'prepare_copy.py'))
