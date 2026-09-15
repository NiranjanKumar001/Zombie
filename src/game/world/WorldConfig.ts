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

  // --- Centralized Terrain Limits (Phase 3 Part 1) ---
  SEA_LEVEL: -2.0,           // Lowest water basin / riverbed elevation (m)
  MAX_TERRAIN_HEIGHT: 26.0,  // Stays safely below cloud layer (clouds are at Y=35–60m)
  MAX_DRIVABLE_SLOPE: 0.38,  // Maximum drivable incline (~21 deg / 38% grade)
  MAX_TERRAIN_SLOPE: 0.85,   // Maximum natural cliff slope (~40 deg, prevents 80-90 deg walls)

  // --- Centralized Water Parameters (Phase 3 Part 2) ---
  WATER_LEVEL: -1.2,          // Continuous surface elevation for lakes and river systems
  SHALLOW_WATER_DEPTH: 0.6,  // Drivable shallow water threshold (m)
  DEEP_WATER_DEPTH: 1.4,     // Deep water threshold (traction loss / submerge) (m)

  // Outer Map Boundary Mountain Barrier
  MOUNTAIN_BARRIER_START: 1550,  // Distance from center where border highlands smoothly ramp
  MOUNTAIN_BARRIER_HEIGHT: 26.0  // Peaks at MAX_TERRAIN_HEIGHT, smoothly blended
};

export interface TestLocation {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'W';
  name: string;
  description: string;
  x: number;
  z: number;
  yaw: number;
}

export const TEST_LOCATIONS: Record<string, TestLocation> = {
  A: {
    id: 'A',
    name: 'TEST A: Flat',
    description: 'Flat terrain (valley floor / road level)',
    x: 0,
    z: -22,
    yaw: 0
  },
  B: {
    id: 'B',
    name: 'TEST B: Gentle Hill',
    description: 'Gentle hill (slope ~0.10, normal driving)',
    x: 120,
    z: -80,
    yaw: 0.8
  },
  C: {
    id: 'C',
    name: 'TEST C: Moderate Hill',
    description: 'Moderate hill (slope ~0.26, dynamic pitch/roll)',
    x: -120,
    z: 160,
    yaw: -1.2
  },
  D: {
    id: 'D',
    name: 'TEST D: Steep Hill',
    description: 'Steep hill (slope ~0.45, traction loss / cannot climb)',
    x: 280,
    z: 320,
    yaw: 2.1
  },
  E: {
    id: 'E',
    name: 'TEST E: Mountain / Cliff',
    description: 'Mountain cliff base (slope > 0.80, physical barrier)',
    x: 480,
    z: 460,
    yaw: 0.5
  },
  W: {
    id: 'W',
    name: 'TEST W: River Water',
    description: 'Western River Valley (land -> shallow -> deep water transition)',
    x: -160,
    z: -100,
    yaw: 1.57
  }
};
