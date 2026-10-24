// Shared scene rules keep the model, camera, interface and enquiry in agreement.
export const studioScenes = {
  walls: { title: 'Wanden · vóór & na', label: 'Wanden schilderen', service: 'binnen', description: 'Geef de wanden een nieuwe kleur. Vergelijk de bestaande, verkleurde afwerking met uw gekozen tint.', camera: [5.1, 3.35, 6.9], target: [0, 1, -.24], minDistance: 5.4, maxDistance: 11.8 },
  plaster: { title: 'Stucwerk · vóór & na', label: 'Wanden stucen en afwerken', service: 'stuc', description: 'Bekijk een ruwe ondergrond naast een glad afgewerkte wand. Of kies het plafond om de afwerking boven u te ontdekken.', camera: [4.8, 2.7, 6.1], target: [0, 1.4, -1.0], minDistance: 4.8, maxDistance: 11 },
  frames: { title: 'Kozijnen · vóór & na', label: 'Kozijnen schilderen', service: 'binnen', description: 'Bekijk het kozijn van dichtbij: van verweerde afwerking naar een nieuwe kleur. Probeer zijdeglans of hoogglans in daglicht.', camera: [.8, 2.05, 3.3], target: [-2.8, 1.6, .35], minDistance: 2.4, maxDistance: 7 }
};
export function studioTarget(state) {
  return state.scene === 'frames' ? 'frames' : state.scene === 'plaster' && state.surface === 'ceiling' ? 'ceiling' : 'walls';
}
export function studioChoice(state) {
  const target = studioTarget(state);
  const label = target === 'ceiling' ? 'Plafond stucen en afwerken' : studioScenes[state.scene].label;
  const suffix = target === 'frames' ? ' · ' + (state.finish === 'gloss' ? 'hoogglans' : 'zijdeglans') : target === 'walls' ? ' · ' + (state.wall === 'accent' ? 'accentwand' : 'beide wanden') : '';
  return { code: state.paint.code, value: state.paint.hex, name: label + suffix + ' — ' + state.paint.code + ' · ' + state.paint.name, service: studioScenes[state.scene].service, target };
}
export function comparisonSplit(value, width) {
  const after = Math.max(0, Math.min(100, Number(value) || 0));
  const beforeWidth = Math.round(width * (1 - after / 100));
  return { beforeWidth, afterWidth: width - beforeWidth, after };
}
