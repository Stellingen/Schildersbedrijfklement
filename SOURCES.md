# Schildersbedrijf Klement — revised site

## Brand, identity and business content

- Original website: https://www.schildersbedrijfklement.nl/
- Original contact page: https://www.schildersbedrijfklement.nl/contact/
- Original project gallery: https://www.schildersbedrijfklement.nl/projecten/
- The original logo has been reused unaltered. Its dominant blue is RGB (30, 113, 183), HEX #1E71B7. A cropped icon from the same supplied artwork is used for the browser tab.
- The telephone number +31 6 43683995 and email info@schildersbedrijfklement.nl were explicitly supplied and approved by the owner. They supersede the old website email. The original site lists KvK 87316374. The similarly named klussenbedrijfklement.nl lists a different KvK; no reviews or business claims from that site have been imported.
- The hero and exterior work images are from the original Klement project gallery. Trade photographs already on the original site are retained. The former AI luxury interior and decorative serif font are no longer shipped.

## Actual Google reviews

Google Maps business CID: 11434984041496167320.
Profile link: https://maps.google.com/?cid=11434984041496167320

Inspected directly in Google Maps on 24 October 2026. The profile is named Schildersbedrijf Klement and lists the same +31 6 43683995 number, a booking link to www.schildersbedrijfklement.nl/offerte/ and a website link to schildersbedrijfdegeneraal.nl. Rating visible at inspection: 4.9/5, 16 reviews. The website labels this as a dated snapshot and links to Google for the current count; there is no automatic review integration.

Two short verbatim excerpts, 17 words in total, were confirmed on Google Maps:
- Simone Kaal, 5 stars: “Deze mannen werken keurig netjes met oog voor detail.”
- Yassir Khateb, 5 stars, excerpt within a longer review: “iemand die echt meedenkt, eerlijk advies geeft”

The directory https://www.schilderbijmij.nl/schilder/961/schildersbedrijf-klement supplied the initial Maps link. Its older review count was not used.

## Paint colour data

The 24 records in dist/paint-data.js are sourced from the publicly displayed, explicitly indicative HEX values on individual colour pages at https://ral-shop.nl/kleur/ral-CODE, the Dutch RAL distributor. Every record retains its exact source URL. The data is a limited selection, not a complete RAL catalogue or an official colour measurement service.

References:
- https://ral-shop.nl/kleur/ral-9010
- https://www.hornbach.nl/services/kleurstalen/
- https://www.hornbach.nl/services/verfmengservice/
- https://www.gamma.nl/klusadvies/a/kleurcode-achterhalen
- https://shop.ral-farben.de/en/ral-digital/ral-digital-colour-library-set.html

A complete, freely available Hornbach/GAMMA machine-readable colour API was not identified. RAL, NCS and brand-specific names/codes are not treated as interchangeable. NCS and unmapped retail codes are deliberately not converted using guesses. Only exact matches from the selection and explicit #RGB/#RRGGBB values produce a preview. Unknown input preserves the previous preview, shows an explanation and disables adding that previous colour to the quote until a valid choice is made.

The 3D room is an original, real WebGL scene with furniture geometry, procedural material textures, lights, shadows and camera controls. Colours remain a screen impression and the page recommends physical colour samples.

## Runtime and privacy

Three.js 0.169.0, OrbitControls and RoundedBoxGeometry are vendored locally under the MIT licence (dist/assets/three-LICENSE.txt). Addon import paths are adjusted to the locally hosted three.module.js. Official documentation: https://threejs.org/docs/pages/OrbitControls.html and https://threejs.org/manual/pages/creating-a-scene.html.

The scene loads near the colour section, renders on demand rather than in a continuous animation loop, and offers keyboard controls and a fallback when WebGL is unavailable. Font files, images, scripts and data are local. No tracking, external scripts, cookies or remote colour lookups are used.

The quote wizard still prepares an email for the visitor to send through their own mail application. No submission or review is described as automatically sent, received, verified through a live API or persisted by this website.


## Third revision

The opening photograph now opens a native-dialog gallery of the six original Klement photographs. Albums group the pictures by visible dark or white woodwork; no unverified location, date, before/after claim or project duration is asserted.

RAL, HEX and RGB have separate input panels. RGB values must be integers between 0 and 255. Both walls receive the selected colour by default. The neutral view uses unlit MeshBasicMaterial walls with toneMapped=false, so the supplied sRGB code is not shifted by scene lighting or tone mapping. Other room materials retain shading. Daylight and warm light are explicitly labelled as illustrative lighting effects. Digital colour values are checked by round-tripping the material colour to sRGB; this is not a physical paint calibration or a GPU pixel comparison.

The advice option is exclusive with specific services, including selections made from quick links or service details. The property choices explicitly distinguish owned and rented homes. Every service has its own original SVG icon.

The Railway configuration serves the static site with Caddy, reads the assigned PORT and supplies /health. The source can be deployed without ChatGPT authentication, build tooling or API keys. Railway itself has not been deployed by the assistant.


## Interactieve afwerkstudio (25 oktober 2026)

De 3D-kamer, meubels, kozijnonderdelen, plafondgeometrie en de procedurele structuur/verwering zijn voor dit websitevoorbeeld geschreven met de meegeleverde Three.js-code. De vóór/na-beelden zijn twee materiaaltoestanden van hetzelfde ontworpen model. Het zijn geen foto's van klantwerk en geen bouwkundige of kleurgetrouwe fysieke voorspelling. De website vermeldt dit bij de weergave. De bestaande geverifieerde RAL-schermwaarden blijven ongewijzigd.


## Bedrijfsgegevens (25 oktober 2026)

- KvK 87316374 is zichtbaar in de footer van https://www.schildersbedrijfklement.nl/ en komt overeen met https://www.werkspot.nl/profiel/klussenbedrijf-klement en https://companyinfo.nl/organisatieprofiel/burgerlijke-en-utiliteitsbouw/klussenbedrijf-klement-enschede-87316374-000053234251. Company.info vermeldt handelsnaam Klussenbedrijf Klement. De zichtbare merknaam blijft Schildersbedrijf Klement.
- De oude website zet bij het label btw-nummer een waarde in IBAN-formaat. Dat is geen Nederlands btw-id en is niet overgenomen, ook niet als bankrekening. Er is geen betrouwbaar gepubliceerd btw-id gevonden. Het juiste openbare btw-identificatienummer moet door de eigenaar worden aangeleverd. Zie voor de opbouw de Belastingdienst: https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/btw-identificatienummer-en-omzetbelastingnummer.
- Werkgebied Overijssel/Twente en de zes diensten zijn gebaseerd op de oorspronkelijke website. Contact en e-mail volgen de expliciete instructies van de eigenaar. Adres en openingstijden zijn niet overgenomen: de oorspronkelijke contactpagina noemt Enschede, terwijl gidsen Hengelo vermelden. Zonder bevestiging is geen bezoekadres of vast tijdschema gepubliceerd.
- De bedrijfsgegevens staan zichtbaar op de pagina en in lokaal opgenomen JSON-LD. Er zijn geen btw-tarieven, keurmerken, verzekeringen, garantietermijnen, aantallen klanten of jaren ervaring toegevoegd.
