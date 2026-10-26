# Lijn & Laag

Een onafhankelijk concept voor schilderwerk en afwerking in Twente. De bestaande 3D-studio, aanvraagflow, fotobeheer, tekstbewerking en het leaddashboard zijn behouden; de identiteit en commerciële teksten zijn vernieuwd.

De publieke website blijft voorlopig offline. Er is geen nieuw domein geregistreerd. Het concept gebruikt `lijnenlaag.example`, een voorbeeldmailadres en KvK 00000000. Indexering staat uit zolang deze voorbeeldgegevens worden gebruikt.

## Starten

Node 24+, `npm ci`, vul de variabelen uit `.env.example` in en start met `npm start`. `python3 scripts/build_pages.py` genereert de tien pagina's en de tekstbewerkingscatalogus. `npm test` draait de controles; `TEST_MYSQL_URL` activeert ook tijdelijke database-integratietests.

## Scheiding van gegevens

`BRAND_DATABASE=lijnenlaag` maakt een eigen database binnen dezelfde MySQL-service. De oorspronkelijke database, leads, accounts, sessies, uploads en tekstwijzigingen worden niet hernoemd, gekopieerd of verwijderd. Het MySQL-account moet deze nieuwe database kunnen aanmaken. In productie is `lijnenlaag` ook de veilige standaard als deze variabele ontbreekt. Alleen tests zonder namespace gebruiken hun tijdelijke testdatabase.

`BRAND_ADMIN_USERNAME=Beheer` is de nieuwe beheerdersnaam. BRAND_ADMIN_PASSWORD maakt uitsluitend een nog niet bestaand account aan. Bestaande wachtwoorden worden niet overschreven. `DEMO_MODE=true` schakelt externe e-mailmeldingen uit, ook als oude SMTP-variabelen nog aanwezig zijn.

De code vóór de omschakeling is bewaard op branch `backup/voor-lijn-en-laag-20261026` in de bestaande bronrepository. De repositorynaam en de Railway-service kunnen hun historische infrastructuurnaam behouden; die is geen publieke bedrijfsidentiteit.

## Voor echte publicatie

Vul de echte bedrijfsgegevens, een bereikbaar telefoonnummer, mailbox en geverifieerd domein in. Controleer de inhoud en beelden voor het daadwerkelijke bedrijf. Pas APP_URL, canonicals, sitemap en gestructureerde gegevens aan, verwijder de conceptmarkering en zet indexering aan. Online vindbaarheid is geen rankinggarantie.
