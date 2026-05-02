import { animate, createTimeline } from 'animejs';
import { Group } from 'three';
import { UniformNode } from 'three/webgpu';

import { rand } from '../utils/rand';

import type { JSAnimation, Timeline } from 'animejs';

interface IProps {
  group: Group;
  uBurnProgress: UniformNode<'float', number>;
  startBurnProgress: number;
  targetBurnProgress: number;
  uAnimationFrequency: UniformNode<'float', number>;
  startAnimationFrequency: number;
  targetAnimationFrequency: number;
  uBurnSpeed: UniformNode<'float', number>;
  startBurnSpeed: number;
  targetBurnSpeed: number;
}

const BASE_DURATION = 100;
const BASE_X_SHAKE = Math.PI * 0.05;
const BASE_Y_SHAKE = Math.PI * 0.35;
const BASE_Z_LIFT = 1;
const ITERATIONS = 5;

export function createFreakOut({
  group,
  uBurnProgress,
  startBurnProgress,
  targetBurnProgress,
  uAnimationFrequency,
  startAnimationFrequency,
  targetAnimationFrequency,
  uBurnSpeed,
  startBurnSpeed,
  targetBurnSpeed,
}: IProps) {
  let isBurning = false;

  let shakeAnim: Timeline | JSAnimation | null = null;

  function getTargetIterations() {
    return isBurning ? ITERATIONS : 2;
  }

  const shake = (iteration = 0) => {
    const targetIterations = getTargetIterations();

    if (iteration === 0) {
      shakeAnim?.cancel();
      shakeAnim = null;
    }

    if (iteration > targetIterations) {
      shakeAnim = animate(group.rotation, {
        duration: BASE_DURATION * 2,
        ease: 'inOutCubic',
        x: 0,
        y: 0,
      });

      return;
    }

    const t = iteration / targetIterations;
    const envelope = Math.pow(1 - t, 2.2);
    const twitch = Math.random() < 0.18 ? 1.8 : 1;
    const duration = rand(BASE_DURATION * 0.55, BASE_DURATION * 1.35);

    const nextX =
      group.rotation.x * 0.35 +
      rand(-BASE_X_SHAKE, BASE_X_SHAKE) * envelope * twitch;

    const nextY =
      group.rotation.y * 0.35 +
      rand(-BASE_Y_SHAKE, BASE_Y_SHAKE) * envelope * twitch;

    shakeAnim = createTimeline({
      defaults: {
        duration,
        ease: Math.random() < 0.5 ? 'inOutSine' : 'inOutCubic',
      },
    });

    shakeAnim.add(group.rotation, {
      x: nextX,
      y: nextY,
      onComplete: () => shake(iteration + 1),
    });

    shakeAnim.add(group.position, {
      x: -nextX,
      duration,
      ease: Math.random() < 0.5 ? 'inOutSine' : 'inOutCubic',
    });
  };

  function start() {
    isBurning = !isBurning;

    const targetIterations = getTargetIterations();

    const duration = BASE_DURATION * 5;
    const ease = 'inOutCubic';
    const delay = isBurning ? 0 : (BASE_DURATION * targetIterations) / 2;

    const tm = createTimeline({ defaults: { delay, ease, duration } });

    setTimeout(() => {
      uBurnSpeed.value = isBurning ? targetBurnSpeed : startBurnSpeed;
    }, delay);

    tm.add(group.position, { z: isBurning ? BASE_Z_LIFT : 0 }, 0);

    tm.add(
      uBurnProgress,
      { value: isBurning ? targetBurnProgress : startBurnProgress },
      0,
    );

    tm.add(
      uAnimationFrequency,
      { value: isBurning ? targetAnimationFrequency : startAnimationFrequency },
      0,
    );

    shake();
  }

  return { start };
}
