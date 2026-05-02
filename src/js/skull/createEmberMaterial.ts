import {
  time,
  vec3,
  triNoise3D,
  float,
  smoothstep,
  positionLocal,
} from 'three/tsl';
import { Color, MeshStandardNodeMaterial, UniformNode } from 'three/webgpu';

type TUniform = UniformNode<'float', number>;

export function createEmberMaterial(
  uProgress: TUniform,
  uBurnScale: TUniform,
  uBurnSpeed: TUniform,
) {
  const material = new MeshStandardNodeMaterial({
    color: new Color(0x32323a),
    metalness: 0.9,
    roughness: 0.38,
  });

  const uv = positionLocal.mul(uBurnScale);
  const noise = triNoise3D(uv, 2, time.mul(uBurnSpeed));

  material.maskNode = noise.greaterThan(uProgress);

  const dn = noise.sub(uProgress).max(0);
  const ember = float(1).sub(smoothstep(0, 0.1, dn));
  material.emissiveNode = vec3(float(1), float(0.26), float(0.04)).mul(
    ember.mul(float(6)),
  );

  return material;
}
