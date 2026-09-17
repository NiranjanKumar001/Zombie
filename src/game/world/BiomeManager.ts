import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldConfig';

export type BiomeType = 'RIVERSIDE' | 'VALLEY' | 'FOREST' | 'GRASSLAND' | 'HIGHLAND' | 'ROAD_CORRIDOR';

export interface BiomeWeights {
  riverside: number;
  valley: number;
  grassland: number;
  forest: number;
  highland: number;
  dominantBiome: BiomeType;
  biomeDescription: string;
}

/**
 * Biome & Terrain Generator (Phase 3 Part 3):
 * - Continuous rolling terrain noise bounded strictly below cloud layer
 * - Continuous multi-octave moisture noise (eliminating blocky grids and circular boundaries)
 * - Gradual transitions:
 *     Grassland -> Sparse Trees -> Dense Forest
 *     Grassland -> Rocky Scree -> Highland Mountain
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

  /** Continuous multi-octave moisture index in range [0.0, 1.0] */
  public sampleMoisture(worldX: number, worldZ: number): number {
    const m1 = Math.sin(worldX * 0.0022 + 1.2) * Math.cos(worldZ * 0.0019 + 0.7) * 0.38;
    const m2 = Math.sin(worldX * 0.006 + worldZ * 0.0045) * 0.14;
    const m3 = Math.cos(worldX * 0.015 - worldZ * 0.012) * 0.06;
    return Math.max(0.0, Math.min(1.0, 0.50 + m1 + m2 + m3));
  }

  /**
   * Continuous Tree Density in range [0.0, 1.0]
   * Organically transitions from Open Grassland (0.0) -> Sparse Trees (0.1-0.45) -> Dense Forest (>0.5)
   */
  public sampleTreeDensity(worldX: number, worldZ: number, height: number, slope: number): number {
    // No trees on steep cliffs or peaks; rocky scree instead
    if (slope > 0.28 || height > 16.0) return 0.0;
    // No trees underwater
    if (height < WORLD_CONFIG.WATER_LEVEL + 0.35) return 0.0;

    const moisture = this.sampleMoisture(worldX, worldZ);

    if (moisture < 0.38) {
      // Grassland: wide open meadow, 0 trees
      return 0.0;
    } else if (moisture < 0.58) {
      // Transition Zone: Sparse trees ramping from 0.0 to 0.45
      const t = (moisture - 0.38) / 0.20;
      return t * 0.45;
    } else {
      // Core Forest: Dense canopy
      const t = (moisture - 0.58) / 0.42;
      return 0.45 + t * 0.45;
    }
  }

  /** Evaluates continuous biome classification and smooth weights */
  public sampleBiomeWeights(worldX: number, worldZ: number, roadDistance: number, height: number, slope: number): BiomeWeights {
    const moisture = this.sampleMoisture(worldX, worldZ);

    // Highland weight (ramps up with slope and elevation)
    const slopeFactor = Math.min(1.0, Math.max(0.0, (slope - 0.20) / 0.18));
    const heightFactor = Math.min(1.0, Math.max(0.0, (height - 9.0) / 9.0));
    const highland = Math.max(slopeFactor, heightFactor);

    // Riverside weight
    const riverDist = Math.abs(worldX - (-200));
    let riverside = 0;
    if (riverDist < 110 && height < WORLD_CONFIG.WATER_LEVEL + 1.8) {
      riverside = Math.min(1.0, (110 - riverDist) / 45.0);
    }

    // Valley weight
    const valley = Math.min(1.0, Math.max(0.0, (2.8 - height) / 3.0)) * (1.0 - riverside);

    // Forest vs Grassland continuous partition
    const forestRaw = Math.min(1.0, Math.max(0.0, (moisture - 0.38) / 0.24));
    const grasslandRaw = 1.0 - forestRaw;

    const remaining = Math.max(0.0, 1.0 - Math.max(highland, riverside, valley));
    const forest = remaining * forestRaw;
    const grassland = remaining * grasslandRaw;

    // Dominant biome classification
    let dominant: BiomeType = 'GRASSLAND';
    let desc = 'Grassland';

    if (roadDistance < 8.0) {
      dominant = 'ROAD_CORRIDOR';
      desc = 'Road Corridor';
    } else if (riverside > 0.45) {
      dominant = 'RIVERSIDE';
      desc = 'Riverside Valley';
    } else if (highland > 0.45) {
      dominant = 'HIGHLAND';
      desc = slope > 0.32 ? 'Highland (Rocky Cliffs)' : 'Highland (Alpine Hills)';
    } else if (forest > 0.45) {
      dominant = 'FOREST';
      desc = moisture > 0.58 ? 'Forest (Dense Pines)' : 'Forest (Sparse Woodlands)';
    } else if (valley > 0.45) {
      dominant = 'VALLEY';
      desc = 'Valley Basin';
    } else {
      dominant = 'GRASSLAND';
      desc = moisture > 0.34 ? 'Grassland (Meadow Verge)' : 'Grassland (Open Plains)';
    }

    return {
      riverside,
      valley,
      grassland,
      forest,
      highland,
      dominantBiome: dominant,
      biomeDescription: desc
    };
  }

  /** Evaluates local biome classification at (x, z) */
  public getBiomeAt(worldX: number, worldZ: number, roadDistance: number, height: number, slope: number): BiomeType {
    const weights = this.sampleBiomeWeights(worldX, worldZ, roadDistance, height, slope);
    return weights.dominantBiome;
  }
}
