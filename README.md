# Schildersbedrijf Klement

Website met projectgalerij, vierstaps offertehulp en een 3D-kleurkamer. Alle publieke afbeeldingen, lettertypen en JavaScript-bestanden staan in `dist/`. De backend en het beheerdashboard gebruiken MySQL. Er is geen externe 3D-API nodig.

## Dashboard en Railway

De website gebruikt nu een Node-server met MySQL voor een afgeschermd dashboard op `/admin/`, aanvraagopslag, bezoekersstatistieken en fotobeheer. De openbare pagina’s, foto’s en 3D-studio blijven behouden.

**Volg [ADMIN-GUIDE.md](ADMIN-GUIDE.md)** voor het koppelen van MySQL, het eerste Kevin-account en optionele e-mailmeldingen. De databaseverbinding en het startwachtwoord worden uitsluitend in de Railway-variabelen ingesteld. De server maakt de benodigde tabellen automatisch aan.

De meegeleverde Dockerfile is het startpunt voor Railway. Gebruik de hoofdmap van de repository. `/health` blijft de webserver controleren. Uploads worden in MySQL bewaard en overleven een redeployment van de website.

De website ontvangt offerteaanvragen rechtstreeks en bevestigt pas nadat de database de aanvraag heeft opgeslagen. E-mailmeldingen naar Klement zijn optioneel en vereisen SMTP-instellingen. Rechtstreekse mail en telefoongesprekken worden niet automatisch ingelezen. Bezoekersstatistieken starten bij ingebruikname, zonder trackingcookies of verzonnen historische gegevens.

Voor lokale ontwikkeling: `npm ci` en `npm start`, met de database- en accountvariabelen uit `.env.example` ingesteld. De volledige instructies en testcommando’s staan in de dashboardhandleiding.

## Onderhoud

- Website en teksten: `dist/index.html`, `dist/style.css`.
- Formulier en keuzehulp: `dist/app.js`, `dist/quote-selection.js`.
- Projectfoto's en galerij: `dist/project-data.js`, `dist/gallery.js` en `dist/assets/work-*.jpg`.
- Kleurgegevens en validatie: `dist/paint-data.js`, `dist/paint-resolver.js`.
- 3D-model en weergave: `dist/room-model.js`, `dist/room-viewer.js`, `dist/paint-mode.js`.
- Bronverantwoording en rechten van gebruikte onderdelen: `SOURCES.md`, `dist/assets/three-LICENSE.txt` en `FONT-LICENSES.md`.

## Bronnen voor de hostingconfiguratie

- https://docs.railway.com/guides/react
- https://docs.railway.com/deployments/healthchecks
- https://docs.railway.com/guides/github-autodeploys

De bedrijfscontent en afbeeldingen zijn geen vrij herbruikbare template. De meegeleverde externe software en lettertypen behouden hun eigen licenties.

## 3D-afwerkstudio en ontwerpvariant

De variant van 25 oktober 2026 gebruikt `dist/studio.css` boven op de bestaande basisstijl. Het blauwe Klement-logo, projectfoto's, Google-verwijzingen, contactgegevens en offertehulp zijn behouden.

De lokaal gerenderde 3D-studio heeft drie studies: wanden schilderen, wanden/plafond stucen en kozijnen schilderen. Een gesynchroniseerde voor/na-vergelijking gebruikt twee materiaalstanden van dezelfde 3D-scène en camera. De schuif, directe scheidingslijn, cameraknoppen en toetsenbordbediening werken zonder externe API. Elke ondergrond bewaart tijdens dit paginabezoek zijn eigen kleur. De knop ‘Dit idee meenemen’ voegt het gekozen onderdeel, de kleurcode en bij kozijnen de glansvoorkeur toe aan de offertehulp en selecteert de bijpassende dienst.

De ontworpen ruwe/verweerde ondergrond en de vernieuwde versie zijn illustratieve voorbeelden, geen klantfoto's of een simulatie van bouwkundige reparaties. Daglicht, warm licht, structuur en glans geven een indruk. Codekleur toont de gekozen digitale kleurwaarde zonder licht- of glanseffect. De tool voorspelt geen fysieke verf, stucdikte, herstelbaarheid of eindresultaat in een echte woning. Bij ontbrekende WebGL-ondersteuning blijft de kleurkeuze bruikbaar.

## Huidige back-up terugzetten

De volledige, goedgekeurde versie direct vóór deze nieuwe variant is bewaard op GitHub-branch `backup/voor-futuristisch-20261025`, commit `798a4e7f197a2cb8050250c80a33cd1dc6bf4513`. Deze bevat de bijgewerkte contactgegevens, herstelde leesbaarheid en gecorrigeerde mobiele keuzekaarten.

Selecteer die branch in Railway om de vorige versie te hosten, of herstel hem op main met een nieuwe commit:

```sh
git fetch origin
git switch main
git restore --source origin/backup/voor-futuristisch-20261025 -- .
git add -A
git commit -m "Herstel website van voor futuristische variant"
git push origin main
```

De oudere proefversie blijft daarnaast beschikbaar op `backup/voor-design-test-20261024`.


## Detailuitwerking afwerkstudio

De studio bevat een echte raamopening met getrapte kozijnprofielen, aparte glasvlakken, afdichtingen, raamkruk, scharnieren en vensterbank. De vóór-stand gebruikt een illustratieve verweerde laag; de na-stand heeft instelbare lakglans met lokale omgevingsreflecties. Stucwerk kent gladde en fijn gestructureerde voorbeelden. De drie vaste camerastanden zijn per ondergrond afgestemd op overzicht, oppervlak en aansluiting. Klikken op een zichtbare wand of een kozijn selecteert het onderdeel; slepen draait de camera. Volledig scherm is beschikbaar waar de browser dit ondersteunt. De gekozen stucstructuur wordt naast kleur en onderdeel in de aanvraag meegenomen. Dit zijn afwerkingsvoorbeelden; geschiktheid en uitvoering worden met Klement afgestemd.


## Bedrijfsgegevens

De bedrijfssectie en footer vermelden KvK 87316374, handelsnaam Klussenbedrijf Klement, actuele contactgegevens, diensten en werkgebied. Dezelfde gecontroleerde gegevens staan in JSON-LD. Het juiste openbare btw-id ontbreekt nog; de oude website vermeldt bij dat label een IBAN en dat is bewust niet gekopieerd. Na aanlevering van het correcte btw-id kan dit aan de bedrijfssectie en JSON-LD worden toegevoegd. Het adres en openingstijden wachten op bevestiging wegens tegenstrijdige openbare vermeldingen. Bronnen en afwegingen staan in SOURCES.md.


## Werkgebied

Op verzoek van de eigenaar is het werkgebied beperkt tot Twente. Dit is doorgevoerd in alle paginacontent, de offertehulp, metadata en JSON-LD. Het juiste openbare btw-id moet nog worden aangeleverd; er is geen nummer geschat of afgeleid van andere bedrijfsnummers.


## Paginastructuur

De website heeft aparte statische pagina’s: `/`, `/diensten/`, `/projecten/`, `/over-klement/`, `/kleurstudio/`, `/werkwijze/`, `/offerte/`, `/contact/` en `/privacy/`. De decoratieve nummering op secties, diensten, 3D-keuzes en werkwijze is verwijderd. De functionele voortgang in het offerteformulier en de fotogalerij blijft beschikbaar.

De gedeelde content en vensters staan in `src/site.html`. Pagina-intro’s, navigatie en de selectie van secties staan in `scripts/build_pages.py`. Genereer na wijzigingen de pagina’s opnieuw met:

```sh
python3 scripts/build_pages.py
```

De Node-server serveert `dist/` en de beheer-API. Python is niet nodig in de draaiende container. `dist/pages.css` verzorgt de pagina-intro’s en overzichten. `dist/app.js` initialiseert het formulier alleen op de offertepagina. `dist/quote-link.js` valideert dienst- en 3D-voorkeuren bij het meenemen via de URL. Naam, e-mail en telefoonnummer worden niet tussen pagina’s doorgegeven. Een verstuurde aanvraag wordt via de backend in MySQL opgeslagen. Oude links naar secties op de startpagina leiden naar de overeenkomstige nieuwe pagina.

De volledige versie vóór de overstap naar aparte pagina’s is bewaard op `backup/voor-aparte-paginas-20261025`. De canonieke pagina-adressen en sitemap verwijzen naar het inmiddels bereikbare productiedomein https://www.schildersbedrijfklement.nl/.
