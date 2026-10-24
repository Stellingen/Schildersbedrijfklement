import { paintColors } from './paint-data.js';
import { resolvePaint, paintFromRgb, rgbChannels } from './paint-resolver.js';

const palette = document.querySelector('#paint-palette');
const input = document.querySelector('#paint-code');
const message = document.querySelector('#paint-message');
const useColor = document.querySelector('#use-color');
const state = { paint: paintColors[0], wall: 'all', light: 'neutral' };
let room = null, codeMode = 'ral';
const modes = ['ral', 'hex', 'rgb'];
const rgbInputs = ['#rgb-red', '#rgb-green', '#rgb-blue'].map(selector => document.querySelector(selector));

function paintLabel(paint) { return paint.code + ' · ' + paint.name; }
function announceColor() {
  const { paint } = state;
  document.dispatchEvent(new CustomEvent('klement-color-change', { detail: {
    code: paint.code, name: paintLabel(paint), value: paint.hex
  }}));
}
function populateFields() {
  input.value = state.paint.source ? state.paint.code : '';
  document.querySelector('#hex-code').value = state.paint.hex;
  rgbChannels(state.paint.hex).forEach((value, index) => { rgbInputs[index].value = value; });
}
function switchMode(mode, moveFocus = false) {
  codeMode = mode;
  modes.forEach(key => {
    const active = key === mode;
    const tab = document.querySelector('#code-tab-' + key);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = document.querySelector('#code-panel-' + key);
    panel.hidden = !active;
    panel.querySelectorAll('input,button').forEach(field => { field.disabled = !active; });
  });
  populateFields();
  document.querySelectorAll('#paint-search [aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  message.classList.remove('error');
  useColor.disabled = mode === 'ral' && !state.paint.source;
  message.textContent = mode === 'ral'
    ? 'Kies uit de selectie van 24 RAL-kleuren. Andere winkel- of NCS-codes worden niet automatisch vertaald.'
    : mode === 'hex' ? 'Vul uw HEX-waarde in en klik op de pijl om deze toe te passen.'
    : 'Vul drie hele getallen tussen 0 en 255 in en klik op de pijl.';
  if (moveFocus) document.querySelector('#code-tab-' + mode).focus();
}
function applyPaint(paint) {
  state.paint = paint;
  useColor.disabled = false;
  document.querySelectorAll('#paint-search [aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  document.querySelector('#color-name').textContent = paintLabel(paint);
  document.querySelector('#color-description').textContent = paint.hex + ' · RGB ' + rgbChannels(paint.hex).join(', ');
  document.querySelector('#current-color-chip').style.background = paint.hex;
  document.querySelector('#fallback-chip').style.background = paint.hex;
  document.querySelector('#custom-paint').value = paint.hex;
  document.querySelectorAll('.paint-swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.code === paint.code)));
  const source = document.querySelector('#paint-source');
  source.hidden = !paint.source;
  if (paint.source) source.href = paint.source;
  populateFields();
  message.classList.remove('error');
  message.textContent = paint.source ? 'Gekozen: ' + paint.code + '. Neutraal toont de bijbehorende digitale schermkleur.' : 'Digitale kleur toegepast. Dit is een RGB/HEX-waarde, geen verfmengrecept.';
  announceColor(); room?.update(state);
}

document.querySelectorAll('[data-code-mode]').forEach(tab => {
  tab.addEventListener('click', () => switchMode(tab.dataset.codeMode));
  tab.addEventListener('keydown', event => {
    let index = modes.indexOf(codeMode);
    if (event.key === 'ArrowRight') index = (index + 1) % modes.length;
    else if (event.key === 'ArrowLeft') index = (index + modes.length - 1) % modes.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = modes.length - 1;
    else return;
    event.preventDefault(); switchMode(modes[index], true);
  });
});
palette.replaceChildren(...paintColors.map(paint => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'paint-swatch'; button.dataset.code = paint.code;
  button.style.setProperty('--swatch', paint.hex);
  button.setAttribute('aria-label', paintLabel(paint));
  button.setAttribute('aria-pressed', String(paint.code === state.paint.code)); button.title = paintLabel(paint);
  const chip = document.createElement('span'), code = document.createElement('small');
  code.textContent = paint.code.replace('RAL ', ''); button.append(chip, code);
  button.addEventListener('click', () => { switchMode('ral'); applyPaint(paint); });
  return button;
}));
document.querySelector('#paint-codes').replaceChildren(...paintColors.map(paint => {
  const option = document.createElement('option'); option.value = paint.code; option.label = paint.name; return option;
}));
document.querySelector('#paint-search').addEventListener('submit', event => {
  event.preventDefault();
  const paint = codeMode === 'rgb' ? paintFromRgb(...rgbInputs.map(field => field.value))
    : resolvePaint(codeMode === 'ral' ? input.value : document.querySelector('#hex-code').value, codeMode);
  if (paint) { applyPaint(paint); return; }
  useColor.disabled = true; message.classList.add('error');
  const fields = codeMode === 'rgb' ? rgbInputs : [codeMode === 'ral' ? input : document.querySelector('#hex-code')];
  fields.forEach(field => field.setAttribute('aria-invalid', 'true'));
  message.textContent = codeMode === 'ral'
    ? 'Deze RAL-code of naam staat niet in de selectie. De vorige kleur blijft staan. Kies een beschikbare RAL-kleur of gebruik de juiste HEX/RGB-waarde. We gokken geen kleur.'
    : codeMode === 'hex' ? 'Vul een geldige HEX-waarde in, bijvoorbeeld #829C78.'
    : 'Vul bij R, G en B een heel getal tussen 0 en 255 in.';
  fields[0].focus();
});
document.querySelectorAll('#paint-search input').forEach(field => field.addEventListener('input', () => {
  field.removeAttribute('aria-invalid'); useColor.disabled = true;
  message.classList.remove('error'); message.textContent = 'Klik op de pijl om uw ingevoerde kleur toe te passen.';
}));
document.querySelector('#custom-paint').addEventListener('input', event => {
  const paint = resolvePaint(event.target.value, 'hex');
  if (paint) { switchMode('hex'); applyPaint(paint); }
});
document.querySelectorAll('[data-wall], [data-light]').forEach(button => button.addEventListener('click', () => {
  const setting = button.dataset.wall ? 'wall' : 'light'; state[setting] = button.dataset[setting];
  document.querySelectorAll('[data-' + setting + ']').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelector('#light-mode-note').textContent = state.light === 'neutral'
    ? 'Neutraal: de digitale codekleur op de wanden, zonder lichtfilter.'
    : 'Sfeerweergave: ' + (state.light === 'day' ? 'daglicht' : 'warm licht') + ' verandert hoe een kleur oogt. Dit voorspelt de verlichting bij u thuis niet.';
  room?.update(state);
}));
function unavailable() {
  document.querySelector('#room-loading').hidden = true; document.querySelector('#room-fallback').hidden = false;
  document.querySelector('.room-tools').hidden = true; document.querySelector('#room-drag-hint').hidden = true;
  document.querySelector('#room-reset').disabled = true;
  document.querySelectorAll('[data-wall], [data-light]').forEach(button => { button.disabled = true; });
}
let started = false;
async function startRoom() {
  if (started) return; started = true;
  try {
    const { createColorRoom } = await import('./room-viewer.js');
    room = createColorRoom(document.querySelector('#room-viewport'), state);
    document.querySelector('#room-loading').hidden = true;
  } catch (error) { console.warn('3D-kamer niet beschikbaar:', error.message); unavailable(); }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); startRoom(); }
  }, { rootMargin: '300px' }); observer.observe(document.querySelector('#kleur'));
} else startRoom();
document.querySelector('#room-reset').addEventListener('click', () => room?.reset());
document.querySelector('#room-left').addEventListener('click', () => room?.orbit(-0.15));
document.querySelector('#room-right').addEventListener('click', () => room?.orbit(0.15));
document.querySelector('#room-zoom-in').addEventListener('click', () => room?.zoom(0.88));
document.querySelector('#room-zoom-out').addEventListener('click', () => room?.zoom(1.13));
switchMode('ral'); applyPaint(state.paint);
