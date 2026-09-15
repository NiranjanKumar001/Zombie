import { WORLD_CONFIG } from './WorldConfig';

/**
 * Deterministic Seeded Pseudo-Random Number Generator (PRNG)
 * Combines world seed with chunk coordinates (chunkX, chunkZ) via Murmur3 hash
 * and Mulberry32 generator for 100% repeatable world generation.
 */
export class DeterministicRandom {
  private state: number;

  constructor(chunkX: number, chunkZ: number, seedOffset = 0) {
    this.state = DeterministicRandom.generateChunkSeed(chunkX, chunkZ, seedOffset);
  }

  /**
   * Murmur3-style 32-bit hash combining chunk coordinates and world seed
   */
  public static generateChunkSeed(chunkX: number, chunkZ: number, seedOffset = 0): number {
    let h = (WORLD_CONFIG.WORLD_SEED + seedOffset) ^ 0x9e3779b9;
    h = Math.imul(h ^ (chunkX * 73856093), 0xcc9e2d51);
    h = (h << 15) | (h >>> 17);
    h = Math.imul(h, 0x1b873593);
    h = Math.imul(h ^ (chunkZ * 19349663), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }

  /**
   * Mulberry32 PRNG returning float in [0.0, 1.0)
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Float in range [min, max)
   */
  public range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /**
   * Integer in range [min, max] inclusive
   */
  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Boolean with given true probability
   */
  public boolean(probability = 0.5): boolean {
    return this.nextFloat() < probability;
  }
}
