import * as THREE from 'three';
import {
  createPineTreeHero,
  createOakTreeHero,
  createTalusBoulder,
  createSedimentaryCliff,
  createAlpineCottage,
  createWatchtowerOutpost,
  createRoadSignProp,
  createGrassTuft
} from '../models/EnvironmentModels';

export type AssetCategory = 'tree' | 'rock' | 'cliff' | 'building' | 'road_prop' | 'grass';

export interface AssetDefinition {
  id: string;
  category: AssetCategory;
  scaleRange: [number, number];
  collisionType: 'cylinder' | 'box' | 'mesh' | 'none';
  collisionRadius?: number;
  biomes: string[];
  minSlope: number;
  maxSlope: number;
  roadClearance: number; // Minimum distance in meters from any road center
  builder: () => THREE.Group;
}

export class AssetRegistry {
  private static instance: AssetRegistry;
  private definitions: Map<string, AssetDefinition> = new Map();
  private templateCache: Map<string, THREE.Group> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  private registerDefaults() {
    this.register({
      id: 'pine_hero',
      category: 'tree',
      scaleRange: [0.85, 1.35],
      collisionType: 'cylinder',
      collisionRadius: 0.6,
      biomes: ['FOREST', 'HIGHLAND', 'VALLEY'],
      minSlope: 0,
      maxSlope: 0.6,
      roadClearance: 7.5,
      builder: createPineTreeHero
    });

    this.register({
      id: 'oak_hero',
      category: 'tree',
      scaleRange: [0.8, 1.25],
      collisionType: 'cylinder',
      collisionRadius: 0.7,
      biomes: ['FOREST', 'GRASSLAND', 'RIVERSIDE'],
      minSlope: 0,
      maxSlope: 0.4,
      roadClearance: 8.0,
      builder: createOakTreeHero
    });

    this.register({
      id: 'talus_boulder',
      category: 'rock',
      scaleRange: [0.7, 1.8],
      collisionType: 'cylinder',
      collisionRadius: 1.5,
      biomes: ['FOREST', 'GRASSLAND', 'HIGHLAND', 'RIVERSIDE'],
      minSlope: 0,
      maxSlope: 0.8,
      roadClearance: 5.5,
      builder: createTalusBoulder
    });

    this.register({
      id: 'sedimentary_cliff',
      category: 'cliff',
      scaleRange: [1.0, 1.6],
      collisionType: 'box',
      collisionRadius: 5.0,
      biomes: ['HIGHLAND'],
      minSlope: 0.35,
      maxSlope: 1.5,
      roadClearance: 12.0,
      builder: createSedimentaryCliff
    });

    this.register({
      id: 'alpine_cottage',
      category: 'building',
      scaleRange: [0.9, 1.1],
      collisionType: 'box',
      collisionRadius: 4.0,
      biomes: ['GRASSLAND', 'VALLEY'],
      minSlope: 0,
      maxSlope: 0.15,
      roadClearance: 14.0,
      builder: createAlpineCottage
    });

    this.register({
      id: 'watchtower_outpost',
      category: 'building',
      scaleRange: [0.9, 1.15],
      collisionType: 'box',
      collisionRadius: 2.2,
      biomes: ['HIGHLAND', 'FOREST'],
      minSlope: 0,
      maxSlope: 0.3,
      roadClearance: 10.0,
      builder: createWatchtowerOutpost
    });

    this.register({
      id: 'road_sign',
      category: 'road_prop',
      scaleRange: [0.9, 1.1],
      collisionType: 'cylinder',
      collisionRadius: 0.2,
      biomes: ['ROAD_CORRIDOR'],
      minSlope: 0,
      maxSlope: 0.3,
      roadClearance: 2.5, // Placed near roadside shoulder
      builder: createRoadSignProp
    });

    this.register({
      id: 'grass_tuft',
      category: 'grass',
      scaleRange: [0.8, 1.5],
      collisionType: 'none',
      biomes: ['GRASSLAND', 'FOREST', 'RIVERSIDE', 'ROAD_CORRIDOR'],
      minSlope: 0,
      maxSlope: 0.7,
      roadClearance: 1.5, // Allowed very close to road verge
      builder: createGrassTuft
    });
  }

  public register(def: AssetDefinition) {
    this.definitions.set(def.id, def);
  }

  public getDefinition(id: string): AssetDefinition | undefined {
    return this.definitions.get(id);
  }

  public getTemplate(id: string): THREE.Group {
    let template = this.templateCache.get(id);
    if (!template) {
      const def = this.definitions.get(id);
      if (!def) throw new Error(`Asset definition '${id}' not found in AssetRegistry.`);
      template = def.builder();
      this.templateCache.set(id, template);
    }
    return template.clone(true);
  }

  public getForBiome(biome: string): AssetDefinition[] {
    const list: AssetDefinition[] = [];
    this.definitions.forEach((def) => {
      if (def.biomes.includes(biome)) {
        list.push(def);
      }
    });
    return list;
  }
}
