import * as THREE from 'three';
import { VisualTestScene } from '../world/VisualTestScene';
import { StylizedEnvironment } from '../../rendering/lighting/StylizedEnvironment';
import { FollowCameraController } from '../camera/FollowCameraController';
import { ScreenSpaceOutlinePass } from '../../rendering/outlines/ScreenSpaceOutlinePass';
import { InputManager } from '../input/InputManager';
import { DebugStats } from '../../debug/DebugPanel';

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public testScene: VisualTestScene;
  public environment: StylizedEnvironment;
  public cameraController: FollowCameraController;
  public outlinePass: ScreenSpaceOutlinePass;
  public inputManager: InputManager;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;

  public onStatsUpdate?: (stats: DebugStats) => void;

  constructor(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor('#223d68', 1.0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Sharp graphic comic shadows
    this.renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Test Assets
    this.testScene = new VisualTestScene();

    // 3. Stylized Environment
    this.environment = new StylizedEnvironment(this.testScene.scene);

    // 4. Camera
    this.cameraController = new FollowCameraController(55, width / height, 0.1, 500);

    // 5. NPR Screen-Space Outline Pass
    this.outlinePass = new ScreenSpaceOutlinePass(width, height);

    // 6. Input
    this.inputManager = new InputManager();

    // Resize listener
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.cameraController.setAspect(w / h);
    this.outlinePass.setSize(w, h);
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.loop);

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // FPS measurement
    this.frameCount++;
    if (time - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = time;
    }

    // 1. Update Vehicle Physics
    const inputs = this.inputManager.getInputs();
    this.testScene.physics.update(dt, inputs, this.testScene.terrain);

    if (this.frameCount === 10) {
      console.log("=== DIAGNOSTIC ===", {
        camPos: this.cameraController.camera.position.toArray(),
        carPhysPos: this.testScene.physics.position.toArray(),
        carModelPos: this.testScene.vehicleModel.root.position.toArray(),
        canvasW: this.renderer.domElement.width,
        canvasH: this.renderer.domElement.height,
        outlineEnabled: this.outlinePass.enabled
      });
    }

    // 2. Update Vehicle Visual & Atmosphere
    this.testScene.update(dt);

    // 3. Update Sky & Clouds
    this.environment.update(dt);

    // 4. Update Camera Follow
    this.cameraController.update(dt, this.testScene.physics);

    // 5. Render Scene with NPR Outline Pass
    this.outlinePass.render(
      this.renderer,
      this.testScene.scene,
      this.cameraController.camera
    );

    // 6. Telemetry Callback
    if (this.onStatsUpdate) {
      const p = this.testScene.physics;
      this.onStatsUpdate({
        fps: this.currentFps,
        triangles: this.renderer.info.render.triangles,
        drawCalls: this.renderer.info.render.calls,
        carSpeedKmh: p.speedKmh,
        carSpeedMph: p.speedMph,
        position: { x: p.position.x, y: p.position.y, z: p.position.z },
        wheelContacts: p.wheels.map((w) => w.contact),
        compressions: p.wheels.map((w) => w.compression),
        isGrounded: p.wheels.some((w) => w.contact),
        isDrifting: p.isDrifting
      });
    }
  };

  public toggleOutline() {
    this.outlinePass.enabled = !this.outlinePass.enabled;
  }

  public resetCar() {
    this.testScene.physics.resetPose();
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.outlinePass.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
