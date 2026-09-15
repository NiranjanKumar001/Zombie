import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldConfig';
import { WorldCoordinates, ChunkCoord } from './WorldCoordinates';
import { ChunkManager } from './ChunkManager';
import { SurvivalVehicleModel } from '../../assets/models/SurvivalVehicleModel';
import { ArcadeRaycastPhysics, VehicleInputs } from '../physics/ArcadeRaycastPhysics';
import { AtmosphereEffects } from '../../rendering/atmosphere/AtmosphereEffects';

/**
 * WorldManager Class
 * Global coordinator owning:
 * - 4 km x 4 km World State & Continuous Height Function across all chunk boundaries
 * - ChunkManager streaming engine
 * - Natural Mountain Barrier boundaries at map edges
 * - Vehicle Physics & Vehicle Visual state
 */
export class WorldManager {
  public static instance: WorldManager;
  public scene: THREE.Scene;
  public chunkManager: ChunkManager;
  public vehicleModel: SurvivalVehicleModel;
  public physics: ArcadeRaycastPhysics;
  public atmosphere: AtmosphereEffects;

  constructor(scene: THREE.Scene) {
    WorldManager.instance = this;
    this.scene = scene;
    this.physics = new ArcadeRaycastPhysics();

    // 1. Initialize ChunkManager with global elevation provider
    this.chunkManager = new ChunkManager(this.scene, WorldManager.sampleElevation);

    // 2. Instantiate Hero Vehicle
    this.vehicleModel = new SurvivalVehicleModel();
    this.scene.add(this.vehicleModel.root);

    // 3. Atmospheric Particle Effects
    this.atmosphere = new AtmosphereEffects();
    this.scene.add(this.atmosphere.root);
  }

  /**
   * Deterministic & Continuous 3D Height Function for the entire 4km x 4km world
   * Guarantees 0 gaps, seams, or steps across chunk borders.
   */
  public static sampleElevation(worldX: number, worldZ: number): number {
    if (!WorldManager.instance) {
      // Fallback before instantiation
      const raw = Math.sin(worldZ * 0.035 + worldX * 0.02) * 2.8 + Math.cos(worldX * 0.04) * 2.2;
      return raw;
    }

    const biomeMgr = WorldManager.instance.chunkManager.biomeManager;
    const roadNet = WorldManager.instance.chunkManager.roadNetwork;

    const rawTerrainY = biomeMgr.sampleRawTerrainHeight(worldX, worldZ);
    return roadNet.applyRoadTerrainFlattening(worldX, worldZ, rawTerrainY, (x, z) => biomeMgr.sampleRawTerrainHeight(x, z));
  }

  /**
   * Main World Update Loop (called every frame)
   */
  public update(dt: number, inputs: VehicleInputs, camera: THREE.PerspectiveCamera) {
    // 1. Update Vehicle Physics with Global Elevation Sampling
    const terrainAdapter = {
      getHeightAt: (x: number, z: number) => WorldManager.sampleElevation(x, z)
    } as any;

    this.physics.update(dt, inputs, terrainAdapter);

    // 2. Synchronize Vehicle Visual Pose (3D Orientation: Pitch, Yaw, Roll)
    this.vehicleModel.root.position.copy(this.physics.position);
    this.vehicleModel.root.rotation.set(
      this.physics.chassisPitch,
      this.physics.yaw,
      this.physics.chassisRoll,
      'YXZ'
    );

    const compressions: [number, number, number, number] = [
      this.physics.wheels[0].compression,
      this.physics.wheels[1].compression,
      this.physics.wheels[2].compression,
      this.physics.wheels[3].compression
    ];

    this.vehicleModel.updateVisuals(
      this.physics.steerAngle,
      this.physics.wheelSpinAngle,
      compressions,
      this.physics.chassisRoll,
      this.physics.chassisPitch
    );

    // 3. Update Atmosphere Leaves
    this.atmosphere.update(dt, this.physics.position);

    // 4. Update Chunk Manager Streaming Engine
    this.chunkManager.update(this.physics.position, camera);
  }

  /**
   * Current Chunk Coordinate of Player
   */
  public getPlayerChunk(): ChunkCoord {
    return this.chunkManager.playerChunk;
  }

  /**
   * Toggle Chunk Debug Wireframe Overlay
   */
  public toggleChunkDebug(): boolean {
    return this.chunkManager.toggleDebugBorders();
  }
}
