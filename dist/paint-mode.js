import * as THREE from './assets/three.module.js';
import { studioTarget } from './studio-state.js?v=studio-20261025';

export function createPaintMode(model) {
  const exactBack = new THREE.MeshBasicMaterial({ toneMapped: false });
  const exactSide = new THREE.MeshBasicMaterial({ toneMapped: false });
  const exactFrame = new THREE.MeshBasicMaterial({ toneMapped: false });
  const exactCeiling = new THREE.MeshBasicMaterial({ toneMapped: false });
  return function applyPaintMode(state, before = false) {
    const target = studioTarget(state), exact = state.light === 'neutral';
    const colors = { ...state.colors, [target]: state.paint.hex };
    const sideColor = state.wall === 'all' ? colors.walls : '#F0EFE5';
    model.paintBack.color.set(colors.walls); exactBack.color.set(colors.walls);
    model.paintSide.color.set(sideColor); exactSide.color.set(sideColor);
    model.paintFrame.color.set(colors.frames); exactFrame.color.set(colors.frames);
    model.paintCeiling.color.set(colors.ceiling); exactCeiling.color.set(colors.ceiling);
    model.paintFrame.roughness = state.finish === 'gloss' ? .1 : .35;
    model.paintFrame.metalness = 0;
    const oldWalls = before && target === 'walls';
    model.backWall.material = oldWalls ? model.wornWall : exact ? exactBack : model.paintBack;
    model.sideWall.material = oldWalls && state.wall === 'all' ? model.wornWall : exact ? exactSide : model.paintSide;
    // Rough plaster is distinct from the smooth painted surface in the walls scene.
    model.wornWall.bumpScale = state.scene === 'plaster' ? .085 : .024;
    model.wornWall.color.set(state.scene === 'plaster' ? '#d4c8b2' : '#c5bea9');
    for (const mesh of model.frameMeshes) mesh.material = before && target === 'frames' ? model.wornFrame : exact ? exactFrame : model.paintFrame;
    model.ceiling.visible = target === 'ceiling';
    model.ceilingDetails.visible = target === 'ceiling';
    model.ceiling.material = before && target === 'ceiling' ? model.wornCeiling : exact ? exactCeiling : model.paintCeiling;
    model.curtains.forEach(curtain => { curtain.visible = target !== 'frames'; });
  };
}
