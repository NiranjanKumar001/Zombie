import { VehicleInputs } from '../physics/ArcadeRaycastPhysics';

/**
 * Robust Input Manager for vehicle controls
 * Maps WASD / Arrow keys, Space (handbrake), Shift (boost), and R (reset).
 */
export class InputManager {
  private keys: Record<string, boolean> = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public getInputs(): VehicleInputs {
    const isW = this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'];
    const isS = this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'];
    const isA = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'];
    const isD = this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'];
    const isSpace = this.keys['Space'];
    const isShift = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const isReset = this.keys['KeyR'] || this.keys['r'];
    const isChunkDebug = this.keys['KeyH'] || this.keys['h'];

    let throttle = 0;
    let brake = 0;
    let steer = 0;

    if (isW) throttle = 1.0;
    if (isS) brake = 1.0;
    if (isA) steer -= 1.0;
    if (isD) steer += 1.0;

    return {
      throttle,
      brake,
      steer,
      handbrake: !!isSpace,
      boost: !!isShift,
      reset: !!isReset,
      chunkDebugToggle: !!isChunkDebug
    };
  }
}
