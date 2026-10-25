# Dashboard voor Klement

Het dashboard staat op **https://www.schildersbedrijfklement.nl/admin/**. `/dash` en `/admin/login` verwijzen hier ook naartoe. Het beheerdersaccount staat los van ChatGPT-projecten en geeft uitsluitend toegang tot deze website.

## Eenmalig verbinden in Railway

1. Voeg **MySQL** toe aan hetzelfde Railway-project als de website. De database houdt zijn eigen persistente volume. Maak deze database niet openbaar voor de websitekoppeling.
2. Open de **website-service → Variables** en voeg toe:

| Variabele | Waarde |
| --- | --- |
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` — gebruik de werkelijke naam van uw database-service als die anders heet |
| `ADMIN_USERNAME` | `Kevin` |
| `ADMIN_PASSWORD` | Het met de eigenaar afgesproken startwachtwoord; uitsluitend als Railway-variabele invoeren |
| `APP_URL` | `https://www.schildersbedrijfklement.nl` — zonder slash aan het einde |

3. Deploy de website opnieuw. De Dockerfile start nu de Node-server. Er is geen aanvullend startcommando nodig. De server maakt zijn tabellen en het eerste beheeraccount automatisch aan.
4. Open `/admin/` op het domein dat bij `APP_URL` staat en log in. Controleer bij **Instellingen** of MySQL is verbonden. Wijzig desgewenst het startwachtwoord vanuit het dashboard.

`ADMIN_PASSWORD` wordt uitsluitend gebruikt om een nog niet bestaand account aan te maken. Een wijziging van die variabele overschrijft geen bestaand wachtwoord. Na de eerste succesvolle login kan de bootstrapvariabele worden verwijderd; het gehashte wachtwoord blijft in MySQL staan. Bewaar geen wachtwoord of database-URL in GitHub.

Het dashboard wordt pas actief als de database én het eerste account zijn gekoppeld. Zonder database blijven de openbare pagina’s bereikbaar, maar ontvangt de bezoeker geen onterechte bevestiging van een offerteaanvraag. De rechtstreekse contactmogelijkheden blijven beschikbaar.

## Optioneel: e-mailmeldingen

Een aanvraag wordt eerst in MySQL opgeslagen. Daarvoor is geen mailserver nodig. Om ook een melding op **info@schildersbedrijfklement.nl** te krijgen, stelt u in de website-service in:

| Variabele | Waarde |
| --- | --- |
| `SMTP_HOST` | De SMTP-hostnaam die de mailprovider opgeeft |
| `SMTP_PORT` | `587` voor STARTTLS of `465` voor TLS |
| `SMTP_USER` | De gebruikersnaam van het mailboxaccount |
| `SMTP_PASSWORD` | Het mailbox- of appwachtwoord, als Railway-variabele |
| `SMTP_FROM` | Een door uw mailprovider toegestaan afzenderadres |
| `NOTIFICATION_EMAIL` | `info@schildersbedrijfklement.nl` |

Deploy na het instellen opnieuw. TLS-verificatie blijft ingeschakeld. De server stuurt meldingen naar Klement en gebruikt het klantadres als antwoordadres. Er wordt geen automatische e-mail naar de klant gestuurd. De ontvangstbevestiging voor de klant verschijnt op de website.

Bij een storing blijft de aanvraag in het dashboard beschikbaar. Het dashboard toont per aanvraag of de melding wacht, is verstuurd, is mislukt of nog niet is gekoppeld. Er zijn maximaal drie automatische verzendpogingen. Na herstel kan Kevin een melding handmatig opnieuw klaarzetten. Controleer bij de provider of uitgaande SMTP op uw Railway-abonnement beschikbaar is; SMTP-instellingen alleen zijn geen aflevergarantie.

## Dagelijks gebruik

- **Overzicht:** kies 7, 30 of 90 dagen. Bekijk geschatte bezoekers, paginaweergaven, ontvangen aanvragen, populaire pagina’s, verwijzende websites en het type apparaat. De cijfers worden elke minuut vernieuwd zolang dit scherm actief is.
- **Aanvragen:** zoek op naam, e-mail, plaats of referentie, filter op status en open een aanvraag. Bekijk de werkzaamheden, planning, woningtype, toelichting en de volledige 3D-keuze. Corrigeer contactgegevens, voeg een interne notitie en opvolgdatum toe en wijzig de status. Download indien nodig een CSV-overzicht van maximaal 10.000 aanvragen.
- **Foto’s & plaatsing:** voeg JPG, PNG of WebP toe, maximaal 6 MB per bestand. Nieuwe foto’s zijn concepten. Vul titel, bijschrift en toegankelijke beschrijving in, kies het album en de volgorde, en vink de gewenste plekken aan. Zet **Zichtbaar op de website** aan en sla op. Per vaste plek kan één foto staan; het vervangen van een foto verwijdert de vorige foto niet uit het beheer.
- **Projectgalerij:** vink **Opnemen in de projectgalerij** aan. Het album bepaalt of de foto ook onder donkere of witte kozijnen verschijnt. Foto’s bij Overig werk zijn via de volledige galerij en het foto-overzicht bereikbaar.
- **Prullenbak:** een verwijderde foto verdwijnt van de ingestelde plekken en uit de galerij. Herstellen maakt de foto weer beschikbaar als concept; publiceer en plaats deze opnieuw waar gewenst. De meegeleverde originele bestanden blijven als bron in de repository bewaard. Geüploade foto’s blijven voor herstel in MySQL bewaard.
- **Instellingen:** controleer de database- en mailverbinding en wijzig het beheerwachtwoord. Nieuwe wachtwoorden via dit scherm moeten minimaal 12 tekens bevatten.

## Wat bezoekersstatistieken betekenen

De teller begint bij ingebruikname. Er worden geen oude of voorbeeldcijfers toegevoegd. Een dagelijks wisselende HMAC-code van het IP-adres en de browsergegevens schat het aantal bezoekers per dag; het IP-adres en de volledige browsergegevens worden niet in de statistiektabel opgeslagen. Meerdere mensen met dezelfde aansluiting en browser kunnen samenvallen. Dezelfde persoon kan op verschillende dagen opnieuw meetellen. Het periodetotaal telt dagtotalen op en is dus geen uniek personenbereik over de gehele periode.

De metingen bevatten alleen openbare paginapaden, de hostname van een externe verwijzer en een grof apparaattype. URL-zoekvragen, klantgegevens en dashboardbezoeken worden niet gemeten. Bekende bots worden gefilterd. Do Not Track en Global Privacy Control worden gerespecteerd waar ze worden doorgegeven. Browsers die de meting blokkeren worden niet geteld. Er worden geen trackingcookies of permanente browser-ID’s gezet.

Statistieken worden na 90 dagen verwijderd; het activiteitenlog na 180 dagen. Opgeslagen aanvragen blijven beschikbaar voor de behandeling en opvolging. Rechtstreeks ontvangen e-mails en telefoongesprekken worden niet automatisch ingelezen.

## Opslag en onderhoud

- MySQL bewaart aanvragen, beheeraccounts, sessies, foto’s, plaatsingen, statistieken en activiteit. Uploads worden opnieuw als WebP gecodeerd, verkleind tot maximaal 2400 × 2400 pixels en zonder oorspronkelijke EXIF-metadata opgeslagen. Een extra volume op de website-service is niet nodig.
- Maak databaseback-ups via Railway. Bij het verwijderen van de database gaan ook de geüploade foto’s verloren; een GitHub-back-up bevat uitsluitend code en de oorspronkelijke fotobestanden.
- De login gebruikt gesalte scrypt-hashes, sessies van acht uur met HttpOnly/SameSite-cookies, CSRF-controle en limieten op inlogpogingen. Beheer-API’s vereisen een geldige sessie. Uploads worden op de server gedecodeerd en gevalideerd.
- Gebruik HTTPS in productie. `APP_URL` bepaalt vanaf welke website wijzigingen en aanvragen mogen worden ingediend. Zet daar het exacte domein waarop Kevin inlogt.
- `/health` controleert de webserver zodat een databaseonderbreking de openbare website niet onnodig offline haalt. De verbindingsstatus in het dashboard controleert de database.

## Lokaal en testen

```sh
npm ci
node --env-file=.env server/index.js
```

Kopieer daarvoor `.env.example` naar een eigen, niet gedeeld `.env` en vul de lokale databasegegevens in. Gebruik voor lokaal HTTP ook een lokale `APP_URL`, bijvoorbeeld `http://localhost:3000`, en laat `NODE_ENV` op development.

```sh
npm test
TEST_MYSQL_URL=mysql://user:password@localhost:3306/mysql npm test
```

De integratietest maakt een tijdelijke, willekeurig genoemde database en verwijdert die na afloop. Gebruik uitsluitend een testserver en een testaccount dat databases mag aanmaken. Zonder `TEST_MYSQL_URL` worden alleen de onafhankelijke beveiligings- en validatietests uitgevoerd.

De volledige website vóór het dashboard is bewaard op GitHub-branch `backup/voor-beheerdashboard-20261025`. Terugzetten van die branch herstelt de vorige statische server. Dat verwijdert geen gegevens uit een afzonderlijk draaiende MySQL-service.

Referenties: [Railway MySQL](https://docs.railway.com/databases/mysql), [mysql2](https://sidorares.github.io/node-mysql2/docs), [Nodemailer SMTP](https://nodemailer.com/smtp), [Sharp](https://sharp.pixelplumbing.com/).
