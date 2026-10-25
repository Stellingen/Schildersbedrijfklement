import { resolvePaint } from './paint-resolver.js';
import { studioChoice } from './studio-state.js?v=paginas-20261025';

const services = new Set(['binnen','buiten','latex','stuc','behang','plinten','advies']);
const scenes = new Set(['walls','plaster','frames']);
const oneOf = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;

// Only non-personal preferences travel between pages. Contact details stay in the form.
export function quoteURL(service, choice) {
  const query = new URLSearchParams();
  if (services.has(service)) query.set('dienst', service);
  if (choice && /^#[0-9a-f]{6}$/i.test(choice.value)) {
    query.set('kleur', choice.value);
    query.set('kleurcode', choice.code);
    for (const key of ['scene','surface','wall','finish','texture']) if (choice[key]) query.set(key, choice[key]);
  }
  return '/offerte/' + (query.size ? '?' + query.toString() : '');
}
export function quotePreference(search) {
  const query = new URLSearchParams(search);
  let service = services.has(query.get('dienst')) ? query.get('dienst') : null;
  let choice = null;
  const hex = query.get('kleur') || '';
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    const ral = resolvePaint(query.get('kleurcode') || '', 'ral');
    const paint = ral?.hex.toUpperCase() === hex.toUpperCase() ? ral : resolvePaint(hex, 'hex');
    if (paint) {
      const scene = scenes.has(query.get('scene')) ? query.get('scene') : 'walls';
      choice = studioChoice({ paint, scene,
        surface: oneOf(query.get('surface'), ['walls','ceiling'], 'walls'),
        wall: oneOf(query.get('wall'), ['all','accent'], 'all'),
        finish: oneOf(query.get('finish'), ['satin','gloss'], 'satin'),
        texture: oneOf(query.get('texture'), ['smooth','fine'], 'smooth') });
      service = choice.service;
    }
  }
  return { service, choice };
}
