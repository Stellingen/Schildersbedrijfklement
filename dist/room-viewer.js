import * as THREE from './assets/three.module.js';
import { OrbitControls } from './assets/OrbitControls.js';
import { createRoomModel } from './room-model.js?v=details-20261025';
import { createPaintMode } from './paint-mode.js?v=details-20261025';

import { studioTarget, studioView, comparisonSplit } from './studio-state.js?v=paginas-20261025';

function makeTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const textureScale = 2;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(textureScale, textureScale);
  let seed = 412;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  if (kind === 'worn-plaster' || kind === 'worn-wood') {
    context.fillStyle = kind === 'worn-wood' ? '#d6ceb5' : '#e4dfd3';
    context.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 440; i++) {
      const x = random() * 256, y = random() * 256, r = random() * 17 + 1;
      context.fillStyle = `rgba(100,80,55,${random() * .15})`;
      context.beginPath(); context.ellipse(x, y, r, r * .65, random(), 0, Math.PI * 2); context.fill();
    }
    for (let i = 0; i < (kind === 'worn-wood' ? 95 : 9); i++) {
      const x = random() * 256, y = random() * 256;
      context.strokeStyle = kind === 'worn-wood' ? '#7b6a5055' : '#877d6d85';
      context.lineWidth = kind === 'worn-wood' ? .5 + random() : .5;
      context.beginPath(); context.moveTo(x,y);
      for (let j = 0; j < 6; j++) context.lineTo(x + j * (kind === 'worn-wood' ? 7 : 3) + random() * 8, y + j * 6 + random() * 5);
      context.stroke();
    }
    for (let i = 0; i < 35; i++) {
      const x = random() * 256, y = random() * 256;
      context.fillStyle = kind === 'worn-wood' ? '#8d7652' : '#f5f1e6';
      context.beginPath(); context.moveTo(x,y); context.lineTo(x + 5 + random()*12,y+2); context.lineTo(x+random()*7,y+6+random()*9); context.fill();
    }
  } else if (kind === 'garden') {
    const sky = context.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#cadce4'); sky.addColorStop(.7, '#e9ede2'); sky.addColorStop(1, '#a6b48b');
    context.fillStyle = sky; context.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 150; i++) {
      context.fillStyle = ['#9cae84', '#aab58b', '#90a374', '#b5be9d'][i % 4];
      context.beginPath(); context.arc(random() * 256, 125 + random() * 150, 6 + random() * 27, 0, Math.PI * 2); context.fill();
    }
  } else {
    context.fillStyle = kind === 'wood' ? '#c3ad8b' : '#dddddd';
    context.fillRect(0, 0, 256, 256);
    const pixels = context.getImageData(0, 0, 512, 512);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const noise = (random() - .5) * (kind === 'wood' ? 10 : 26);
      for (let c = 0; c < 3; c++) pixels.data[i + c] += noise;
    }
    context.putImageData(pixels, 0, 0);
    if (kind === 'wood') {
      for (let i = 0; i < 110; i++) {
        const y = random() * 256;
        context.strokeStyle = `rgba(90,60,30,${.02 + random() * .06})`;
        context.lineWidth = .3 + random() * .9;
        context.beginPath(); context.moveTo(0, y);
        context.bezierCurveTo(64, y + random() * 8, 180, y - random() * 8, 256, y + random() * 5); context.stroke();
      }
    } else if (kind === 'fabric') {
      context.strokeStyle = '#ffffff22'; context.lineWidth = .5;
      for (let i = 0; i < 256; i += 3) {
        context.beginPath(); context.moveTo(i, 0); context.lineTo(i, 256); context.stroke();
        context.beginPath(); context.moveTo(0, i); context.lineTo(256, i); context.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = kind === 'plaster' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (kind === 'fabric') texture.repeat.set(3, 3);
  texture.anisotropy = 4;
  return texture;
}

export function createColorRoom(host, initialState) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.4 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Draaibare 3D-afwerkstudio met een vergelijking vóór en na. Gebruik de schuif onder het beeld voor de vergelijking, en de knoppen of pijltoetsen om rond te kijken.');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e5e9ed');
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 50);
  let origin = new THREE.Vector3(5.1, 3.35, 6.9);
  let originTarget = new THREE.Vector3(0, 1, -.24);
  let currentState = initialState, activeView = ''; 
  camera.position.copy(origin);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, -.24);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false; // Page scrolling remains available; use the labelled zoom buttons.
  controls.minAzimuthAngle = -.04;
  controls.maxAzimuthAngle = 1.38;
  controls.minPolarAngle = .83;
  controls.maxPolarAngle = 1.85;
  controls.minDistance = 5.4;
  controls.maxDistance = 11.8;
  controls.rotateSpeed = .45;

  const textures = {
    wood: makeTexture('wood'), fabric: makeTexture('fabric'),
    plaster: makeTexture('plaster'), garden: makeTexture('garden'),
    wornPlaster: makeTexture('worn-plaster'), wornWood: makeTexture('worn-wood')
  };
  const model = createRoomModel(textures);
  scene.add(model.group);
  // A small, original studio environment supplies reflections for lacquer, metal and glass.
  // No HDR download, external renderer or network dependency is needed.
  const environmentScene = new THREE.Scene();
  environmentScene.background = new THREE.Color('#b7c2cb');
  const envelope = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 14), new THREE.MeshBasicMaterial({ color: '#aeb9c4', side: THREE.BackSide }));
  environmentScene.add(envelope);
  for (const [size, position, rotation, color] of [
    [[3.5, 5, .01], [-5,2,0], [0,Math.PI/2,0], '#ffffff'],
    [[3, 4, .01], [4,1.5,-4], [0,-Math.PI/4,0], '#dceeff'],
    [[4, 2, .01], [0,3.8,0], [Math.PI/2,0,0], '#ffffff']
  ]) {
    const card = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    card.position.set(...position); card.rotation.set(...rotation); environmentScene.add(card);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environmentScene, .04);
  scene.environment = environmentTarget.texture; scene.environmentIntensity = .45;
  pmrem.dispose();
  environmentScene.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });

  // A reference mode bypasses scene illumination and tone mapping on paint.
  // Input sRGB -> linear storage -> sRGB output preserves the supplied code.
  const applyPaintMode = createPaintMode(model);
  const hemisphere = new THREE.HemisphereLight('#ffffff', '#c7c7c7', 2.0);
  scene.add(hemisphere);
  const ambient = new THREE.AmbientLight('#ffffff', .6); scene.add(ambient);
  const sunlight = new THREE.DirectionalLight('#ffffff', 2.4);
  sunlight.position.set(-3.0, 5.0, 2.5);
  sunlight.target.position.set(.8, .1, -1);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(window.innerWidth < 700 ? 1024 : 2048, window.innerWidth < 700 ? 1024 : 2048);
  sunlight.shadow.camera.left = -5; sunlight.shadow.camera.right = 5;
  sunlight.shadow.camera.top = 5; sunlight.shadow.camera.bottom = -5;
  sunlight.shadow.camera.near = .5; sunlight.shadow.camera.far = 18;
  sunlight.shadow.bias = -.0005;
  sunlight.shadow.normalBias = .025;
  sunlight.shadow.radius = 4;
  scene.add(sunlight, sunlight.target);
  const fill = new THREE.DirectionalLight('#ffffff', .8);
  fill.position.set(3, 3, 5); scene.add(fill);
  const lamp = new THREE.PointLight('#ffd5a0', 0, 5, 2);
  lamp.position.set(1.50, 1.58, -1.98); scene.add(lamp);

  function render() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const split = comparisonSplit(currentState.compare, width);
    renderer.setScissorTest(false); renderer.clear();
    renderer.setScissorTest(true);
    if (split.beforeWidth > 0) {
      applyPaintMode(currentState, true);
      renderer.setScissor(0, 0, split.beforeWidth, height); renderer.render(scene, camera);
    }
    if (split.afterWidth > 0) {
      applyPaintMode(currentState, false);
      renderer.setScissor(split.beforeWidth, 0, split.afterWidth, height); renderer.render(scene, camera);
    }
    renderer.setScissorTest(false);
  }
  function setView(state, force = false) {
    const key = state.scene + ':' + studioTarget(state) + ':' + state.view;
    if (!force && key === activeView) return;
    activeView = key;
    const ceiling = studioTarget(state) === 'ceiling';
    const config = studioView(state);
    origin = new THREE.Vector3(...config.camera);
    originTarget = new THREE.Vector3(...config.target);
    controls.minDistance = config.min; controls.maxDistance = config.max;
    const angle = Math.atan2(origin.x - originTarget.x, origin.z - originTarget.z);
    controls.minAzimuthAngle = Math.max(-.65, angle - .55);
    controls.maxAzimuthAngle = Math.min(1.52, angle + .55);
    controls.minPolarAngle = ceiling ? 1.54 : .5;
    controls.maxPolarAngle = ceiling ? 2.35 : 1.68;
    camera.position.copy(origin); controls.target.copy(originTarget); controls.update();
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = width / height < 1.1 ? 48 : 39;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }
  controls.addEventListener('change', render);
  const observer = new ResizeObserver(resize); observer.observe(host);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    document.querySelector('#room-fallback').hidden = false;
    document.querySelector('#room-fallback h3').textContent = 'De 3D-weergave is onderbroken.';
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    document.querySelector('#room-fallback').hidden = true;
    resize();
  });
  function update(state) {
    currentState = state; setView(state);
    const warm = state.light === 'warm';
    hemisphere.color.set(warm ? '#fff0dc' : '#ffffff');
    hemisphere.intensity = warm ? 1.5 : 2.0;
    sunlight.color.set(warm ? '#ffe2bb' : '#ffffff');
    sunlight.intensity = warm ? 1.7 : 2.4;
    fill.intensity = warm ? .65 : .8;
    lamp.intensity = warm ? 7 : 0;
    ambient.intensity = warm ? .75 : .6;
    render();
  }
  function orbit(angle) {
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta = Math.max(controls.minAzimuthAngle, Math.min(controls.maxAzimuthAngle, spherical.theta + angle));
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update(); render();
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    const distance = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor));
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update(); render();
  }
  function reset() {
    camera.position.copy(origin); controls.target.copy(originTarget);
    controls.update(); render();
  }
  renderer.domElement.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); orbit(event.key === 'ArrowLeft' ? -.1 : .1);
    } else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.88); }
    else if (event.key === '-') { event.preventDefault(); zoom(1.13); }
    else if (event.key === 'Home') { event.preventDefault(); reset(); }
  });
  // A short click selects the visible surface; dragging continues to orbit the camera.
  model.backWall.userData.studioPart = 'walls';
  model.sideWalls.forEach(mesh => { mesh.userData.studioPart = 'walls'; });
  [...model.frameMeshes, ...model.glazingMeshes].forEach(mesh => { mesh.userData.studioPart = 'frames'; });
  model.ceiling.userData.studioPart = 'ceiling';
  model.frameWear.userData.studioPart = 'frames';
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let pointerStart = null;
  renderer.domElement.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() }; });
  renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null; });
  renderer.domElement.addEventListener('pointerup', event => {
    const start = pointerStart; pointerStart = null;
    if (!start || start.id !== event.pointerId || performance.now() - start.time > 600 || Math.hypot(event.clientX-start.x,event.clientY-start.y) > 6) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-bounds.left)/bounds.width*2-1, -(event.clientY-bounds.top)/bounds.height*2+1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(model.group, true).find(hit => {
      let object = hit.object;
      while (object) { if (!object.visible) return false; object = object.parent; }
      return true;
    });
    let object = hit?.object, target = null;
    while (object && !target) { target = object.userData.studioPart; object = object.parent; }
    if (target) document.dispatchEvent(new CustomEvent('lijnenlaag-surface-pick', { detail: { target } }));
  });
  setView(initialState, true); controls.update(); resize(); update(initialState);
  return { update, orbit, zoom, reset };
}
