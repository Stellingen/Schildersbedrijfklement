import { paintColors } from './paint-data.js';
import { resolvePaint, paintFromRgb, rgbChannels } from './paint-resolver.js';
import { studioScenes, studioTarget, studioChoice, studioDetail } from './studio-state.js?v=paginas-20261025';

const palette = document.querySelector('#paint-palette');
const input = document.querySelector('#paint-code');
const message = document.querySelector('#paint-message');
const useColor = document.querySelector('#use-color');
const savedPaints = { walls: paintColors.find(p => p.code === 'RAL 6021'), frames: paintColors.find(p => p.code === 'RAL 7016'), ceiling: paintColors[0] };
const state = { paint: savedPaints.walls, colors: Object.fromEntries(Object.entries(savedPaints).map(([key, paint]) => [key, paint.hex])), scene: 'walls', surface: 'walls', wall: 'all', light: 'day', finish: 'satin', texture: 'smooth', view: 'overview', compare: 50 };
let room = null, codeMode = 'ral';
const modes = ['ral', 'hex', 'rgb'];
const rgbInputs = ['#rgb-red', '#rgb-green', '#rgb-blue'].map(selector => document.querySelector(selector));

function paintLabel(paint) { return paint.code + ' · ' + paint.name; }
function announceColor() {
  document.dispatchEvent(new CustomEvent('klement-color-change', { detail: studioChoice(state) }));
}
document.addEventListener('klement-color-request', announceColor);
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
  const target = studioTarget(state); savedPaints[target] = paint; state.colors[target] = paint.hex;
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
  message.textContent = paint.source ? 'Gekozen: ' + paint.code + '. Kies Codekleur om de digitale schermwaarde zonder lichtfilter te bekijken.' : 'Digitale kleur toegepast. Dit is een RGB/HEX-waarde, geen verfmengrecept.';
  announceColor(); room?.update(state); updateStudioLabels();
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
function updateStudioLabels() {
  const target = studioTarget(state), detail = studioDetail(state);
  document.querySelector('#studio-view-title').textContent = target === 'ceiling' ? 'Plafond · vóór & na' : studioScenes[state.scene].title;
  document.querySelector('#texture-settings').hidden = state.scene !== 'plaster';
  document.querySelector('#selection-part').textContent = target === 'ceiling' ? 'Plafond stucen en afwerken' : studioScenes[state.scene].label;
  document.querySelector('#selection-summary').textContent = state.paint.code + ' · ' + detail.finish;
  document.querySelector('#selection-chip').style.background = state.paint.hex;
  document.querySelector('#detail-title').textContent = detail.title;
  document.querySelector('#detail-list').replaceChildren(...detail.items.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
  document.querySelector('#view-help').textContent = { overview: 'Het geheel in beeld', detail: 'Bekijk het oppervlak van dichtbij', junction: 'Bekijk de randen en aansluitingen' }[state.view];
  document.querySelector('#studio-description').textContent = studioScenes[state.scene].description;
  document.querySelector('#wall-settings').hidden = studioTarget(state) !== 'walls';
  document.querySelector('#plaster-settings').hidden = state.scene !== 'plaster';
  document.querySelector('#finish-settings').hidden = state.scene !== 'frames';
  document.querySelector('#use-color').textContent = 'Dit idee meenemen ↗';
  document.querySelector('#light-mode-note').textContent = state.light === 'neutral'
    ? 'Codekleur toont de digitale schermwaarde zonder lichtfilter. Structuur en glans van de nieuwe afwerking zijn in deze stand niet zichtbaar.'
    : 'Sfeerweergave: ' + (state.light === 'day' ? 'daglicht' : 'warm licht') + '. Licht, structuur en glans zijn illustratief en voorspellen de situatie bij u thuis niet.';
}
function changeTarget(setting, value) {
  const oldTarget = studioTarget(state);
  savedPaints[oldTarget] = state.paint;
  state[setting] = value;
  if (setting === 'scene' || setting === 'surface') {
    state.view = state.scene === 'frames' ? 'detail' : 'overview';
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
  }
  document.querySelectorAll('[data-' + setting + ']').forEach(other => other.setAttribute('aria-pressed', String(other.dataset[setting] === value)));
  if (setting === 'scene' || setting === 'surface') {
    applyPaint(savedPaints[studioTarget(state)]);
  } else { announceColor(); room?.update(state); }
  updateStudioLabels();
}
document.querySelectorAll('[data-wall], [data-light], [data-scene], [data-surface], [data-finish], [data-view], [data-texture]').forEach(button => button.addEventListener('click', () => {
  const setting = ['wall', 'light', 'scene', 'surface', 'finish', 'view', 'texture'].find(key => key in button.dataset);
  changeTarget(setting, button.dataset[setting]);
}));
const compareRange = document.querySelector('#compare-range');
function setComparison(value) {
  state.compare = Math.max(0, Math.min(100, Number(value)));
  compareRange.value = state.compare;
  const rounded = Math.round(state.compare);
  compareRange.setAttribute('aria-valuetext', rounded + ' procent vernieuwd');
  document.querySelector('#compare-value').textContent = rounded + '% vernieuwd';
  const divider = document.querySelector('#comparison-divider');
  divider.style.left = (100 - state.compare) + '%';
  divider.hidden = state.compare === 0 || state.compare === 100;
  document.querySelector('#before-badge').style.visibility = state.compare === 100 ? 'hidden' : 'visible';
  document.querySelector('#after-badge').style.visibility = state.compare === 0 ? 'hidden' : 'visible';
  document.querySelectorAll('[data-compare]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.compare) === state.compare)));
  room?.update(state);
}
compareRange.addEventListener('input', () => setComparison(compareRange.value));
document.querySelectorAll('[data-compare]').forEach(button => button.addEventListener('click', () => setComparison(button.dataset.compare)));
const divider = document.querySelector('#comparison-divider');
divider.addEventListener('pointerdown', event => {
  event.preventDefault(); divider.setPointerCapture(event.pointerId);
  const move = event => {
    const bounds = document.querySelector('#room-viewport').getBoundingClientRect();
    // Keep the handle in reach; the labelled buttons also allow full before/after.
    setComparison(Math.max(1, Math.min(99, 100 - (event.clientX - bounds.left) / bounds.width * 100)));
  };
  divider.addEventListener('pointermove', move);
  const stop = () => { divider.removeEventListener('pointermove', move); divider.removeEventListener('pointerup', stop); divider.removeEventListener('pointercancel', stop); };
  divider.addEventListener('pointerup', stop); divider.addEventListener('pointercancel', stop);
});
function unavailable() {
  document.querySelector('#room-loading').hidden = true; document.querySelector('#room-fallback').hidden = false;
  document.querySelector('.room-tools').hidden = true; document.querySelector('#room-drag-hint').hidden = true;
  document.querySelector('#room-reset').disabled = true;
  document.querySelectorAll('[data-wall], [data-light], [data-finish], [data-view], [data-compare], #compare-range').forEach(button => { button.disabled = true; });
  document.querySelector('.comparison-badges').hidden = true; document.querySelector('#comparison-divider').hidden = true;
}
document.addEventListener('klement-surface-pick', event => {
  const { target } = event.detail;
  if (target === 'frames') changeTarget('scene', 'frames');
  else if (target === 'ceiling') { changeTarget('scene', 'plaster'); changeTarget('surface', 'ceiling'); }
  else if (target === 'walls') { if (state.scene === 'frames') changeTarget('scene', 'walls'); else if (state.surface === 'ceiling') changeTarget('surface', 'walls'); changeTarget('view', 'detail'); }
});
const expand = document.querySelector('#room-expand'), panel = document.querySelector('.room-panel');
if (panel.requestFullscreen && document.fullscreenEnabled) expand.hidden = false;
expand.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen(); else await panel.requestFullscreen();
  } catch { document.querySelector('#view-help').textContent = 'Volledig scherm is niet beschikbaar. Gebruik Dichtbij om details te bekijken.'; }
});
document.addEventListener('fullscreenchange', () => { const full = document.fullscreenElement === panel; expand.textContent = full ? 'Verkleinen ↙' : 'Vergroten ↗'; expand.setAttribute('aria-label', full ? 'Volledig scherm sluiten' : 'Open de 3D-studio op volledig scherm'); });
let started = false;
async function startRoom() {
  if (started) return; started = true;
  try {
    const { createColorRoom } = await import('./room-viewer.js?v=details-20261025');
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
switchMode('ral'); applyPaint(state.paint); updateStudioLabels(); setComparison(50);

const setup = document.querySelector('#studio-setup');
function enableStudio() { if (setup && document.body.dataset.appReady === 'true') setup.disabled = false; }
document.addEventListener('klement-page-ready', enableStudio);
enableStudio();
