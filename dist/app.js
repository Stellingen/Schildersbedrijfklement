import { nextServiceSelection } from './quote-selection.js';
import { quoteURL, quotePreference } from './quote-link.js?v=paginas-20261025';
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const serviceData = {
  binnen: { name: 'Binnen- & kozijnwerk', image: 'craft.jpg', description: 'Een verzorgd kozijn of een nieuwe kleur geeft uw huis direct een andere uitstraling. We bespreken de ondergrond, de gewenste afwerking en het schilderwerk dat daarbij past.', points: ['Schilderwerk aan kozijnen, binnen en buiten', 'Aandacht voor de voorbereiding en de details', 'Kleur en afwerking samen afstemmen'] },
  buiten: { name: 'Buitenschilderwerk', image: 'work-1.jpg', description: 'De buitenkant van uw woning verdient aandacht. Met verzorgd schilderwerk krijgt uw huis een frisse uitstraling en helpen we het houtwerk te beschermen tegen weer en wind.', points: ['Kozijnen en ander schilderwerk aan uw woning', 'De staat van de ondergrond vooraf bespreken', 'Een planning passend bij het werk en het weer'] },
  latex: { name: 'Latex spuiten', image: 'spray.jpg', description: 'Wilt u rustige, gelijkmatig afgewerkte muren en plafonds? Latex spuiten is een mogelijkheid voor een strak geheel. We bekijken samen of de ondergrond en ruimte hiervoor geschikt zijn.', points: ['Voor muren en plafonds', 'Een gelijkmatige afwerking', 'Voorbereiding en afdekwerk meenemen in het voorstel'] },
  stuc: { name: 'Stucwerk', image: 'plaster.jpg', description: 'Mooi schilderwerk begint bij een goede basis. Met stucwerk maken we wanden klaar voor de volgende stap in de afwerking van uw interieur.', points: ['Een gladde basis voor wanden', 'Afwerking afstemmen op het gewenste resultaat', 'Te combineren met schilderwerk of latex spuiten'] },
  behang: { name: 'Behangwerk', image: 'wallpaper.jpg', description: 'Van een subtiele structuur tot een wand met karakter: behang maakt een ruimte persoonlijk. We bespreken uw keuze en de voorbereiding die uw wand nodig heeft.', points: ['Behang passend bij uw interieur', 'Aandacht voor de voorbereiding van de wand', 'Zorgvuldige aansluiting en afwerking'] },
  plinten: { name: 'Plinten & afwerking', image: 'skirting.jpg', description: 'Het zijn de laatste details die een ruimte compleet maken. Met zorgvuldig geplaatste plinten krijgt de overgang tussen vloer en wand een verzorgde afwerking.', points: ['Plinten voor een verzorgde overgang', 'Details en aansluitingen vooraf bespreken', 'Te combineren met uw andere werkzaamheden'] },
  advies: { name: 'Persoonlijk overleg' }
};

// Mobile navigation
const menu = $('.menu-toggle');
const nav = $('#navigation');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Menu openen');
  nav.classList.remove('open');
}
menu.addEventListener('click', () => {
  const isOpen = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!isOpen));
  menu.setAttribute('aria-label', isOpen ? 'Menu openen' : 'Menu sluiten');
  nav.classList.toggle('open', !isOpen);
});
$$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});

// The native dialog keeps keyboard focus within the open service description.
const serviceDialog = $('#service-dialog');
serviceDialog.setAttribute('aria-labelledby', 'dialog-title');
let activeService = '';
$$('.service-card').forEach(card => card.addEventListener('click', () => {
  activeService = card.dataset.service;
  const service = serviceData[activeService];
  $('#dialog-title').textContent = service.name;
  $('#dialog-description').textContent = service.description;
  $('#dialog-image').src = '/assets/' + service.image;
  $('#dialog-image').alt = $('img', card).alt;
  $('#dialog-points').replaceChildren(...service.points.map(point => {
    const item = document.createElement('li');
    item.textContent = point;
    return item;
  }));
  serviceDialog.showModal();
}));
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
});
const privacyDialog = $('#privacy-dialog');
privacyDialog.setAttribute('aria-label', 'Privacy bij uw aanvraag');
$$('.privacy-trigger').forEach(button => button.addEventListener('click', () => privacyDialog.showModal()));

// Keep the old one-page bookmarks useful after the move to separate pages.
const oldSections = { '#diensten':'/diensten/', '#projecten':'/projecten/', '#over':'/over-klement/', '#kleur':'/kleurstudio/', '#werkwijze':'/werkwijze/', '#offerte':'/offerte/', '#contact':'/contact/', '#bedrijfsgegevens':'/contact/#bedrijfsgegevens', '#reviews':'/over-klement/#reviews' };
if (document.body.dataset.page === 'home' && oldSections[location.hash]) location.replace(oldSections[location.hash]);
let selectedColor = null;
document.addEventListener('klement-color-change', event => { selectedColor = { ...event.detail }; });
document.dispatchEvent(new CustomEvent('klement-color-request'));
let quoteController = null;
function requestQuote(service, color = null) {
  if (quoteController) quoteController.start(service, color);
  else window.location.assign(quoteURL(service, color));
}
$('#use-color')?.addEventListener('click', () => { if (selectedColor) requestQuote(selectedColor.service, selectedColor); });
$$('.quick-choice[data-quote]').forEach(button => button.addEventListener('click', () => requestQuote(button.dataset.quote)));
$('#dialog-quote').addEventListener('click', () => { serviceDialog.close(); requestQuote(activeService); });

function initialiseQuote() {
// Four-step enquiry. No personal data is stored or submitted by the website.
const form = $('#quote-form');
if (!form) return null;
let enquiryColor = null;
function renderColor() {
  const badge = $('#chosen-color'); badge.hidden = !enquiryColor;
  if (enquiryColor) { $('strong', badge).textContent = enquiryColor.name; $('span', badge).style.background = enquiryColor.value; }
}
$('#remove-color').addEventListener('click', () => { enquiryColor = null; renderColor(); });
const steps = $$('.form-step');
let currentStep = 0;
let enquiryText = '';
function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function chosenServices() { return $$('input[name="services"]:checked', form).map(input => input.value); }
function applyServiceSelection(selection) {
  $$('input[name="services"]', form).forEach(input => { input.checked = selection.includes(input.value); });
}
function selectService(key) { applyServiceSelection(nextServiceSelection(chosenServices(), key, true)); }
$$('input[name="services"]', form).forEach(input => input.addEventListener('change', () => {
  applyServiceSelection(nextServiceSelection(chosenServices(), input.value, input.checked));
}));
function value(name) { return String(new FormData(form).get(name) || '').trim(); }
function hideError() {
  $('#form-error').hidden = true;
  $$('[aria-invalid]', form).forEach(field => field.removeAttribute('aria-invalid'));
}
function showError(message, field) {
  $('#form-error').textContent = message;
  $('#form-error').hidden = false;
  if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
}
function showStep(index, moveFocus = true) {
  currentStep = index;
  steps.forEach((section, i) => { section.hidden = i !== index; });
  $$('.wizard-progress li').forEach((item, i) => {
    item.classList.toggle('current', i === index);
    item.classList.toggle('complete', i < index);
    if (i === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  $('#step-count').textContent = 'Stap ' + (index + 1) + ' van 4';
  $('#previous').hidden = index === 0;
  $('#form-security').hidden = index !== 0;
  $('#next').replaceChildren(document.createTextNode(index === 3 ? 'Open e-mail & verstuur ' : 'Volgende stap '));
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add('icon');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', index === 3 ? '#arrow-up' : '#arrow');
  icon.append(use);
  $('#next').append(icon);
  $('#send-status').hidden = true;
  hideError();
  if (index === 3) updateSummary();
  if (moveFocus) {
    $('#step-title-' + index).focus({ preventScroll: true });
    const rect = $('.wizard').getBoundingClientRect();
    if (rect.top < 100 || rect.top > window.innerHeight * .5) {
      $('.wizard').scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
    }
  }
}
function validateStep() {
  hideError();
  if (currentStep === 0 && !chosenServices().length) {
    showError('Kies minimaal één dienst, of kies voor persoonlijk overleg.', $('input[name="services"]', form));
    return false;
  }
  if (currentStep === 1 && !value('place')) {
    showError('Vul de plaats in waar de werkzaamheden nodig zijn.', $('[name="place"]', form));
    return false;
  }
  if (currentStep === 2 && !value('name')) {
    showError('Vul uw naam in, zodat we weten met wie we contact opnemen.', $('[name="name"]', form));
    return false;
  }
  for (const field of $$('input,select,textarea', steps[currentStep])) {
    if (!field.checkValidity()) {
      const message = field.name === 'planning' ? 'Kies uw gewenste startperiode; nog in overleg is ook goed.'
        : field.name === 'email' ? 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.'
        : field.name === 'consent' ? 'Geef aan dat Klement contact met u mag opnemen over uw aanvraag.'
        : 'Vul dit veld in om verder te gaan.';
      showError(message, field);
      return false;
    }
  }
  return true;
}
function updateSummary() {
  const data = [
    ['Werkzaamheden', chosenServices().map(key => serviceData[key].name).join(', ')],
    ['Locatie', value('place') + ' · ' + value('property')],
    ['Planning', value('planning')],
    ...(enquiryColor ? [['Kleurvoorkeur', enquiryColor.name + ' (schermindicatie)']] : []),
    ...(value('description') ? [['Uw wensen', value('description')]] : []),
    ['Uw gegevens', [value('name'), value('email'), value('phone')].filter(Boolean).join('\n')]
  ];
  $('#summary').replaceChildren(...data.map(([label, content]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = content;
    row.append(dt, dd);
    return row;
  }));
  enquiryText = 'Beste Schildersbedrijf Klement,\n\nIk ontvang graag een vrijblijvende offerte voor de volgende plannen.\n\n' + data.map(([label, content]) => label + ':\n' + content).join('\n\n') + '\n\nIk hoor graag wat de mogelijkheden zijn.\n\nMet vriendelijke groet,\n' + value('name');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateStep()) return;
  if (currentStep < 3) { showStep(currentStep + 1); return; }
  updateSummary();
  const subject = 'Vrijblijvende offerteaanvraag — ' + value('place');
  const href = 'mailto:info@schildersbedrijfklement.nl?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(enquiryText);
  window.location.href = href;
  $('#send-status').textContent = 'Uw e-mailprogramma wordt geopend. Klik daar op verzenden om uw aanvraag te versturen. Opent er niets? Kopieer uw aanvraag en mail deze zelf naar info@schildersbedrijfklement.nl, of bel +31 6 4368 3995.';
  $('#send-status').hidden = false;
});
$('#previous').addEventListener('click', () => showStep(Math.max(0, currentStep - 1)));
form.addEventListener('input', hideError);
form.addEventListener('change', hideError);
$('.copy-request').addEventListener('click', async () => {
  updateSummary();
  const status = $('#send-status');
  try {
    await navigator.clipboard.writeText(enquiryText);
    status.textContent = 'Aanvraag gekopieerd. Plak deze in een e-mail aan info@schildersbedrijfklement.nl en verstuur hem vanuit uw eigen e-mailprogramma.';
  } catch {
    const text = document.createElement('textarea');
    text.value = enquiryText;
    text.setAttribute('aria-label', 'Selecteer en kopieer uw aanvraag');
    text.style.cssText = 'width:100%;height:150px;font-size:12px;margin-top:12px;padding:10px;';
    status.replaceChildren(document.createTextNode('Automatisch kopiëren is niet beschikbaar. Selecteer de tekst hieronder en kopieer deze naar uw e-mail.'), text);
    status.hidden = false;
    text.focus();
    text.select();
    return;
  }
  status.hidden = false;
});

const preference = quotePreference(location.search);
if (preference.service) selectService(preference.service);
if (preference.choice) { enquiryColor = preference.choice; renderColor(); }
$('#next').disabled = false;
return { start(service, color) {
  if (serviceData[service]) selectService(service);
  if (color) enquiryColor = { ...color };
  renderColor(); showStep(0, false);
  $('#offerte').scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
}};
}
quoteController = initialiseQuote();

$$('.faq details').forEach(detail => detail.addEventListener('toggle', () => {
  if (detail.open) $$('.faq details').forEach(other => { if (other !== detail) other.open = false; });
}));
$('#year').textContent = new Date().getFullYear();

// The business-details link leaves the privacy dialog before navigating on the page.
document.querySelector('.privacy-company-link')?.addEventListener('click', () => {
  document.querySelector('#privacy-dialog').close();
});
