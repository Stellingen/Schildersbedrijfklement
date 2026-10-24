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
- Het huidige telefoonnummer en e-mailadres komen uit de oorspronkelijke website. Pas ze op alle plaatsen aan zodra de nieuwe contactgegevens bekend zijn.
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
