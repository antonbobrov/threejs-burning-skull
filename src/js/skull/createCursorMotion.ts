import { Group } from 'three';
import { addEventListener, damp, scoped, vevet } from 'vevet';

const EASE = 0.1;
const ROTATION_Y = Math.PI * 0.3;
const ROTATION_X = Math.PI * 0.15;

export function createCursorMotion(group: Group) {
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let prevTime: number | null = null;

  addEventListener(window, 'mousemove', (evt) => {
    const x = scoped(evt.clientX, vevet.width / 2, vevet.width);
    const y = scoped(evt.clientY, vevet.height / 2, vevet.height);

    target.x = x;
    target.y = y;
  });

  function lerp() {
    const now = performance.now();

    if (prevTime) {
      const dt = now - prevTime;

      current.x = damp(current.x, target.x, EASE, dt);
      current.y = damp(current.y, target.y, EASE, dt);
    }

    prevTime = now;
  }

  function render() {
    lerp();

    group.rotation.y = current.x * ROTATION_Y;
    group.rotation.x = current.y * ROTATION_X;
  }

  return { render };
}
