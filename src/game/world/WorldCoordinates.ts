import { WORLD_CONFIG } from './WorldConfig';

export interface ChunkCoord {
  chunkX: number;
  chunkZ: number;
}

export interface ChunkBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
}

/**
 * World Coordinate System Utilities
 * Provides deterministic mapping between world coordinates (meters) and chunk grid coordinates.
 */
export class WorldCoordinates {
  /**
   * Convert world position (worldX, worldZ) to chunk coordinate (chunkX, chunkZ)
   */
  public static worldToChunk(worldX: number, worldZ: number): ChunkCoord {
    return {
      chunkX: Math.floor(worldX / WORLD_CONFIG.CHUNK_SIZE),
      chunkZ: Math.floor(worldZ / WORLD_CONFIG.CHUNK_SIZE)
    };
  }

  /**
   * Get world bounding box for a chunk coordinate
   */
  public static chunkToBounds(chunkX: number, chunkZ: number): ChunkBounds {
    const minX = chunkX * WORLD_CONFIG.CHUNK_SIZE;
    const minZ = chunkZ * WORLD_CONFIG.CHUNK_SIZE;
    const maxX = minX + WORLD_CONFIG.CHUNK_SIZE;
    const maxZ = minZ + WORLD_CONFIG.CHUNK_SIZE;
    return {
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: minX + WORLD_CONFIG.CHUNK_SIZE / 2,
      centerZ: minZ + WORLD_CONFIG.CHUNK_SIZE / 2
    };
  }

  /**
   * Format chunk coordinate to unique string key (e.g. "0,0", "-1,2")
   */
  public static chunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }

  /**
   * Parse chunk key string back into ChunkCoord
   */
  public static keyToChunk(key: string): ChunkCoord {
    const parts = key.split(',');
    return {
      chunkX: parseInt(parts[0], 10),
      chunkZ: parseInt(parts[1], 10)
    };
  }

  /**
   * Chebyshev distance between two chunk coordinates (max component difference)
   */
  public static chunkDistance(c1: ChunkCoord, c2: ChunkCoord): number {
    return Math.max(Math.abs(c1.chunkX - c2.chunkX), Math.abs(c1.chunkZ - c2.chunkZ));
  }
}
