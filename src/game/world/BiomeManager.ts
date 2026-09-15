import { DeterministicRandom } from './WorldSeed';
import { WORLD_CONFIG } from './WorldConfig';

export type BiomeType = 'RIVERSIDE' | 'VALLEY' | 'FOREST' | 'GRASSLAND' | 'HIGHLAND' | 'ROAD_CORRIDOR';

/**
 * Biome & Terrain Generator for Phase 2B.
 * Evaluates continuous rolling terrain noise, slopes, biomes, and feature placement.
 */
export class BiomeManager {
  private seed: number;

  constructor(seed: number = WORLD_CONFIG.WORLD_SEED) {
    this.seed = seed;
  }

  /** Continuous mathematical noise for terrain elevation */
  public sampleRawTerrainHeight(worldX: number, worldZ: number): number {
    // Outer perimeter mountain barriers
    const chunkX = Math.floor((worldX + 128) / 256);
    const chunkZ = Math.floor((worldZ + 128) / 256);
    if (Math.abs(chunkX) > 7 || Math.abs(chunkZ) > 7) {
      return WORLD_CONFIG.MOUNTAIN_BARRIER_HEIGHT;
    }

    // 1. Broad rolling regional topography (frequency 0.002)
    const n1 = Math.sin(worldX * 0.0025 + 0.5) * Math.cos(worldZ * 0.0021 + 0.3) * 14.0;

    // 2. Ridge & valley hills (frequency 0.008)
    const n2 = Math.sin(worldX * 0.008 + worldZ * 0.004) * 8.0;

    // 3. Fine surface detail (frequency 0.03)
    const n3 = (Math.sin(worldX * 0.035) + Math.cos(worldZ * 0.031)) * 1.5;

    // 4. Western River Valley Carving (-300 < x < -100)
    const riverX = -200;
    const riverDist = Math.abs(worldX - riverX);
    let riverCarve = 0;
    if (riverDist < 120) {
      const t = riverDist / 120;
      riverCarve = (1 - t * t) * 16.0;
    }

    return n1 + n2 + n3 - riverCarve + 4.0;
  }

  /** Evaluates local biome classification at (x, z) */
  public getBiomeAt(worldX: number, worldZ: number, roadDistance: number, height: number, slope: number): BiomeType {
    if (roadDistance < 8.0) {
      return 'ROAD_CORRIDOR';
    }

    // River valley region
    if (height < -0.5) {
      return 'RIVERSIDE';
    }

    if (height < 2.5) {
      return 'VALLEY';
    }

    if (slope > 0.45 || height > 12.0) {
      return 'HIGHLAND';
    }

    // Hash location for Forest vs Grassland split
    const rng = new DeterministicRandom(Math.floor(worldX / 64), Math.floor(worldZ / 64));
    const val = rng.nextFloat();

    return val > 0.45 ? 'FOREST' : 'GRASSLAND';
  }
}
