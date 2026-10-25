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
  const texture = state.scene === 'plaster' ? ' · ' + (state.texture === 'fine' ? 'fijne structuur' : 'glad') : '';
  return { code: state.paint.code, value: state.paint.hex, name: label + suffix + texture + ' — ' + state.paint.code + ' · ' + state.paint.name, service: studioScenes[state.scene].service, target, scene: state.scene, surface: state.surface, wall: state.wall, finish: state.finish, texture: state.texture };
}
export function comparisonSplit(value, width) {
  const after = Math.max(0, Math.min(100, Number(value) || 0));
  const beforeWidth = Math.round(width * (1 - after / 100));
  return { beforeWidth, afterWidth: width - beforeWidth, after };
}

// Camera presets frame the actual joinery and junctions rather than just zooming the whole scene.
export function studioView(state) {
  const target = studioTarget(state), view = state.view || 'overview';
  const presets = {
    walls: {
      overview: { camera: [5.1,3.35,6.9], target: [0,1,-.24], min: 5.4, max: 11.8 },
      detail: { camera: [2.4,2.25,.3], target: [1.1,2.05,-2.73], min: 1.2, max: 6 },
      junction: { camera: [3.5,.85,-.2], target: [2.55,.17,-2.72], min: .7, max: 5 }
    },
    frames: {
      overview: { camera: [.8,2.05,3.3], target: [-2.8,1.6,.35], min: 2.4, max: 7 },
      detail: { camera: [-.65,1.9,2.55], target: [-2.82,1.5,.4], min: .9, max: 5 },
      junction: { camera: [-1.5,1.03,1.9], target: [-2.80,.76,1.16], min: .55, max: 4 }
    },
    ceiling: {
      overview: { camera: [4.4,1.1,5.8], target: [0,2.3,-.2], min: 4.8, max: 11 },
      detail: { camera: [2.7,1.5,2], target: [.9,2.92,-.4], min: 1.2, max: 6 },
      junction: { camera: [2.7,1.7,-.2], target: [2.9,2.91,-2.70], min: .7, max: 5 }
    }
  };
  return presets[target][view] || presets[target].overview;
}
export function studioDetail(state) {
  const target = studioTarget(state);
  if (target === 'frames') return { title: 'Kozijn, tot in de aansluiting', items: ['Verdiepte sponning en afzonderlijke glasvlakken', 'Rubbers, metalen raamkruk en scharnieren', 'Verflaag, glans en aansluiting op de vensterbank'], finish: state.finish === 'gloss' ? 'Hoogglans' : 'Zijdeglans' };
  if (target === 'ceiling') return { title: 'Een rustige basis boven u', items: ['Ruwe ondergrond tegenover een egale afwerking', 'Glad of met een fijne oppervlaktestructuur', 'Aansluiting tussen plafond, wand en sierlijst'], finish: state.texture === 'fine' ? 'Fijne structuur' : 'Glad' };
  return { title: state.scene === 'plaster' ? 'De ondergrond maakt het verschil' : 'Uw kleur, ook van dichtbij', items: state.scene === 'plaster' ? ['Ruwe ondergrond en gladde eindafwerking', 'Keuze uit glad of fijne oppervlaktestructuur', 'Randen en de aansluiting langs de plint'] : ['Uw kleur op één wand of beide wanden', 'Licht en zachte schaduwen op het oppervlak', 'Details bij de plint en de binnenhoek'], finish: state.scene === 'plaster' && state.texture === 'fine' ? 'Fijne structuur' : 'Glad / mat' };
}
