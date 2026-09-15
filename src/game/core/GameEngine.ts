import * as THREE from 'three';
import { WorldManager } from '../world/WorldManager';
import { StylizedEnvironment } from '../../rendering/lighting/StylizedEnvironment';
import { FollowCameraController } from '../camera/FollowCameraController';
import { ScreenSpaceOutlinePass } from '../../rendering/outlines/ScreenSpaceOutlinePass';
import { InputManager } from '../input/InputManager';
import { DebugStats } from '../../debug/DebugPanel';

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public worldManager: WorldManager;
  public environment: StylizedEnvironment;
  public cameraController: FollowCameraController;
  public outlinePass: ScreenSpaceOutlinePass;
  public inputManager: InputManager;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;

  private lastChunkDebugState: boolean = false;
  public onStatsUpdate?: (stats: DebugStats) => void;

  constructor(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor('#223d68', 1.0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(this.renderer.domElement);

    // 2. Global Three.js Scene
    this.scene = new THREE.Scene();

    // 3. WorldManager (Phase 2A Streaming Chunk Architecture)
    this.worldManager = new WorldManager(this.scene);

    // 4. Stylized Environment (Sun light, sky dome, clouds)
    this.environment = new StylizedEnvironment(this.scene);

    // 5. Third-Person Follow Camera
    this.cameraController = new FollowCameraController(55, width / height, 0.1, 750);

    // 6. NPR Screen-Space Sobel Ink Outline Pass
    this.outlinePass = new ScreenSpaceOutlinePass(width, height);

    // 7. Input Manager
    this.inputManager = new InputManager();

    // Window Resize Listener
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

    // FPS Measurement
    this.frameCount++;
    if (time - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = time;
    }

    // 1. Get Input State
    const inputs = this.inputManager.getInputs();

    // Toggle Chunk Debug Borders on KeyH press edge trigger
    if (inputs.chunkDebugToggle && !this.lastChunkDebugState) {
      this.worldManager.toggleChunkDebug();
    }
    this.lastChunkDebugState = !!inputs.chunkDebugToggle;

    // 2. Update World Manager (Physics, Chunk Streaming, Vehicle, Particles)
    this.worldManager.update(dt, inputs, this.cameraController.camera);

    // 3. Update Sky & Clouds
    this.environment.update(dt);

    // 4. Update Camera Follow with Terrain Elevation Clearance (Anti-clipping)
    this.cameraController.update(dt, this.worldManager.physics, (x, z) => WorldManager.sampleElevation(x, z));

    // 5. Render Scene with NPR Sobel Ink Outline Pass
    this.outlinePass.render(
      this.renderer,
      this.scene,
      this.cameraController.camera
    );

    // 6. Telemetry Callback (Phase 3 Part 1 Metrics)
    if (this.onStatsUpdate) {
      const p = this.worldManager.physics;
      const playerChunk = this.worldManager.getPlayerChunk();
      const currentChunkObj = this.worldManager.chunkManager.getChunk(playerChunk.chunkX, playerChunk.chunkZ);

      this.onStatsUpdate({
        fps: this.currentFps,
        triangles: this.renderer.info.render.triangles,
        drawCalls: this.renderer.info.render.calls,
        carSpeedKmh: p.speedKmh,
        carSpeedMph: p.speedMph,
        position: { x: p.position.x, y: p.position.y, z: p.position.z },
        carYaw: p.yaw,
        chunkCoord: { chunkX: playerChunk.chunkX, chunkZ: playerChunk.chunkZ },
        activeChunks: this.worldManager.chunkManager.getActiveChunkCount(),
        loadedChunks: this.worldManager.chunkManager.getLoadedChunkCount(),
        currentLod: currentChunkObj ? currentChunkObj.lodLevel : 0,
        terrainHeight: p.currentTerrainHeight,
        terrainSlope: p.currentTerrainSlope,
        wheelContacts: [p.wheels[0].contact, p.wheels[1].contact, p.wheels[2].contact, p.wheels[3].contact],
        compressions: [p.wheels[0].compression, p.wheels[1].compression, p.wheels[2].compression, p.wheels[3].compression],
        isGrounded: p.isGrounded,
        isDrifting: p.isDrifting
      });
    }
  };

  public toggleOutline() {
    this.outlinePass.enabled = !this.outlinePass.enabled;
  }

  public toggleChunkDebug(): boolean {
    return this.worldManager.toggleChunkDebug();
  }

  public warpToTestLocation(id: 'A' | 'B' | 'C' | 'D' | 'E') {
    const terrainAdapter = {
      getHeightAt: (x: number, z: number) => WorldManager.sampleElevation(x, z)
    } as any;
    
    // Dynamic coordinate lookup for test locations
    const coords: Record<string, { x: number; z: number; yaw: number }> = {
      A: { x: 0, z: -22, yaw: 0 },
      B: { x: 120, z: -80, yaw: 0.8 },
      C: { x: -120, z: 160, yaw: -1.2 },
      D: { x: 280, z: 320, yaw: 2.1 },
      E: { x: 480, z: 460, yaw: 0.5 }
    };

    const target = coords[id];
    if (target) {
      this.worldManager.physics.warpTo(target.x, target.z, target.yaw, terrainAdapter);
    }
  }

  public resetCar() {
    const terrainAdapter = {
      getHeightAt: (x: number, z: number) => WorldManager.sampleElevation(x, z)
    } as any;
    this.worldManager.physics.resetPose(terrainAdapter);
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
