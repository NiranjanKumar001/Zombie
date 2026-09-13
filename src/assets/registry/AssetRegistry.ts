export type AssetCategory = 'vehicle' | 'vegetation' | 'rock' | 'building' | 'road' | 'prop';

export interface AssetMetadata {
  id: string;
  name: string;
  category: AssetCategory;
  scaleRange: [number, number];
  maxSlopeDeg: number;
  roadClearance: number; // meters from road centerline
  collisionType: 'box' | 'cylinder' | 'mesh' | 'none';
  collisionRadius?: number;
  lodCount: number;
}

export const ASSET_REGISTRY: Record<string, AssetMetadata> = {
  Vehicle_Hero_Buggy: {
    id: 'Vehicle_Hero_Buggy',
    name: 'Hero Survival 4x4 Buggy',
    category: 'vehicle',
    scaleRange: [1.0, 1.0],
    maxSlopeDeg: 45,
    roadClearance: 0,
    collisionType: 'box',
    lodCount: 2
  },
  Tree_Pine_01: {
    id: 'Tree_Pine_01',
    name: 'Sculpted Alpine Pine',
    category: 'vegetation',
    scaleRange: [0.85, 1.25],
    maxSlopeDeg: 38,
    roadClearance: 6.5,
    collisionType: 'cylinder',
    collisionRadius: 0.5,
    lodCount: 3
  },
  Tree_Broadleaf_01: {
    id: 'Tree_Broadleaf_01',
    name: 'Sculpted Broadleaf Oak',
    category: 'vegetation',
    scaleRange: [0.9, 1.3],
    maxSlopeDeg: 32,
    roadClearance: 7.0,
    collisionType: 'cylinder',
    collisionRadius: 0.6,
    lodCount: 3
  },
  Tree_Blossom_01: {
    id: 'Tree_Blossom_01',
    name: 'Flowering Meadow Accent Tree',
    category: 'vegetation',
    scaleRange: [0.8, 1.15],
    maxSlopeDeg: 30,
    roadClearance: 6.8,
    collisionType: 'cylinder',
    collisionRadius: 0.5,
    lodCount: 3
  },
  Cliff_Stratified_01: {
    id: 'Cliff_Stratified_01',
    name: 'Stratified Rock Wall',
    category: 'rock',
    scaleRange: [0.9, 1.4],
    maxSlopeDeg: 75,
    roadClearance: 12.0,
    collisionType: 'box',
    lodCount: 3
  },
  Rock_Boulder_Large: {
    id: 'Rock_Boulder_Large',
    name: 'Faceted Talus Boulder',
    category: 'rock',
    scaleRange: [0.8, 1.6],
    maxSlopeDeg: 45,
    roadClearance: 7.5,
    collisionType: 'cylinder',
    collisionRadius: 1.5,
    lodCount: 2
  },
  Building_Alpine_Cottage: {
    id: 'Building_Alpine_Cottage',
    name: 'Alpine Rural House',
    category: 'building',
    scaleRange: [1.0, 1.0],
    maxSlopeDeg: 12,
    roadClearance: 11.0,
    collisionType: 'box',
    lodCount: 2
  },
  Road_Straight_Camber: {
    id: 'Road_Straight_Camber',
    name: '3D Crowned Road Segment',
    category: 'road',
    scaleRange: [1.0, 1.0],
    maxSlopeDeg: 15,
    roadClearance: 0,
    collisionType: 'mesh',
    lodCount: 2
  }
};
