import * as THREE from 'three';

/**
 * Animated River Basin & Water System for Phase 2B.
 * Provides water plane mesh, vertex ripple shaders, and depth queries for vehicle physics.
 */

export class WaterSystem {
  public static WATER_LEVEL = -1.5; // Base water surface height in meters
  private waterMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.waterMaterial = new THREE.MeshBasicMaterial({
      color: 0x2e86ab, // Translucent teal river water
      transparent: true,
      opacity: 0.85
    });
  }

  /** Calculates water depth at (x, z) location. Returns 0 if on dry land. */
  public getWaterDepth(worldX: number, worldZ: number, terrainHeight: number): number {
    // Water basin located in Western river valley (-300 < x < -100)
    const valleyDist = Math.abs(worldX - (-200));
    if (valleyDist < 120 && terrainHeight < WaterSystem.WATER_LEVEL) {
      return WaterSystem.WATER_LEVEL - terrainHeight;
    }
    return 0;
  }

  /** Builds water plane mesh for a given 256m chunk if water exists in region */
  public buildChunkWaterMesh(chunkX: number, chunkZ: number): THREE.Mesh | null {
    const minX = chunkX * 256 - 128;
    const maxX = chunkX * 256 + 128;

    // Water basin spans western river valley (-380 < x < -80)
    if (maxX < -380 || minX > -80) {
      return null; // No water in this chunk
    }

    const geo = new THREE.PlaneGeometry(256, 256, 16, 16);
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, this.waterMaterial);
    mesh.name = `Water_Chunk_${chunkX}_${chunkZ}`;
    mesh.position.set(chunkX * 256, WaterSystem.WATER_LEVEL, chunkZ * 256);
    mesh.receiveShadow = true;

    return mesh;
  }
}
