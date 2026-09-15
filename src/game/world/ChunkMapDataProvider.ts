import { RoadNetwork } from './RoadNetwork';
import { WaterSystem } from './WaterSystem';

export type MapExplorationState = 'unexplored' | 'explored' | 'visible';

export interface LandmarkMapData {
  x: number;
  z: number;
  type: 'cottage' | 'watchtower' | 'outpost';
  label: string;
}

export interface RoadSplineMapData {
  type: 'main' | 'secondary' | 'dirt';
  points: { x: number; z: number }[];
}

export interface WaterBodyMapData {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ChunkMapData {
  chunkX: number;
  chunkZ: number;
  explorationState: MapExplorationState;
  roads: RoadSplineMapData[];
  waterBodies: WaterBodyMapData[];
  landmarks: LandmarkMapData[];
}

/**
 * Lightweight Provider generating global vector map data for Phase 2C Minimap.
 * Provides high-speed 2D rendering without any 3D WebGL render overhead.
 */
export class ChunkMapDataProvider {
  private roadNetwork: RoadNetwork;

  constructor(roadNetwork: RoadNetwork) {
    this.roadNetwork = roadNetwork;
  }

  /**
   * Generates lightweight map data for a single chunk
   */
  public getChunkMapData(chunkX: number, chunkZ: number): ChunkMapData {
    const minX = chunkX * 256 - 128;
    const maxX = chunkX * 256 + 128;
    const minZ = chunkZ * 256 - 128;
    const maxZ = chunkZ * 256 + 128;

    // 1. Water Bodies (Western River Valley: -380 < x < -80)
    const waterBodies: WaterBodyMapData[] = [];
    if (maxX >= -380 && minX <= -80) {
      waterBodies.push({
        minX: Math.max(minX, -380),
        maxX: Math.min(maxX, -80),
        minZ: minZ,
        maxZ: maxZ
      });
    }

    // 2. Road Splines
    const roads: RoadSplineMapData[] = [];

    // Main Highway Segment
    const mainPts: { x: number; z: number }[] = [];
    for (let z = minZ; z <= maxZ; z += 16) {
      const info = this.roadNetwork.getRoadInfo(0, z);
      if (info.roadType === 'main') {
        mainPts.push({ x: 0, z });
      }
    }
    if (mainPts.length > 0) {
      roads.push({ type: 'main', points: mainPts });
    }

    // Secondary Road Segment
    if (chunkX >= 0 && chunkZ >= 0) {
      roads.push({
        type: 'secondary',
        points: [
          { x: Math.max(minX, 60), z: 80 },
          { x: Math.min(maxX, 380), z: 240 }
        ]
      });
    }

    // Dirt Trail Segment
    if (chunkX <= 0) {
      roads.push({
        type: 'dirt',
        points: [
          { x: 0, z: -100 },
          { x: -140, z: -60 },
          { x: -260, z: -140 },
          { x: -360, z: -80 }
        ]
      });
    }

    // 3. Architectural Landmarks
    const landmarks: LandmarkMapData[] = [];
    if (Math.abs(chunkX) === 1 && (chunkZ % 3 === 0)) {
      landmarks.push({
        x: chunkX > 0 ? minX + 32 : maxX - 32,
        z: (minZ + maxZ) / 2,
        type: 'cottage',
        label: 'Alpine Cottage'
      });
    }

    if (chunkX === 2 && chunkZ === 0) {
      landmarks.push({
        x: maxX - 40,
        z: minZ + 40,
        type: 'watchtower',
        label: 'Watchtower'
      });
    }

    return {
      chunkX,
      chunkZ,
      explorationState: 'explored', // Default fully visible for development
      roads,
      waterBodies,
      landmarks
    };
  }
}
