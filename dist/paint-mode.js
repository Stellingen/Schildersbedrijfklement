import * as THREE from './assets/three.module.js';

export function createPaintMode(model, initialHex) {
  const neutralBack = new THREE.MeshBasicMaterial({ color: initialHex, toneMapped: false });
  const neutralSide = new THREE.MeshBasicMaterial({ color: initialHex, toneMapped: false });
  return function applyPaintMode(state) {
    const sideColor = state.wall === 'all' ? state.paint.hex : '#F0EFE5';
    model.paintBack.color.set(state.paint.hex);
    model.paintSide.color.set(sideColor);
    neutralBack.color.set(state.paint.hex);
    neutralSide.color.set(sideColor);
    model.backWall.material = state.light === 'neutral' ? neutralBack : model.paintBack;
    model.sideWall.material = state.light === 'neutral' ? neutralSide : model.paintSide;
  };
}
