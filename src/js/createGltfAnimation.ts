import { AnimationAction, AnimationMixer } from 'three';
import { UniformNode } from 'three/webgpu';

import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const AMP = [0.2, 0.3];
const SPEED = 0.015;

interface IProps {
  gltf: GLTF;
  uAnimationDecay: UniformNode<'float', number>;
  uAnimationFrequency: UniformNode<'float', number>;
}

export function createGltfAnimation({
  gltf,
  uAnimationDecay,
  uAnimationFrequency,
}: IProps) {
  const startTime = performance.now();

  const root = gltf.scene;
  const mixer = new AnimationMixer(root);

  const clips = gltf.animations;
  const actions: AnimationAction[] = [];

  clips.forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.play();
    action.setEffectiveTimeScale(0);

    action.play();
    actions.push(action);
  });

  function render() {
    const now = performance.now();
    const elapsed = now - startTime;

    actions.forEach((action) => {
      const speed = SPEED * uAnimationFrequency.value;
      const sine = Math.abs(Math.sin(elapsed * speed));

      const clip = action.getClip();

      const start = clip.duration * AMP[0];
      const end = clip.duration * AMP[1];
      const newTime = sine * (end - start) + start;

      action.time = newTime * (1 - uAnimationDecay.value);
    });

    mixer.update(0);
  }

  return { render };
}
