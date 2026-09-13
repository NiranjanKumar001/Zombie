import * as THREE from 'three';
import { ToonMaterial } from '../materials/ToonMaterial';

/**
 * Atmospheric Micro-Particle Effects:
 * - Drifting hand-drawn leaf particles swirling in the wind
 * - Tire ink dust / skid particles during hard acceleration and drifting
 */
export class AtmosphereEffects {
  public root: THREE.Group;
  private leafMesh: THREE.InstancedMesh;
  private leafCount = 80;
  private leafData: { pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Euler; rotVel: THREE.Vector3 }[] = [];
  private dummy = new THREE.Object3D();

  constructor() {
    this.root = new THREE.Group();

    // 1. Stylized Falling Leaves
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.12, 0.25, 0, 0.5);
    leafShape.quadraticCurveTo(-0.12, 0.25, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    leafGeo.scale(0.8, 0.8, 0.8);

    const leafMat = new ToonMaterial({
      color: '#c95b45', // Autumn terracotta / cherry petal tone
      hatchIntensity: 0.2
    });

    this.leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, this.leafCount);
    this.leafMesh.castShadow = true;

    for (let i = 0; i < this.leafCount; i++) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        2.0 + Math.random() * 12,
        (Math.random() - 0.5) * 60
      );
      const v = new THREE.Vector3(
        -0.8 - Math.random() * 1.2,
        -0.4 - Math.random() * 0.6,
        (Math.random() - 0.5) * 0.8
      );
      const r = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const rv = new THREE.Vector3(Math.random() * 2, Math.random() * 2, Math.random() * 2);

      this.leafData.push({ pos: p, vel: v, rot: r, rotVel: rv });

      this.dummy.position.copy(p);
      this.dummy.rotation.copy(r);
      this.dummy.updateMatrix();
      this.leafMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.leafMesh.instanceMatrix.needsUpdate = true;
    this.root.add(this.leafMesh);
  }

  public update(dt: number, carPos: THREE.Vector3) {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    for (let i = 0; i < this.leafCount; i++) {
      const data = this.leafData[i];

      data.pos.addScaledVector(data.vel, dt);
      data.rot.x += data.rotVel.x * dt;
      data.rot.y += data.rotVel.y * dt;

      // Wrap around vehicle position
      if (data.pos.y < 0.2 || data.pos.distanceTo(carPos) > 40) {
        data.pos.set(
          carPos.x + (Math.random() - 0.5) * 45 + 10,
          carPos.y + 6 + Math.random() * 8,
          carPos.z + (Math.random() - 0.5) * 45
        );
      }

      this.dummy.position.copy(data.pos);
      this.dummy.rotation.copy(data.rot);
      this.dummy.updateMatrix();
      this.leafMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.leafMesh.instanceMatrix.needsUpdate = true;
  }
}
