import * as THREE from 'three';
import { ArcadeRaycastPhysics } from '../physics/ArcadeRaycastPhysics';

/**
 * Polished Third-Person Vehicle Camera Controller
 * Follows behind the car with smooth spring damping, velocity-based look-ahead,
 * and stable horizon pitch.
 */
export class FollowCameraController {
  public camera: THREE.PerspectiveCamera;
  private currentPosition: THREE.Vector3 = new THREE.Vector3(0, 3.6, -29);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.5, -17);
  private isInitialized: boolean = false;

  // Camera offset tuning
  private distance: number = 7.6;
  private height: number = 2.8;
  private lookAheadDistance: number = 5.0;
  private fovDefault: number = 55;
  private fovBoost: number = 65;

  constructor(fov = 55, aspect = 16 / 9, near = 0.1, far = 850) {
    this.fovDefault = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public update(
    dt: number,
    physics: ArcadeRaycastPhysics,
    elevationSampler?: (x: number, z: number) => number
  ) {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    // 1. Calculate target camera position behind the car
    const yaw = physics.yaw;
    const behindDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));

    let effectiveDist = this.distance;

    // Obstruction ray check: push camera closer if terrain rises steeply behind car
    if (elevationSampler) {
      const steps = 6;
      for (let s = 1; s <= steps; s++) {
        const testFrac = s / steps;
        const testX = physics.position.x + behindDir.x * (this.distance * testFrac);
        const testZ = physics.position.z + behindDir.z * (this.distance * testFrac);
        const testGroundY = elevationSampler(testX, testZ);
        const rayY = physics.position.y + 1.2 + (this.height - 1.2) * testFrac;

        // If ground blocks ray, truncate distance to avoid being inside mountain
        if (testGroundY > rayY - 0.5 && s > 1) {
          effectiveDist = Math.max(2.8, this.distance * ((s - 0.5) / steps));
          break;
        }
      }
    }

    const targetPos = new THREE.Vector3()
      .copy(physics.position)
      .addScaledVector(behindDir, effectiveDist);
    targetPos.y = physics.position.y + this.height;

    // Ensure target camera height stays above local terrain with at least 1.3m clearance
    if (elevationSampler) {
      const terrainAtTarget = elevationSampler(targetPos.x, targetPos.z);
      if (targetPos.y < terrainAtTarget + 1.3) {
        targetPos.y = terrainAtTarget + 1.3;
      }
    }

    // 2. Look-ahead target point ahead of vehicle
    const forwardDir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const targetLookAt = new THREE.Vector3()
      .copy(physics.position)
      .addScaledVector(forwardDir, this.lookAheadDistance);
    targetLookAt.y = physics.position.y + 1.2;

    if (!this.isInitialized) {
      this.currentPosition.copy(targetPos);
      this.currentLookAt.copy(targetLookAt);
      this.isInitialized = true;
    }

    // 3. Smooth Damped Interpolation
    const posDamp = Math.min(1.0, dt * 8.0);
    const rotDamp = Math.min(1.0, dt * 10.0);

    this.currentPosition.lerp(targetPos, posDamp);
    this.currentLookAt.lerp(targetLookAt, rotDamp);

    // Final safety clamp: never allow camera position to dip underground
    if (elevationSampler) {
      const terrainUnderCam = elevationSampler(this.currentPosition.x, this.currentPosition.z);
      if (this.currentPosition.y < terrainUnderCam + 1.1) {
        this.currentPosition.y = terrainUnderCam + 1.1;
      }
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);

    // 4. Subtle Dynamic FOV expansion during nitro boost
    const targetFov = physics.isBoosting ? this.fovBoost : this.fovDefault;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 4.0);
    this.camera.updateProjectionMatrix();
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
