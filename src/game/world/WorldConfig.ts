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

/**
 * Centralized Global Lighting & Sky System Configuration (Phase 3 Part 3)
 * Guarantees one coherent, consistent lighting setup across the entire world.
 */
export const LIGHTING_CONFIG = {
  // Global Sun Direction: Normalized vector pointing from light source toward origin
  SUN_DIR_X: 0.45,
  SUN_DIR_Y: 0.75,
  SUN_DIR_Z: 0.48,

  // Direct Sun Color & Intensity
  SUN_COLOR: '#fff6e5',
  SUN_INTENSITY: 1.85,

  // Ambient Fill (Lifted to prevent dark shadow crush)
  AMBIENT_SKY_COLOR: '#7ea5dc',    // Soft anime sky bounce
  AMBIENT_GROUND_COLOR: '#5a4f42', // Warm earth reflection
  AMBIENT_INTENSITY: 0.95,         // World never becomes too dark

  // Atmospheric Perspective / Distance Fog
  FOG_COLOR: '#7ca2cc',            // Matches horizon sky gradient
  FOG_NEAR: 160.0,                 // Pristine clarity near player
  FOG_FAR: 850.0,                  // Distant mountains fade into horizon haze

  // Elevated Cloud Layer (Strictly above MAX_TERRAIN_HEIGHT = 26.0m)
  CLOUD_ALTITUDE_MIN: 75.0,        // Lowest cloud base (guarantees >49m clearance)
  CLOUD_ALTITUDE_MAX: 110.0,       // High cloud puffs
  SKY_DOME_RADIUS: 700.0,          // Fits comfortably inside camera far clipping plane (850m)

  // Tone Mapping & Exposure
  EXPOSURE: 1.05
};

export interface TestLocation {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'W' | 'T1' | 'T2' | 'T3';
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
  },
  T1: {
    id: 'T1',
    name: 'TEST T1: Grass -> Forest',
    description: 'Natural biome transition: Grassland -> Sparse Trees -> Dense Forest',
    x: 60,
    z: 100,
    yaw: 0.75
  },
  T2: {
    id: 'T2',
    name: 'TEST T2: Grass -> Highland',
    description: 'Natural biome transition: Grassland -> Rocky Verge -> Highland Boulders',
    x: 200,
    z: 220,
    yaw: 1.1
  },
  T3: {
    id: 'T3',
    name: 'TEST T3: Mountain Horizon',
    description: 'High elevation vista: Clouds high above (Y>75m), mountains fading softly into fog',
    x: 420,
    z: 380,
    yaw: 2.8
  }
};
