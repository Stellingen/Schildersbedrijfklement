# Schildersbedrijf Klement

Website met projectgalerij, vierstaps offertehulp en een 3D-kleurkamer. Alle afbeeldingen, lettertypen en JavaScript-bestanden staan in `dist/`. Er is geen buildstap, database of API-sleutel nodig voor de huidige versie.

## Hosten op Railway vanuit GitHub

1. Zet deze bestanden in de hoofdmap van een GitHub-repository: `dist/`, `Dockerfile`, `Caddyfile` en `railway.toml`. De overige documentatie mag ook mee. Een private repository is geschikt.
2. Kies in Railway **New Project → Deploy from GitHub repo** en selecteer de repository. Geef de Railway GitHub-app toegang tot deze repository als daarom wordt gevraagd.
3. Gebruik de hoofdmap (`/`) als Root Directory. Railway gebruikt de meegeleverde Dockerfile; er is geen apart build- of startcommando nodig.
4. Maak onder **Settings → Networking → Public Networking** een domein aan. Railway levert HTTPS. Een eigen domein kan daarna via de DNS-instructies van Railway worden aangesloten.
5. Controleer de website en `/health`. Dat pad moet `ok` teruggeven. De ingestelde healthcheck gebruikt dit pad bij iedere deployment.

De server luistert op de door Railway ingestelde `PORT` en alle netwerkinterfaces. Zonder `PORT` wordt lokaal poort 3000 gebruikt. Er zijn geen extra omgevingsvariabelen nodig. Gebruik de kosten en gebruikslimieten die in uw eigen Railway-account worden getoond.

Bij een gekoppelde GitHub-branch kan Railway nieuwe commits automatisch deployen. Kies daarvoor de juiste branch in de service-instellingen.

## Lokaal bekijken

Met Python 3:

```sh
python3 -m http.server 3000 --directory dist
```

Open `http://localhost:3000`. Open `index.html` niet rechtstreeks als bestand: de JavaScript-modules hebben een webserver nodig.

Met Docker:

```sh
docker build -t klement-website .
docker run --rm -p 3000:3000 -e PORT=3000 klement-website
```

## Wat werkt en wat nog moet worden gekoppeld

- De offertehulp valideert de gegevens, toont een overzicht en opent een ingevulde e-mail. De bezoeker verstuurt die e-mail zelf. Automatische verzending vanaf de website is nog niet aangesloten.
- Contactgegevens: +31 6 4368 3995 en info@schildersbedrijfklement.nl. De offertehulp richt de e-mail aan dit adres.
- De Google-score en citaten zijn een geverifieerde momentopname van 24 oktober 2026, met een link naar het juiste Google-profiel. Ze worden niet automatisch bijgewerkt.
- De kleurtool gebruikt 24 gepubliceerde RAL-schermwaarden en expliciete HEX/RGB-waarden. Onbekende RAL-, NCS- en winkelcodes worden niet gegokt. Neutraal toont de digitale codekleur zonder lichtfilter; de andere lichtstanden zijn sfeerbeelden. Een schermkleur is geen garantie voor de fysieke verf.
- Er zijn geen statistiek- of advertentiecookies, externe JavaScript-CDN's of verplichte koppelingen met ChatGPT in de websitecode. Toegangsinstellingen van een eerdere voorbeeldomgeving worden niet meegenomen naar Railway.

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
