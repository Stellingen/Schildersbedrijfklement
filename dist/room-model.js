import * as THREE from './assets/three.module.js';
import { RoundedBoxGeometry } from './assets/RoundedBoxGeometry.js';

// A real, navigable 3D room. Geometry and materials are authored for this site.
// Texture creation is injected so the model is also verifiable without a GPU.
export function createRoomModel(textures = {}) {
  const group = new THREE.Group();
  group.name = 'Lijn & Laag colour room';
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined)) });
  const white = material('#f4f2eb');
  const trim = material('#f1f0e9', { roughness: .4 });
  const paintFrame = new THREE.MeshPhysicalMaterial({ color: '#363E42', roughness: .28, metalness: 0, clearcoat: .65, clearcoatRoughness: .18, bumpMap: textures.plaster || null, bumpScale: .0006 });
  const paintCeiling = material('#F0EFE5', { roughness: .98 });
  const frameMeshes = [], curtains = [], glazingMeshes = [];
  const frameWear = new THREE.Group(); frameWear.name = 'Illustrative chipped finish'; group.add(frameWear);
  const seal = material('#303b40', { roughness: .85 });
  const hardware = material('#b8bfc3', { roughness: .23, metalness: .85 });
  const wornWall = material('#c5b9a1', { map: textures.wornPlaster, bumpMap: textures.wornPlaster, bumpScale: .06, roughness: 1 });
  const wornCeiling = material('#c7c4ba', { map: textures.wornPlaster, bumpMap: textures.wornPlaster, bumpScale: .075, roughness: 1 });
  const wornFrame = material('#a69a7c', { map: textures.wornWood, bumpMap: textures.wornWood, bumpScale: .025, roughness: .95 });
  const paintBack = material('#F0EFE5', { roughness: .96, bumpMap: textures.plaster, bumpScale: .012 });
  const paintSide = material('#F0EFE5', { roughness: .96, bumpMap: textures.plaster, bumpScale: .012 });
  const wood = material('#a5835c', { map: textures.wood, roughness: .66 });
  const darkWood = material('#6b4b31', { map: textures.wood, roughness: .62 });
  const linen = material('#beb8ab', { map: textures.fabric, bumpMap: textures.fabric, bumpScale: .014, roughness: 1 });
  const cushion = material('#d2cbbd', { map: textures.fabric, bumpMap: textures.fabric, bumpScale: .018, roughness: 1 });
  const darkMetal = material('#343b3c', { roughness: .4, metalness: .65 });
  const brass = material('#99805a', { roughness: .4, metalness: .65 });

  function mesh(geometry, mat, position, rotation, parent = group) {
    const object = new THREE.Mesh(geometry, mat);
    if (position) object.position.set(...position);
    if (rotation) object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(size, mat, position, radius = 0, rotation, parent) {
    const geometry = radius ? new RoundedBoxGeometry(...size, 3, Math.min(radius, Math.min(...size) / 2)) : new THREE.BoxGeometry(...size);
    return mesh(geometry, mat, position, rotation, parent);
  }
  function cylinder(rt, rb, height, mat, position, rotation, parent) {
    return mesh(new THREE.CylinderGeometry(rt, rb, height, 32), mat, position, rotation, parent);
  }
  function stem(from, to, radius, mat, parent = group) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    const object = cylinder(radius, radius, direction.length(), mat, a.clone().add(b).multiplyScalar(.5).toArray(), null, parent);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  }

  // Open-front room with actual floorboards, skirting and a recessed window.
  box([6.1, .16, 5.6], material('#a58e6d'), [0, -.12, 0]);
  const floorColors = ['#c6aa83', '#bea078', '#cdb28c', '#bda17c', '#c9ac85'];
  const floorMats = floorColors.map(color => material(color, { map: textures.wood, roughness: .7 }));
  for (let row = 0; row < 18; row++) {
    for (let plank = 0; plank < 4; plank++) {
      box([1.494, .045, .302], floorMats[(row * 3 + plank * 2) % floorMats.length], [-2.25 + plank * 1.5, -.017, -2.63 + row * .31]);
    }
  }
  const backWall = box([6.12, 2.95, .15], paintBack, [0, 1.46, -2.83]);
  // Four wall sections create a genuine opening rather than a picture on a solid wall.
  const sideWalls = [
    box([.15, .68, 5.65], paintSide, [-3.08, .315, 0]),
    box([.15, .335, 5.65], paintSide, [-3.08, 2.7675, 0]),
    box([.15, 1.945, 2.115], paintSide, [-3.08, 1.6275, -1.7675]),
    box([.15, 1.945, 1.415], paintSide, [-3.08, 1.6275, 2.1175])
  ];
  const sideWall = sideWalls[0];
  box([6, .12, .035], trim, [0, .08, -2.738]);
  box([.035, .12, 5.5], trim, [-2.983, .08, 0]);
  box([6.1, .055, .06], white, [0, 2.89, -2.73]);
  box([.06, .055, 5.5], white, [-2.98, 2.89, 0]);

  // A bright garden window on the side wall. The frame stands proud of the wall.
  const view = new THREE.MeshBasicMaterial({ map: textures.garden || null, color: '#e6eddb' });
  const gardenView = box([.025, 1.91, 2.11], view, [-3.20, 1.65, .35]);
  gardenView.castShadow = false; gardenView.receiveShadow = false;
  const frameX = -2.91;
  const frameBox = (size, position) => { const m = box(size, paintFrame, position, .008); frameMeshes.push(m); return m; };
  for (const z of [-.71, 1.41]) frameBox([.11, 1.94, .095], [frameX, 1.65, z]);
  for (const y of [.70, 2.6]) frameBox([.11, .095, 2.2], [frameX, y, .35]);
  frameBox([.11, 1.84, .06], [frameX + .01, 1.65, .35]);
  frameBox([.12, .06, 2.1], [frameX + .01, 1.6, .35]);
  frameBox([.27, .07, 2.3], [-2.85, .68, .35]);
  // Layered jambs, stepped sash profiles, seals and separate glazing panes.
  for (const z of [-.705, 1.405]) {
    frameBox([.20, 1.94, .075], [-3.025, 1.65, z]);
    frameBox([.035, 1.78, .035], [-2.842, 1.65, z + (z < 0 ? .052 : -.052)]);
  }
  for (const y of [.75, 2.55]) frameBox([.055, .035, 2.02], [-2.839, y, .35]);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dfeef5', transparent: true, opacity: .16, roughness: .055, metalness: .05, clearcoat: 1, depthWrite: false });
  for (const z of [-.17, .87]) for (const y of [1.15, 2.10]) {
    const pane = box([.012, .83, .95], glass, [-2.944, y, z]); pane.castShadow = false; glazingMeshes.push(pane);
    for (const edgeZ of [z - .475, z + .475]) box([.018, .84, .012], seal, [-2.865, y, edgeZ]);
    for (const edgeY of [y - .415, y + .415]) box([.018, .012, .95], seal, [-2.865, edgeY, z]);
  }
  // Metal fittings sit on the painted sash rather than sharing its paint material.
  box([.024, .14, .047], hardware, [-2.828, 1.41, .43], .009);
  cylinder(.018, .018, .045, hardware, [-2.797, 1.41, .43], [0, 0, Math.PI / 2]);
  box([.035, .032, .16], hardware, [-2.776, 1.41, .50], .013);
  for (const y of [.94, 2.36]) {
    cylinder(.017, .017, .11, hardware, [-2.822, y, 1.363]);
    for (const dy of [-.045, .045]) cylinder(.022, .022, .009, hardware, [-2.822, y + dy, 1.363]);
  }
  for (const y of [1.36, 1.46]) {
    cylinder(.007, .007, .004, darkMetal, [-2.811, y, .43], [0, 0, Math.PI / 2]);
    box([.005, .0018, .01], hardware, [-2.808, y, .43]);
  }
  // Thin sealant lines and a rounded sill edge become visible in the junction view.
  for (const z of [-.77, 1.47]) box([.009, 1.99, .012], trim, [-2.843, 1.65, z]);
  frameBox([.034, .022, 2.22], [-2.706, .66, .35]);
  const chipMat = material('#877052', { roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const y = .83 + ((i * 47) % 160) / 100, z = i % 2 ? 1.41 : -.71;
    const shape = new THREE.Shape();
    shape.moveTo(0,0); shape.lineTo(.018, .007); shape.lineTo(.029,.024); shape.lineTo(.013,.036); shape.lineTo(-.004,.019); shape.closePath();
    mesh(new THREE.ShapeGeometry(shape), chipMat, [-2.849, y, z], [0, Math.PI / 2, i * .41], frameWear);
  }
  for (const z of [-.95, 1.66]) {
    const geometry = new THREE.PlaneGeometry(.55, 2.66, 20, 1);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.sin(positions.getX(i) * 48) * .035);
    geometry.computeVertexNormals();
    const curtain = mesh(geometry, material('#e3ded2', { roughness: 1, side: THREE.DoubleSide, map: textures.fabric }), [-2.73, 1.51, z], [0, Math.PI / 2, 0]);
    curtain.castShadow = false; curtains.push(curtain);
  }
  stem([-2.72, 2.86, -1.26], [-2.72, 2.86, 1.97], .014, darkMetal);

  // Fabric sofa: rounded cushions and seams rather than flat drawn shapes.
  const sofa = new THREE.Group(); sofa.position.set(-.30, 0, -1.82); group.add(sofa);
  for (const x of [-1.32, 1.32]) for (const z of [-.35, .4]) cylinder(.027, .022, .16, darkWood, [x, .11, z], null, sofa);
  box([2.98, .25, 1.12], linen, [0, .30, 0], .08, null, sofa);
  box([2.72, .75, .25], linen, [0, .68, -.48], .08, [-.07, 0, 0], sofa);
  for (const x of [-1.42, 1.42]) box([.25, .57, 1.18], linen, [x, .55, 0], .09, null, sofa);
  for (const x of [-.67, .67]) {
    box([1.30, .22, .86], cushion, [x, .50, .09], .08, null, sofa);
    box([1.27, .58, .20], cushion, [x, .86, -.31], .085, [-.12, 0, 0], sofa);
  }
  const ochre = material('#b68a56', { map: textures.fabric, bumpMap: textures.fabric, bumpScale: .015, roughness: 1 });
  const blue = material('#697c88', { map: textures.fabric, bumpMap: textures.fabric, bumpScale: .015, roughness: 1 });
  box([.43, .43, .15], ochre, [-1.0, .83, .02], .075, [-.1, .12, -.16], sofa);
  box([.45, .45, .15], blue, [.98, .83, .02], .075, [-.13, -.15, .2], sofa);
  box([.4, .035, .78], material('#9b9d91', { map: textures.fabric, roughness: 1 }), [.15, .63, .12], .012, [.05, .05, .08], sofa);

  // Rug, oak coffee table, books and a handmade-looking ceramic vase.
  box([3.65, .022, 2.7], material('#e0d8c6', { map: textures.fabric, bumpMap: textures.fabric, bumpScale: .018, roughness: 1 }), [.25, .025, .28], .01);
  cylinder(.68, .68, .075, wood, [.22, .47, .30]);
  cylinder(.48, .54, .40, darkWood, [.22, .24, .30]);
  cylinder(.60, .60, .025, wood, [.22, .514, .30]);
  box([.34, .035, .24], material('#e0ddd2'), [-.04, .55, .37], .007, [0, .18, 0]);
  box([.31, .027, .23], material('#60707b'), [-.03, .582, .37], .006, [0, .1, 0]);
  const vase = material('#c2b19a', { roughness: .73 });
  const profile = [[0, 0], [.08, 0], [.13, .08], [.12, .2], [.06, .26], [.055, .3], [.038, .3], [.04, .25], [.085, .16], [.06, .04]];
  mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 32), vase, [.46, .53, .26]);
  const twigMat = material('#685e40');
  for (let i = 0; i < 4; i++) {
    stem([.46, .75, .26], [.3 + i * .105, 1.15 + i * .04, .18 + i * .07], .005, twigMat);
    const leaf = mesh(new THREE.SphereGeometry(1, 10, 6), material('#7f8765'), [.3 + i * .105, 1.15 + i * .04, .18 + i * .07], [.1, .2, i * .4]);
    leaf.scale.set(.07, .018, .025);
  }

  // An everyday armchair in the foreground, with visible wooden legs.
  const chair = new THREE.Group(); chair.position.set(2.0, 0, .52); chair.rotation.y = -.48; group.add(chair);
  for (const x of [-.38, .38]) for (const z of [-.36, .36]) stem([x, .08, z], [x * .88, .44, z * .85], .025, wood, chair);
  box([.90, .22, .94], cushion, [0, .43, 0], .10, null, chair);
  box([.85, .66, .20], linen, [0, .80, -.39], .10, [-.12, 0, 0], chair);
  for (const x of [-.46, .46]) box([.15, .35, .9], linen, [x, .65, 0], .06, null, chair);
  box([.46, .38, .14], ochre, [.02, .82, -.18], .07, [-.1, -.1, .12], chair);

  // Modest oak sideboard and framed artwork on the painted accent wall.
  box([1.18, .62, .40], wood, [-2.10, .45, -2.28], .025);
  for (const x of [-2.47, -1.73]) for (const z of [-2.41, -2.15]) cylinder(.017, .017, .16, darkMetal, [x, .10, z]);
  for (const x of [-2.39, -1.81]) {
    box([.55, .51, .022], wood, [x, .45, -2.065], .007);
    cylinder(.012, .012, .027, darkMetal, [x + .15, .49, -2.038], [Math.PI / 2, 0, 0]);
  }
  cylinder(.10, .13, .18, vase, [-2.1, .85, -2.25]);
  box([1.5, 1.02, .04], darkWood, [-.15, 1.94, -2.715], .01);
  box([1.42, .94, .018], material('#eee9dc'), [-.15, 1.94, -2.68]);
  // Original abstract composition, built from geometry, with paper-like colours.
  box([.50, .72, .003], material('#b5b39f'), [-.51, 1.95, -2.664]);
  mesh(new THREE.CircleGeometry(.27, 48), material('#c6a37b'), [.05, 2.09, -2.659]);
  box([.40, .36, .004], material('#74857a'), [.27, 1.73, -2.656]);

  // A leafy plant and a slim floor lamp give scale to the room.
  cylinder(.22, .17, .37, material('#ae8c6c', { roughness: .9 }), [2.28, .2, -2.1]);
  cylinder(.20, .20, .018, material('#3b3326'), [2.28, .39, -2.1]);
  const plant = new THREE.Group(); plant.position.set(2.28, .38, -2.1); group.add(plant);
  const greens = ['#4c6543', '#647949', '#5c7043', '#76834f'].map(c => material(c, { roughness: .95 }));
  for (let i = 0; i < 15; i++) {
    const angle = i * 2.399, height = .65 + (i % 5) * .18, spread = .22 + (i % 3) * .09;
    const tip = [Math.cos(angle) * spread, height, Math.sin(angle) * spread];
    stem([0, 0, 0], tip, .008, twigMat, plant);
    for (let leafIndex = 0; leafIndex < 3; leafIndex++) {
      const t = .58 + leafIndex * .17;
      const leaf = mesh(new THREE.SphereGeometry(1, 12, 8), greens[(i + leafIndex) % 4], [tip[0] * t, tip[1] * t, tip[2] * t], [.45, angle + leafIndex, .25], plant);
      leaf.scale.set(.065, .015, .20 - leafIndex * .023);
    }
  }
  cylinder(.18, .18, .035, darkMetal, [1.50, .035, -1.98]);
  cylinder(.012, .012, 1.62, darkMetal, [1.50, .85, -1.98]);
  const lampShade = cylinder(.22, .30, .34, material('#d9cdb2', { roughness: .95, side: THREE.DoubleSide }), [1.50, 1.63, -1.98]);
  lampShade.castShadow = false;

  // The ceiling is shown only in the ceiling study: an architectural cutaway.
  const ceiling = box([6.1, .10, 5.62], paintCeiling, [0, 2.98, -.01]);
  ceiling.visible = false;
  const ceilingDetails = new THREE.Group(); group.add(ceilingDetails);
  for (const x of [-1.7, 1.7]) for (const z of [-1.7, 1.3]) {
    cylinder(.08, .08, .025, trim, [x, 2.915, z], null, ceilingDetails);
    cylinder(.057, .057, .028, new THREE.MeshBasicMaterial({ color: '#fff7e5' }), [x, 2.902, z], null, ceilingDetails);
  }
  ceilingDetails.visible = false;
  return { group, paintBack, paintSide, backWall, sideWall, paintFrame, frameMeshes,
    paintCeiling, ceiling, ceilingDetails, curtains, wornWall, wornCeiling, wornFrame,
    sideWalls, frameWear, glass, glazingMeshes,
    wallNeutral: new THREE.Color('#F0EFE5') };

}
