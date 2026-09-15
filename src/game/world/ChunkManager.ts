import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldConfig';
import { WorldCoordinates, ChunkCoord } from './WorldCoordinates';
import { WorldChunk, ChunkLOD, ElevationProvider } from './WorldChunk';
import { RoadNetwork } from './RoadNetwork';
import { WaterSystem } from './WaterSystem';
import { BiomeManager } from './BiomeManager';

/**
 * ChunkManager Class
 * Manages streaming lifecycle of world chunks around player position:
 * - Load, Activate, Deactivate, Unload, Preload
 * - LOD distance calculations
 * - Duplicate loading prevention
 * - Three.js object memory leak prevention
 */
export class ChunkManager {
  private parentScene: THREE.Scene;
  private elevationProvider: ElevationProvider;
  public roadNetwork: RoadNetwork;
  public waterSystem: WaterSystem;
  public biomeManager: BiomeManager;

  // Map of loaded chunks by key ("cx,cz")
  private chunks: Map<string, WorldChunk> = new Map();
  private activeChunkKeys: Set<string> = new Set();

  public playerChunk: ChunkCoord = { chunkX: 0, chunkZ: 0 };
  public debugBordersEnabled: boolean = false;

  constructor(scene: THREE.Scene, elevationProvider: ElevationProvider) {
    this.parentScene = scene;
    this.elevationProvider = elevationProvider;
    this.roadNetwork = new RoadNetwork();
    this.waterSystem = new WaterSystem();
    this.biomeManager = new BiomeManager();
  }

  /**
   * Main streaming loop updated every frame
   */
  public update(playerPos: THREE.Vector3, camera: THREE.PerspectiveCamera) {
    const currentCoord = WorldCoordinates.worldToChunk(playerPos.x, playerPos.z);
    this.playerChunk = currentCoord;

    const activeRadius = WORLD_CONFIG.ACTIVE_RADIUS;
    const preloadRadius = WORLD_CONFIG.PRELOAD_RADIUS;

    const newActiveKeys = new Set<string>();

    // 1. Stream Active & Preload Chunks around player
    for (let dx = -preloadRadius; dx <= preloadRadius; dx++) {
      for (let dz = -preloadRadius; dz <= preloadRadius; dz++) {
        const cx = currentCoord.chunkX + dx;
        const cz = currentCoord.chunkZ + dz;

        // Respect world bounds (-8 to +7)
        if (
          cx < WORLD_CONFIG.MIN_CHUNK_COORD ||
          cx > WORLD_CONFIG.MAX_CHUNK_COORD ||
          cz < WORLD_CONFIG.MIN_CHUNK_COORD ||
          cz > WORLD_CONFIG.MAX_CHUNK_COORD
        ) {
          continue;
        }

        const key = WorldCoordinates.chunkKey(cx, cz);
        const dist = Math.max(Math.abs(dx), Math.abs(dz));

        // Load chunk if not existing
        let chunk = this.getChunk(cx, cz);
        if (!chunk) {
          chunk = this.loadChunk(cx, cz);
        }

        // Active within ACTIVE_RADIUS (3 chunks = 7x7 grid)
        if (dist <= activeRadius) {
          newActiveKeys.add(key);

          if (!chunk.active) {
            this.activateChunk(cx, cz);
          }

          // Calculate LOD based on Euclidean distance to chunk center
          const chunkCenter = new THREE.Vector3(chunk.bounds.centerX, 0, chunk.bounds.centerZ);
          const distanceMeters = camera.position.distanceTo(chunkCenter);

          let lod: ChunkLOD = 0;
          if (distanceMeters > WORLD_CONFIG.LOD_DISTANCES.LOD1) {
            lod = 2;
          } else if (distanceMeters > WORLD_CONFIG.LOD_DISTANCES.LOD0) {
            lod = 1;
          }
          chunk.setLOD(lod);

        } else if (dist <= preloadRadius) {
          // Preloaded but inactive
          if (chunk.active) {
            this.deactivateChunk(cx, cz);
          }
        }
      }
    }

    // 2. Unload Chunks outside PRELOAD_RADIUS
    const keysToUnload: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dist = WorldCoordinates.chunkDistance(currentCoord, {
        chunkX: chunk.chunkX,
        chunkZ: chunk.chunkZ
      });

      if (dist > preloadRadius) {
        keysToUnload.push(key);
      }
    });

    for (const key of keysToUnload) {
      const coord = WorldCoordinates.keyToChunk(key);
      this.unloadChunk(coord.chunkX, coord.chunkZ);
    }

    this.activeChunkKeys = newActiveKeys;
  }

  /**
   * Load chunk (instantiates WorldChunk if not present)
   */
  public loadChunk(cx: number, cz: number): WorldChunk {
    const key = WorldCoordinates.chunkKey(cx, cz);
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }

    const chunk = new WorldChunk(
      cx,
      cz,
      this.elevationProvider,
      this.roadNetwork,
      this.waterSystem,
      this.biomeManager
    );
    chunk.setDebugVisible(this.debugBordersEnabled);
    this.chunks.set(key, chunk);
    return chunk;
  }

  /**
   * Activate chunk (adds root group to scene)
   */
  public activateChunk(cx: number, cz: number) {
    const chunk = this.getChunk(cx, cz);
    if (chunk && !chunk.active) {
      chunk.active = true;
      this.parentScene.add(chunk.group);
    }
  }

  /**
   * Deactivate chunk (removes root group from scene)
   */
  public deactivateChunk(cx: number, cz: number) {
    const chunk = this.getChunk(cx, cz);
    if (chunk && chunk.active) {
      chunk.active = false;
      this.parentScene.remove(chunk.group);
    }
  }

  /**
   * Unload chunk (disposes Three.js resources and removes references)
   */
  public unloadChunk(cx: number, cz: number) {
    const key = WorldCoordinates.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.deactivateChunk(cx, cz);
      chunk.dispose();
      this.chunks.delete(key);
    }
  }

  public hasChunk(cx: number, cz: number): boolean {
    return this.chunks.has(WorldCoordinates.chunkKey(cx, cz));
  }

  public getChunk(cx: number, cz: number): WorldChunk | undefined {
    return this.chunks.get(WorldCoordinates.chunkKey(cx, cz));
  }

  public getLoadedChunkCount(): number {
    return this.chunks.size;
  }

  public getActiveChunkCount(): number {
    return this.activeChunkKeys.size;
  }

  /**
   * Toggle 3D Chunk Debug Borders across all loaded chunks
   */
  public setDebugBorders(enabled: boolean) {
    this.debugBordersEnabled = enabled;
    this.chunks.forEach((chunk) => {
      chunk.setDebugVisible(enabled);
    });
  }

  public toggleDebugBorders(): boolean {
    this.setDebugBorders(!this.debugBordersEnabled);
    return this.debugBordersEnabled;
  }
}
