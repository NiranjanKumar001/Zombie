import * as THREE from 'three';
import { TerrainSceneModel } from '../../assets/models/TerrainSceneModel';
import { WORLD_CONFIG } from '../world/WorldConfig';

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steer: number;    // -1 (left) to +1 (right)
  handbrake: boolean;
  boost: boolean;
  reset: boolean;
  chunkDebugToggle?: boolean;
}

export interface WheelState {
  groundHeight: number;
  contact: boolean;
  compression: number; // meters (-0.22 to +0.22)
  slip: number;
}

/**
 * Arcade Raycast Vehicle Physics (Phase 3 Part 1)
 * Computes 4-wheel independent ground contact, physical suspension displacement,
 * natural terrain-conforming pitch and roll, slope gravity resistance, traction loss
 * on steep terrain, horizontal cliff barrier collision, and anti-teleportation safety.
 */
export class ArcadeRaycastPhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.2, -22);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0; // heading angle in radians
  public speedKmh: number = 0;
  public speedMph: number = 0;
  public gear: number = 1;
  public boostReserve: number = 100.0;
  public isBoosting: boolean = false;
  public isDrifting: boolean = false;

  // Real-time Telemetry & Terrain Metrics
  public currentTerrainHeight: number = 0;
  public currentTerrainSlope: number = 0; // Rise / Run (Grade)
  public isGrounded: boolean = true;

  // Visual chassis tilt angles
  public chassisPitch: number = 0;
  public chassisRoll: number = 0;
  public steerAngle: number = 0;
  public wheelSpinAngle: number = 0;

  // 4 Wheel states: FL (0), FR (1), RL (2), RR (3)
  public wheels: WheelState[] = [
    { groundHeight: 0, contact: true, compression: 0, slip: 0 },
    { groundHeight: 0, contact: true, compression: 0, slip: 0 },
    { groundHeight: 0, contact: true, compression: 0, slip: 0 },
    { groundHeight: 0, contact: true, compression: 0, slip: 0 }
  ];

  // Vehicle dimensional constants
  private readonly halfWidth: number = 1.05;
  private readonly halfLength: number = 1.2;
  private readonly restSuspensionHeight: number = 0.55;
  private readonly maxSuspensionTravel: number = 0.22;

  // Performance parameters
  private readonly maxSpeedForward: number = 115.0; // km/h
  private readonly maxSpeedBoost: number = 150.0;   // km/h
  private readonly maxSpeedReverse: number = -32.0; // km/h
  private readonly enginePower: number = 36.0;      // m/s^2 acceleration factor
  private readonly brakePower: number = 44.0;
  private readonly steerRate: number = 3.2;

  public update(dt: number, inputs: VehicleInputs, terrain: TerrainSceneModel) {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    // Reset ONLY on explicit R key press
    if (inputs.reset) {
      this.resetPose(terrain);
      return;
    }

    // 1. Update Boost Reserve
    if (inputs.boost && this.boostReserve > 5.0) {
      this.isBoosting = true;
      this.boostReserve = Math.max(0, this.boostReserve - dt * 25.0);
    } else {
      this.isBoosting = false;
      this.boostReserve = Math.min(100.0, this.boostReserve + dt * 10.0);
    }

    // 2. Heading / Forward Vectors
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // Current forward and lateral speeds
    const forwardSpeed = this.velocity.dot(forward);
    const lateralSpeed = this.velocity.dot(right);
    this.speedKmh = forwardSpeed * 3.6;
    this.speedMph = Math.abs(forwardSpeed * 2.23694);

    // Dynamic Gear Selection
    if (forwardSpeed < -0.5) {
      this.gear = -1; // Reverse
    } else if (this.speedMph < 15) {
      this.gear = 1;
    } else if (this.speedMph < 32) {
      this.gear = 2;
    } else if (this.speedMph < 52) {
      this.gear = 3;
    } else {
      this.gear = 4;
    }

    // 3. Steering and Wheel Angle
    const targetSteerAngle = -inputs.steer * 0.52; // max ~30 degrees
    const steerSpeed = (1.0 - Math.min(0.65, Math.abs(forwardSpeed) / 40.0));
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteerAngle, dt * 10.0 * steerSpeed);

    // 4. Sample Terrain Under Vehicle Center & Surface Normal
    this.currentTerrainHeight = terrain.getHeightAt(this.position.x, this.position.z);
    const eps = 0.6;
    const hL = terrain.getHeightAt(this.position.x - eps, this.position.z);
    const hR = terrain.getHeightAt(this.position.x + eps, this.position.z);
    const hD = terrain.getHeightAt(this.position.x, this.position.z - eps);
    const hU = terrain.getHeightAt(this.position.x, this.position.z + eps);
    const gradX = (hR - hL) / (2 * eps);
    const gradZ = (hU - hD) / (2 * eps);
    this.currentTerrainSlope = Math.sqrt(gradX * gradX + gradZ * gradZ);

    // 5. Raycast 4 Wheel Contact Points to Terrain
    const wheelOffsets = [
      new THREE.Vector3(-this.halfWidth, 0, this.halfLength),  // FL (0)
      new THREE.Vector3(this.halfWidth, 0, this.halfLength),   // FR (1)
      new THREE.Vector3(-this.halfWidth, 0, -this.halfLength), // RL (2)
      new THREE.Vector3(this.halfWidth, 0, -this.halfLength)  // RR (3)
    ];

    let avgGroundHeight = 0;
    let groundedWheelCount = 0;

    for (let i = 0; i < 4; i++) {
      const offset = wheelOffsets[i].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const worldWheelX = this.position.x + offset.x;
      const worldWheelZ = this.position.z + offset.z;

      const groundY = terrain.getHeightAt(worldWheelX, worldWheelZ);
      const wheelHubY = this.position.y - 0.2;
      const suspensionDist = wheelHubY - groundY;

      const comp = THREE.MathUtils.clamp(
        this.restSuspensionHeight - suspensionDist,
        -this.maxSuspensionTravel,
        this.maxSuspensionTravel
      );

      this.wheels[i].groundHeight = groundY;
      this.wheels[i].compression = comp;
      // Wheel contact with tolerance for terrain dips
      this.wheels[i].contact = suspensionDist <= (this.restSuspensionHeight + 0.18);

      if (this.wheels[i].contact) {
        groundedWheelCount++;
      }
      avgGroundHeight += groundY;
    }
    avgGroundHeight /= 4;
    this.isGrounded = groundedWheelCount >= 2;

    // 6. Natural Terrain-Conforming Chassis Pitch & Roll
    const frontAxleY = (this.wheels[0].groundHeight + this.wheels[1].groundHeight) * 0.5;
    const rearAxleY = (this.wheels[2].groundHeight + this.wheels[3].groundHeight) * 0.5;
    const wheelbase = this.halfLength * 2.0;
    // Going uphill: front is higher -> pitch angle tilts nose up (-x rotation in Three.js)
    const terrainPitch = -Math.atan2(frontAxleY - rearAxleY, wheelbase);

    const leftAxleY = (this.wheels[0].groundHeight + this.wheels[2].groundHeight) * 0.5;
    const rightAxleY = (this.wheels[1].groundHeight + this.wheels[3].groundHeight) * 0.5;
    const trackWidth = this.halfWidth * 2.0;
    // Left higher: tilt right (+z rotation in Three.js)
    const terrainRoll = Math.atan2(rightAxleY - leftAxleY, trackWidth);

    // Dynamic G-force reactions
    const dynamicRoll = (-lateralSpeed / 18.0) * 0.10 + (this.steerAngle * 0.05);
    const dynamicPitch = (this.velocity.length() > 0.5 ? 1 : 0) * 0.02;

    // Smoothly blend body orientation to terrain slope
    this.chassisPitch = THREE.MathUtils.lerp(this.chassisPitch, terrainPitch + dynamicPitch, dt * 10.0);
    this.chassisRoll = THREE.MathUtils.lerp(this.chassisRoll, terrainRoll + dynamicRoll, dt * 10.0);

    // 7. Slope Resistance & Physical Traction Loss
    // Calculate slope along vehicle heading
    const slopeAlongHeading = forward.x * gradX + forward.z * gradZ;
    const gravitySlopeFactor = -slopeAlongHeading * 14.0; // Gravity pulling car down slope

    // Traction loss when slope exceeds MAX_DRIVABLE_SLOPE (0.38)
    let traction = 1.0;
    if (this.currentTerrainSlope > WORLD_CONFIG.MAX_DRIVABLE_SLOPE) {
      const excess = this.currentTerrainSlope - WORLD_CONFIG.MAX_DRIVABLE_SLOPE;
      traction = Math.max(0.08, 1.0 - excess * 2.8);
      for (let i = 0; i < 4; i++) {
        this.wheels[i].slip = 1.0 - traction;
      }
    } else {
      for (let i = 0; i < 4; i++) {
        this.wheels[i].slip = this.isDrifting ? 0.6 : 0.05;
      }
    }

    // 8. Longitudinal Acceleration & Braking with Traction Loss
    let accel = 0;
    const maxSpeed = this.isBoosting ? (this.maxSpeedBoost / 3.6) : (this.maxSpeedForward / 3.6);
    const maxReverse = this.maxSpeedReverse / 3.6;

    if (inputs.throttle > 0 && this.isGrounded) {
      const boostMultiplier = this.isBoosting ? 1.6 : 1.0;
      if (forwardSpeed < maxSpeed) {
        accel += inputs.throttle * this.enginePower * boostMultiplier * traction;
      }
    }

    if (inputs.brake > 0 && this.isGrounded) {
      if (forwardSpeed > 0.5) {
        accel -= inputs.brake * this.brakePower;
      } else if (forwardSpeed > maxReverse) {
        accel -= inputs.brake * (this.enginePower * 0.65) * traction;
      }
    }

    // Apply slope gravity pull
    if (this.isGrounded) {
      accel += gravitySlopeFactor;
    }

    // Natural Drag & Rolling Friction
    let dragCoeff = 0.35;
    let rollingCoeff = 0.08;

    accel -= (forwardSpeed * dragCoeff + Math.sign(forwardSpeed) * rollingCoeff);
    this.velocity.addScaledVector(forward, accel * dt);

    // 9. Horizontal Collision Barrier with Steep Cliffs (No Teleportation, No Penetration)
    // Sample front bumper ground height ahead of car
    const bumperDist = this.halfLength + 0.35;
    const frontX = this.position.x + forward.x * bumperDist;
    const frontZ = this.position.z + forward.z * bumperDist;
    const frontTerrainY = terrain.getHeightAt(frontX, frontZ);
    const stepHeight = frontTerrainY - this.position.y;

    // If front terrain is a steep cliff / wall higher than drivable clearance (0.45m)
    if (stepHeight > 0.45 || this.currentTerrainSlope > WORLD_CONFIG.MAX_TERRAIN_SLOPE) {
      const wallNormal = new THREE.Vector3(-gradX, 0, -gradZ).normalize();
      const dot = this.velocity.dot(wallNormal);
      if (dot < 0) {
        // Arrest velocity into cliff wall (tangent slide)
        this.velocity.x -= dot * wallNormal.x * 1.1;
        this.velocity.z -= dot * wallNormal.z * 1.1;
      }
    }

    // 10. Steering Yaw & Drift Dynamics
    this.isDrifting = inputs.handbrake && Math.abs(forwardSpeed) > 4.0;
    const driftTurnMultiplier = this.isDrifting ? 1.7 : 1.0;
    const yawDelta = this.steerAngle * (forwardSpeed / 8.0) * this.steerRate * driftTurnMultiplier * dt;
    this.yaw += yawDelta;

    // Lateral tire grip (slide dampening)
    const lateralGrip = this.isDrifting ? 4.5 : (18.0 * traction);
    this.velocity.addScaledVector(right, -lateralSpeed * lateralGrip * dt);

    // 11. Integrate Horizontal Position
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // 12. Vertical Position and Suspension Response (Smooth & Bounded - Never Teleports)
    const targetBodyY = avgGroundHeight + this.restSuspensionHeight + 0.25;
    if (this.position.y < targetBodyY) {
      // Vehicle is resting / driving on ground
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetBodyY, dt * 16.0);
      this.velocity.y = Math.max(0, this.velocity.y);
    } else {
      // Vehicle is airborne
      this.velocity.y -= 22.0 * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y < targetBodyY) {
        this.position.y = targetBodyY;
        this.velocity.y = 0;
      }
    }

    // Solid Anti-Tunneling: chassis bottom never enters subterranean rock
    const minSafeY = avgGroundHeight + 0.25;
    if (this.position.y < minSafeY) {
      this.position.y = minSafeY;
      this.velocity.y = 0;
    }

    // 13. Wheel Spin Angle (proportional to forward speed + wheel slip)
    const tireCircumference = 2 * Math.PI * 0.46;
    const slipSpin = (inputs.throttle > 0 && traction < 0.5) ? (inputs.throttle * 25.0 * dt) : 0;
    this.wheelSpinAngle -= ((forwardSpeed / tireCircumference) * dt * Math.PI * 2) + slipSpin;
  }

  /** Warps vehicle safely to designated test coordinates */
  public warpTo(x: number, z: number, yaw: number, terrain?: TerrainSceneModel) {
    const groundY = terrain ? terrain.getHeightAt(x, z) : 0;
    this.position.set(x, groundY + this.restSuspensionHeight + 0.25, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.chassisPitch = 0;
    this.chassisRoll = 0;
    this.speedKmh = 0;
    this.speedMph = 0;
  }

  public resetPose(terrain?: TerrainSceneModel) {
    this.warpTo(0, -22, 0, terrain);
    this.boostReserve = 100.0;
  }
}
