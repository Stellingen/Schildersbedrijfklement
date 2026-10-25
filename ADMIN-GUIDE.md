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

- **Overzicht:** klik op een statistiek of een fase in de voortgang om door te gaan. Wissel in de grafiek tussen bezoekers, paginaweergaven en leads. Klik op een dag of gebruik de pijltjestoetsen. De tabel biedt dezelfde cijfers. Opvolgdatums en de geschatte waarde van open leads helpen bij de planning. De cijfers vernieuwen elke minuut zolang dit scherm actief is.
- **Leads & aanvragen:** websiteaanvragen verschijnen automatisch. Gebruik het bord om kaarten te verslepen of kies een status onder de kaart. Er zijn statussen voor nieuw, in contact, offerte verstuurd, ingepland, afgerond, niet doorgegaan en archief. De lijstweergave biedt paginering; het bord toont maximaal 100 resultaten. Zoek en filter op status en prioriteit. Voeg via **Lead toevoegen** ook een telefoontje, e-mail of aanbeveling toe. Vul minimaal telefoon of e-mail in.
- **Lead bekijken:** open een kaart voor de klantgegevens, werkzaamheden, planning, toelichting en 3D-keuzes. Houd contactgegevens, herkomst, prioriteit, geschatte kluswaarde, interne notities en opvolgdatum bij. De waarde is een eigen schatting, geen omzetmeting. Bij handmatige leads wordt geen websiteformulier-toestemming verzonnen. CSV-export bevat maximaal 10.000 leads.
- **Foto’s op uw website:** elke kaart toont een vaste plek met de actuele foto, zoals de grote hoofdfoto, een dienst of een projectalbum. Klik **Foto wijzigen** of **Foto kiezen**. Kies uit de bibliotheek of upload JPG, PNG of WebP van maximaal 6 MB. Vergelijk de huidige en nieuwe foto en klik **Publiceer op deze plek**. Alleen de gekozen plek verandert; de vorige foto blijft bewaard. Een projectalbumfoto wordt ook aan dat album toegevoegd.
- **Bewerk op de website:** log in en open **Website bewerken**, of ga naar `/?bewerken=1`. Blauwe fotoknoppen openen dezelfde fotokeuze op de werkelijke plek. Bij losse galerijfoto’s vervangt u de afbeelding overal waar deze foto wordt gebruikt. Met **Klaar met bewerken** sluit u de bewerkstand. Bezoekers zonder beheersessie zien de gewone website.
- **Fotobibliotheek:** beheer titel, bijschrift, beschrijving, album, volgorde, zichtbaarheid en meerdere plaatsingen. **Afbeelding overal vervangen** bewaart de titel, het foto-ID en alle plaatsingen. Nieuwe losse uploads beginnen als concept; vink de plekken en **Zichtbaar op de website** aan om ze te publiceren.
- **Projectgalerij:** vink **Opnemen in de projectgalerij** aan. Het album bepaalt of de foto onder donkere of witte kozijnen verschijnt. Overig werk is via de volledige galerij bereikbaar.
- **Prullenbak:** een verwijderde foto verdwijnt van de vaste plekken en uit de galerij. Herstellen maakt de foto beschikbaar als concept; publiceer en plaats deze opnieuw. Geüploade foto’s blijven voor herstel in MySQL bewaard.
- **Instellingen:** controleer database en e-mail en wijzig het beheerwachtwoord. Nieuwe wachtwoorden via dit scherm moeten minimaal 12 tekens bevatten. E-mailmeldingen vereisen een afzonderlijke SMTP-koppeling; opslaan en opvolgen van leads werkt ook zonder.

## Wat bezoekersstatistieken betekenen

De teller begint bij ingebruikname. Er worden geen oude of voorbeeldcijfers toegevoegd. Een dagelijks wisselende HMAC-code van het IP-adres en de browsergegevens schat het aantal bezoekers per dag; het IP-adres en de volledige browsergegevens worden niet in de statistiektabel opgeslagen. Meerdere mensen met dezelfde aansluiting en browser kunnen samenvallen. Dezelfde persoon kan op verschillende dagen opnieuw meetellen. Het periodetotaal telt dagtotalen op en is dus geen uniek personenbereik over de gehele periode.

De metingen bevatten alleen openbare paginapaden, de hostname van een externe verwijzer en een grof apparaattype. URL-zoekvragen, klantgegevens en dashboardbezoeken worden niet gemeten. Bekende bots worden gefilterd. Do Not Track en Global Privacy Control worden gerespecteerd waar ze worden doorgegeven. Browsers die de meting blokkeren worden niet geteld. Er worden geen trackingcookies of permanente browser-ID’s gezet.

Statistieken worden na 90 dagen verwijderd; het activiteitenlog na 180 dagen. Opgeslagen aanvragen blijven beschikbaar voor de behandeling en opvolging. Rechtstreeks ontvangen e-mails en telefoongesprekken worden niet automatisch ingelezen; voeg ze zelf als lead toe.

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

De versie vóór de dashboardvernieuwing is bewaard op branch `backup/voor-dashboard-vernieuwing-20261026`. Deze release voegt drie leadvelden toe en maakt contacttoestemming optioneel voor handmatige leads. Bestaande gegevens, accounts en foto’s blijven bewaard.
