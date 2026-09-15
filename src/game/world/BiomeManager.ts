import * as THREE from 'three';
import { DeterministicRandom } from './WorldSeed';
import { WORLD_CONFIG } from './WorldConfig';

export type BiomeType = 'RIVERSIDE' | 'VALLEY' | 'FOREST' | 'GRASSLAND' | 'HIGHLAND' | 'ROAD_CORRIDOR';

/**
 * Biome & Terrain Generator for Phase 3 Part 1.
 * Evaluates continuous rolling terrain noise, slopes, biomes, and bounded height generation.
 * Eliminates step functions, spikes, and ensures terrain stays below cloud layers.
 */
export class BiomeManager {
  private seed: number;

  constructor(seed: number = WORLD_CONFIG.WORLD_SEED) {
    this.seed = seed;
  }

  /** Continuous mathematical noise for terrain elevation */
  public sampleRawTerrainHeight(worldX: number, worldZ: number): number {
    // 1. Broad rolling regional topography (frequency 0.0025, amplitude 7.0m)
    const n1 = Math.sin(worldX * 0.0025 + 0.5) * Math.cos(worldZ * 0.0021 + 0.3) * 7.0;

    // 2. Ridge & valley hills (frequency 0.007, amplitude 4.2m)
    const n2 = Math.sin(worldX * 0.007 + worldZ * 0.0035) * 4.2;

    // 3. Fine surface undulating detail (frequency 0.025, amplitude 0.8m)
    const n3 = (Math.sin(worldX * 0.025) + Math.cos(worldZ * 0.022)) * 0.8;

    // 4. Western River Valley Carving (-320 < x < -80)
    const riverX = -200;
    const riverDist = Math.abs(worldX - riverX);
    let riverCarve = 0;
    if (riverDist < 120) {
      const t = riverDist / 120;
      riverCarve = (1 - t * t) * 6.5;
    }

    // 5. Outer perimeter mountain barrier: smooth natural ridge (NO step functions)
    const distFromCenter = Math.max(Math.abs(worldX), Math.abs(worldZ));
    const barrierStart = WORLD_CONFIG.MOUNTAIN_BARRIER_START; // 1550m
    const barrierEnd = 1980;
    let barrierAdd = 0;
    if (distFromCenter > barrierStart) {
      const t = Math.min(1.0, (distFromCenter - barrierStart) / (barrierEnd - barrierStart));
      const smoothT = t * t * (3 - 2 * t);
      barrierAdd = smoothT * 14.0;
    }

    let raw = n1 + n2 + n3 - riverCarve + 3.2 + barrierAdd;

    // Strict Centralized Limits: bound between SEA_LEVEL (-2.0) and MAX_TERRAIN_HEIGHT (26.0)
    return Math.max(WORLD_CONFIG.SEA_LEVEL, Math.min(WORLD_CONFIG.MAX_TERRAIN_HEIGHT, raw));
  }

  /** Samples local terrain surface normal vector */
  public sampleTerrainNormal(worldX: number, worldZ: number, heightSampler: (x: number, z: number) => number): THREE.Vector3 {
    const eps = 0.6;
    const hL = heightSampler(worldX - eps, worldZ);
    const hR = heightSampler(worldX + eps, worldZ);
    const hD = heightSampler(worldX, worldZ - eps);
    const hU = heightSampler(worldX, worldZ + eps);
    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);
    return new THREE.Vector3(-dx, 1.0, -dz).normalize();
  }

  /** Samples local terrain slope grade (rise / run) */
  public sampleTerrainSlope(worldX: number, worldZ: number, heightSampler: (x: number, z: number) => number): number {
    const eps = 0.6;
    const hL = heightSampler(worldX - eps, worldZ);
    const hR = heightSampler(worldX + eps, worldZ);
    const hD = heightSampler(worldX, worldZ - eps);
    const hU = heightSampler(worldX, worldZ + eps);
    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);
    return Math.sqrt(dx * dx + dz * dz);
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

    if (slope > 0.35 || height > 14.0) {
      return 'HIGHLAND';
    }

    // Hash location for Forest vs Grassland split
    const rng = new DeterministicRandom(Math.floor(worldX / 64), Math.floor(worldZ / 64));
    const val = rng.nextFloat();

    return val > 0.45 ? 'FOREST' : 'GRASSLAND';
  }
}
