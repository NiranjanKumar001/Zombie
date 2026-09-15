/**
 * Centralized Configuration for Sketch Apocalypse Large World System (Phase 2A)
 */
export const WORLD_CONFIG = {
  // World Dimensions: 4096m x 4096m initial world size
  WORLD_SIZE: 4096,
  
  // Chunk Dimensions: 256m x 256m per region
  CHUNK_SIZE: 256,
  
  // Grid size: 16 x 16 chunks = 256 chunks total (-8 to +7 coordinates)
  CHUNKS_PER_AXIS: 16,
  MIN_CHUNK_COORD: -8,
  MAX_CHUNK_COORD: 7,

  // Streaming Radii (in chunks)
  ACTIVE_RADIUS: 3,   // 7x7 active grid around player (~49 active chunks)
  PRELOAD_RADIUS: 4,  // Preload margin ahead of player

  // Seed for deterministic generation
  WORLD_SEED: 0x57E7C,

  // LOD Distance Thresholds (in meters)
  LOD_DISTANCES: {
    LOD0: 180,  // Full detail (hero vehicle, high-density instanced foliage)
    LOD1: 380,  // Medium detail
    LOD2: 650   // Low detail
  },

  // Road Corridor Parameters
  ROAD_WIDTH: 9.2,
  ROAD_CORRIDOR_HALF_WIDTH: 7.0,

  // Outer Map Boundary Impenetrable Mountain Elevation (meters)
  MOUNTAIN_BARRIER_HEIGHT: 85.0
};
