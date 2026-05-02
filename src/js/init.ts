import {
  ACESFilmicToneMapping,
  EquirectangularReflectionMapping,
  Group,
  Mesh,
} from 'three';
import { HDRLoader } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { afterImage } from 'three/examples/jsm/tsl/display/AfterImageNode.js';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { add, pass, step, uniform } from 'three/tsl';
import { RenderPipeline } from 'three/webgpu';

import { createGltfAnimation } from './createGltfAnimation';
import { createCursorMotion } from './skull/createCursorMotion';
import { createEmberMaterial } from './skull/createEmberMaterial';
import { createFreakOut } from './skull/createFreakOut';
import { Webgl } from './webgl';

const container = document.getElementById('scene')!;

const webgl = new Webgl(container, {
  near: 0.25,
  far: 20,
  fov: 45,
  perspective: 5,
  render: false,
});

webgl.renderer.toneMapping = ACESFilmicToneMapping;

// Add environment

const hdrLoader = new HDRLoader();
hdrLoader.load('warehouse.hdr', (texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  webgl.scene.environment = texture;
  webgl.scene.environmentIntensity = 0.5;
});

// Uniforms

const uBurnProgress = uniform(0);
const uBurnScale = uniform(0.025);
const uBurnSpeed = uniform(0.21);
const uAnimationDecay = uniform(0);
const uAnimationFrequency = uniform(0.2);
const uGhostDamp = uniform(0.75);

// GUI

const ember = webgl.inspector?.createParameters('Ember');
ember?.add(uBurnScale, 'value', 0.01, 0.04, 0.0001).name('Noise Scale');

// Create freak out

const freakGroup = new Group();
webgl.scene.add(freakGroup);

const freak = createFreakOut({
  group: freakGroup,
  uBurnProgress: uBurnProgress,
  startBurnProgress: uBurnProgress.value,
  targetBurnProgress: 0.15,
  uAnimationFrequency,
  startAnimationFrequency: uAnimationFrequency.value,
  targetAnimationFrequency: 0.05,
  uBurnSpeed,
  startBurnSpeed: uBurnSpeed.value,
  targetBurnSpeed: 1,
});

window.addEventListener('click', () => freak.start());

// Add cursor motion

const motionGroup = new Group();
freakGroup.add(motionGroup);

const cursorMotion = createCursorMotion(motionGroup);

// Create burn material

const burnMaterial = createEmberMaterial(uBurnProgress, uBurnScale, uBurnSpeed);

// Add model

const gltfLoader = new GLTFLoader();
let gltfAnimation: ReturnType<typeof createGltfAnimation> | undefined;

gltfLoader.load(`skull.glb`, (gltf) => {
  gltf.scene.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.material = burnMaterial;
    }
  });

  const scale = 0.065;
  gltf.scene.scale.set(scale, scale, scale);

  motionGroup.add(gltf.scene);

  if (gltf.animations.length > 0) {
    gltfAnimation = createGltfAnimation({
      gltf,
      uAnimationDecay,
      uAnimationFrequency,
    });
  }
});

// Render

const renderPipeline = new RenderPipeline(webgl.renderer);

const scenePass = pass(webgl.scene, webgl.camera);
const sceneColor = scenePass.getTextureNode();
const bloomPass = bloom(sceneColor, 0.42, 0.28, 0.72);

const ghostIntensity = uGhostDamp.mul(step(0.1, uBurnProgress));

renderPipeline.outputNode = afterImage(
  add(sceneColor, bloomPass),
  ghostIntensity,
);

webgl.callbacks.on('render', () => {
  gltfAnimation?.render();
  renderPipeline.render();
  cursorMotion.render();
});
