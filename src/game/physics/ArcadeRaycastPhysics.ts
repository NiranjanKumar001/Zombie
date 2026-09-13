import * as THREE from 'three';
import { TerrainSceneModel } from '../../assets/models/TerrainSceneModel';

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steer: number;    // -1 (left) to +1 (right)
  handbrake: boolean;
  boost: boolean;
  reset: boolean;
}

export interface WheelState {
  groundHeight: number;
  contact: boolean;
  compression: number; // meters (-0.2 to +0.2)
  slip: number;
}

/**
 * Arcade Raycast Vehicle Physics
 * Computes 4-wheel independent ground contact, suspension displacement,
 * chassis pitch and roll, longitudinal drive, lateral tire grip, and drift mechanics.
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
  private readonly springStiffness: number = 38.0;
  private readonly springDamping: number = 6.0;

  // Performance parameters
  private readonly maxSpeedForward: number = 115.0; // km/h
  private readonly maxSpeedBoost: number = 150.0;   // km/h
  private readonly maxSpeedReverse: number = -32.0; // km/h
  private readonly enginePower: number = 36.0;      // m/s^2 acceleration factor
  private readonly brakePower: number = 44.0;
  private readonly steerRate: number = 3.2;

  public update(dt: number, inputs: VehicleInputs, terrain: TerrainSceneModel) {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    if (inputs.reset) {
      this.resetPose();
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

    // 4. Raycast 4 Wheel Contact Points to Terrain
    const wheelOffsets = [
      new THREE.Vector3(-this.halfWidth, 0, this.halfLength),  // FL
      new THREE.Vector3(this.halfWidth, 0, this.halfLength),   // FR
      new THREE.Vector3(-this.halfWidth, 0, -this.halfLength), // RL
      new THREE.Vector3(this.halfWidth, 0, -this.halfLength)  // RR
    ];

    let avgGroundHeight = 0;
    let anyWheelGrounded = false;

    for (let i = 0; i < 4; i++) {
      const offset = wheelOffsets[i].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const worldWheelX = this.position.x + offset.x;
      const worldWheelZ = this.position.z + offset.z;

      const groundY = terrain.getHeightAt(worldWheelX, worldWheelZ);
      const wheelHubY = this.position.y - 0.2; // Hub height above ground
      const suspensionDist = wheelHubY - groundY;

      const comp = THREE.MathUtils.clamp(
        this.restSuspensionHeight - suspensionDist,
        -this.maxSuspensionTravel,
        this.maxSuspensionTravel
      );

      this.wheels[i].groundHeight = groundY;
      this.wheels[i].compression = comp;
      this.wheels[i].contact = suspensionDist < (this.restSuspensionHeight + 0.15);

      if (this.wheels[i].contact) {
        anyWheelGrounded = true;
      }
      avgGroundHeight += groundY;
    }
    avgGroundHeight /= 4;

    // 5. Vertical Position and Suspension Response
    const targetBodyY = avgGroundHeight + this.restSuspensionHeight + 0.25;
    if (this.position.y < targetBodyY) {
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetBodyY, dt * 14.0);
      this.velocity.y = Math.max(0, this.velocity.y);
    } else {
      // Gravity in air
      this.velocity.y -= 24.0 * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y < targetBodyY) {
        this.position.y = targetBodyY;
        this.velocity.y = 0;
      }
    }

    // 6. Longitudinal Acceleration & Braking
    let accel = 0;
    const maxSpeed = this.isBoosting ? (this.maxSpeedBoost / 3.6) : (this.maxSpeedForward / 3.6);
    const maxReverse = this.maxSpeedReverse / 3.6;

    if (inputs.throttle > 0 && anyWheelGrounded) {
      const boostMultiplier = this.isBoosting ? 1.6 : 1.0;
      if (forwardSpeed < maxSpeed) {
        accel += inputs.throttle * this.enginePower * boostMultiplier;
      }
    }

    if (inputs.brake > 0 && anyWheelGrounded) {
      if (forwardSpeed > 0.5) {
        accel -= inputs.brake * this.brakePower;
      } else if (forwardSpeed > maxReverse) {
        // Reverse gear
        accel -= inputs.brake * (this.enginePower * 0.65);
      }
    }

    // Air resistance & rolling friction
    const dragCoeff = 0.35;
    const rollingCoeff = 0.08;
    accel -= (forwardSpeed * dragCoeff + Math.sign(forwardSpeed) * rollingCoeff);

    // Apply acceleration
    this.velocity.addScaledVector(forward, accel * dt);

    // 7. Steering Yaw & Drift Dynamics
    this.isDrifting = inputs.handbrake && Math.abs(forwardSpeed) > 4.0;
    const driftTurnMultiplier = this.isDrifting ? 1.7 : 1.0;
    const yawDelta = this.steerAngle * (forwardSpeed / 8.0) * this.steerRate * driftTurnMultiplier * dt;
    this.yaw += yawDelta;

    // Lateral tire grip (slide dampening)
    const lateralGrip = this.isDrifting ? 4.5 : 18.0;
    this.velocity.addScaledVector(right, -lateralSpeed * lateralGrip * dt);

    // 8. Integrate Position
    this.position.addScaledVector(this.velocity, dt);

    // 9. Wheel Spin Angle (proportional to forward speed)
    const tireCircumference = 2 * Math.PI * 0.46;
    this.wheelSpinAngle -= (forwardSpeed / tireCircumference) * dt * Math.PI * 2;

    // 10. Dynamic Chassis Roll & Pitch Reaction
    // Lateral G roll + Longitudinal G pitch
    const targetRoll = (-lateralSpeed / 18.0) * 0.18 + (this.steerAngle * 0.08);
    const targetPitch = (accel / 35.0) * 0.12;

    this.chassisRoll = THREE.MathUtils.lerp(this.chassisRoll, targetRoll, dt * 8.0);
    this.chassisPitch = THREE.MathUtils.lerp(this.chassisPitch, targetPitch, dt * 8.0);
  }

  public resetPose() {
    this.position.set(0, 1.2, -22);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.chassisRoll = 0;
    this.chassisPitch = 0;
    this.boostReserve = 100.0;
  }
}
