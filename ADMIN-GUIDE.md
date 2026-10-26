# Beheer van Lijn & Laag

De publieke toegang blijft voorlopig uit. De nieuwe beheerdersnaam is **Beheer**. Een nieuw startwachtwoord moet via BRAND_ADMIN_PASSWORD in Railway worden ingesteld; de oude login wordt niet overgenomen.

## Dagelijks gebruik

- **Overzicht:** bezoekersstatistieken, open leads, geschatte kluswaarde en opvolgdatums. De nieuwe database begint leeg; er zijn geen verzonnen bezoekers of aanvragen.
- **Leads & aanvragen:** gebruik het bord of de lijst. Open een lead om contactgegevens, werkzaamheden, toestemming, notities, prioriteit, waarde en opvolgdatum te bekijken of wijzigen. Telefoontjes en rechtstreekse e-mails kunt u handmatig toevoegen.
- **Niet geworden:** bewaart de gegevens zodat een aanvraag later kan worden teruggevonden. **Lead verwijderen** biedt daarnaast een bevestigde, definitieve verwijdering. Dat wist geen eerder verzonden e-mail uit een mailbox.
- **Foto's & plaatsing:** kies per plek een bestaande afbeelding of upload een JPG, PNG of WebP van maximaal 6 MB. De meegeleverde beelden zijn eigen SVG-sfeerillustraties. Ze zijn geen klantreferenties. Uploads worden als WebP opgeslagen. Plaatsing, galerij, titel, bijschrift en volgorde zijn te beheren.
- **Website bewerken:** na inloggen opent `/?bewerken=1` de foto- en tekstbewerkstand. Teksten hebben een live voorbeeld en worden na opslaan direct bewaard. De knop om tekstbewerking uit te zetten maakt gewone navigatie weer mogelijk. Bij een gelijktijdige wijziging voorkomt de server overschrijven.
- **Instellingen:** verbindingsstatus en wachtwoordwijziging. Nieuwe wachtwoorden via het dashboard hebben minimaal 12 tekens.

## Nieuwe, onafhankelijke gegevens

De Railway-variabele `BRAND_DATABASE=lijnenlaag` scheidt alle leads, accounts, sessies, afbeeldingen, tekstwijzigingen en statistieken van de vorige website. De oude database wordt niet geleegd of meegenomen. De nieuwe database bevat alleen de illustratieve startbeelden; leads en bezoekhistorie beginnen leeg.

Automatische e-mailmeldingen staan met `DEMO_MODE=true` uit. Het voorbeeldadres info@lijnenlaag.example is geen actieve mailbox. KvK 00000000 en de bedrijfsnaam zijn conceptgegevens. Het nieuwe domein is niet geregistreerd. De website blijft offline en uitgesloten van indexering totdat echte gegevens en een publicatiebesluit zijn vastgesteld.

## Opslag

MySQL bewaart de nieuwe gegevens in de eigen database. Maak daarvan back-ups via Railway. Paginaweergaven worden na 90 dagen verwijderd, activiteiten na 180 dagen. Er worden geen trackingcookies of onversleutelde wachtwoorden opgeslagen.
