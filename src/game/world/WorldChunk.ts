import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldConfig';
import { WorldCoordinates, ChunkBounds } from './WorldCoordinates';
import { DeterministicRandom } from './WorldSeed';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';
import { AssetRegistry } from '../../assets/registry/AssetRegistry';
import { RoadNetwork } from './RoadNetwork';
import { WaterSystem } from './WaterSystem';
import { BiomeManager } from './BiomeManager';

export type ChunkLOD = 0 | 1 | 2;

export interface ElevationProvider {
  (worldX: number, worldZ: number): number;
}

/**
 * WorldChunk Class for Phase 2B
 * Represents one 256m x 256m streaming region in the 4km x 4km world.
 * Manages deterministic multi-biome terrain, 3D spline roads, water planes,
 * structured AssetRegistry object placement with strict ROAD_CLEARANCE enforcement,
 * LOD transitions, debug wireframes, and complete WebGL memory disposal.
 */
export class WorldChunk {
  public readonly chunkX: number;
  public readonly chunkZ: number;
  public readonly key: string;
  public readonly bounds: ChunkBounds;

  public group: THREE.Group;
  public active: boolean = false;
  public lodLevel: ChunkLOD = 0;

  // Components
  private terrainMesh!: THREE.Mesh;
  private roadGroup?: THREE.Group;
  private waterMesh?: THREE.Mesh | null;
  private placedObjectsGroup: THREE.Group;

  // Debug Wireframe & Label
  private debugWireframe?: THREE.LineSegments;
  private debugLabelMesh?: THREE.Mesh;
  private isDebugVisible: boolean = false;

  private elevationProvider: ElevationProvider;
  private roadNetwork: RoadNetwork;
  private waterSystem: WaterSystem;
  private biomeManager: BiomeManager;

  constructor(
    chunkX: number,
    chunkZ: number,
    elevationProvider: ElevationProvider,
    roadNetwork: RoadNetwork,
    waterSystem: WaterSystem,
    biomeManager: BiomeManager
  ) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.key = WorldCoordinates.chunkKey(chunkX, chunkZ);
    this.bounds = WorldCoordinates.chunkToBounds(chunkX, chunkZ);
    this.elevationProvider = elevationProvider;
    this.roadNetwork = roadNetwork;
    this.waterSystem = waterSystem;
    this.biomeManager = biomeManager;

    this.group = new THREE.Group();
    this.group.position.set(this.bounds.centerX, 0, this.bounds.centerZ);
    this.group.name = `Chunk_${this.key}`;

    this.placedObjectsGroup = new THREE.Group();
    this.group.add(this.placedObjectsGroup);

    this.buildChunkContent();
    this.buildDebugOverlay();
  }

  /**
   * Builds high-quality chunk content for Phase 2B (Terrain, Roads, Water, Biome Assets)
   */
  private buildChunkContent() {
    const rng = new DeterministicRandom(this.chunkX, this.chunkZ);
    const size = WORLD_CONFIG.CHUNK_SIZE;
    const halfSize = size / 2;

    // 1. Terrain Mesh (256m x 256m with 32x32 vertex grid)
    const segments = 32;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const colGrass = new THREE.Color('#4c783c');
    const colForest = new THREE.Color('#325c2d');
    const colDirt = new THREE.Color('#5a4332');
    const colSand = new THREE.Color('#a89369');      // Warm beach sand
    const colMud = new THREE.Color('#423528');       // Wet river mud & silt
    const colDeepRiver = new THREE.Color('#1c3327'); // Deep submerged riverbed
    const colRock = new THREE.Color('#746654');      // Rocky slope scree
    const colMountain = new THREE.Color('#53637a');  // Soft anime mountain rock (blends with fog)

    const waterLvl = WaterSystem.WATER_LEVEL; // -1.2m
    let minElevation = 999;

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);
      const worldX = this.bounds.centerX + localX;
      const worldZ = this.bounds.centerZ + localZ;

      const y = this.elevationProvider(worldX, worldZ);
      if (y < minElevation) minElevation = y;
      pos.setY(i, y);

      const roadInfo = this.roadNetwork.getRoadInfo(worldX, worldZ);
      const moisture = this.biomeManager.sampleMoisture(worldX, worldZ);

      // Base vegetation color: Smooth blend between open Grassland and Forest floor
      const forestBlend = Math.min(1.0, Math.max(0.0, (moisture - 0.38) / 0.22));
      let vCol = colGrass.clone().lerp(colForest, forestBlend * 0.7);

      if (roadInfo.distance < roadInfo.width * 1.2) {
        vCol.lerp(colDirt, Math.max(0, 1.0 - roadInfo.distance / (roadInfo.width * 1.2)));
      } else if (y < waterLvl - 0.5) {
        // Deep submerged riverbed
        vCol.lerp(colDeepRiver, 0.95);
      } else if (y < waterLvl) {
        // Submerged shallow riverbed / wet silt
        vCol.lerp(colMud, 0.9);
      } else if (y < waterLvl + 0.65) {
        // Readable Shoreline: Sand & beach pebbles meeting the water
        const t = (y - waterLvl) / 0.65;
        const shoreCol = colSand.clone().lerp(colMud, 1.0 - t);
        vCol.lerp(shoreCol, 0.85);
      } else if (y < waterLvl + 2.0) {
        // Lush riverside meadow verge
        vCol.lerp(colGrass, 0.55);
      } else if (y > 18.0) {
        // High Mountain Peak (softer color, fades into sky fog)
        vCol.lerp(colMountain, Math.min(1.0, (y - 18.0) / 8.0));
      } else if (y > 9.0) {
        // Highland Rocky Incline
        vCol.lerp(colRock, Math.min(1.0, (y - 9.0) / 9.0));
      }

      colors[i * 3] = vCol.r;
      colors[i * 3 + 1] = vCol.g;
      colors[i * 3 + 2] = vCol.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new ToonMaterial({
      color: '#ffffff',
      useVertexColors: true,
      hatchIntensity: 0.22
    });

    this.terrainMesh = new THREE.Mesh(geo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);

    // 2. 3D Spline Road Ribbon
    this.roadGroup = this.roadNetwork.buildChunkRoadMesh(
      this.chunkX,
      this.chunkZ,
      this.elevationProvider
    );
    this.roadGroup.position.set(-this.bounds.centerX, 0, -this.bounds.centerZ);
    this.group.add(this.roadGroup);

    // 3. Water Surface Plane (Continuous & Seamless River Corridor)
    const hasWater = minElevation < WaterSystem.WATER_LEVEL + 0.2;
    this.waterMesh = this.waterSystem.buildChunkWaterMesh(this.chunkX, this.chunkZ, hasWater);
    if (this.waterMesh) {
      this.group.add(this.waterMesh);
    }

    // 4. Biome Asset Placement via Organic Density Transitions
    const registry = AssetRegistry.getInstance();
    const objectAttempts = 26;

    for (let o = 0; o < objectAttempts; o++) {
      const lx = rng.range(-halfSize + 12, halfSize - 12);
      const lz = rng.range(-halfSize + 12, halfSize - 12);
      const wx = this.bounds.centerX + lx;
      const wz = this.bounds.centerZ + lz;

      const wy = this.elevationProvider(wx, wz);
      const roadInfo = this.roadNetwork.getRoadInfo(wx, wz);
      const slope = this.biomeManager.sampleTerrainSlope(wx, wz, this.elevationProvider);

      // Don't place underwater, on roads, or on extreme cliff walls
      if (wy <= WaterSystem.WATER_LEVEL + 0.35 || wy >= 24.0) continue;
      if (roadInfo.distance < 10.0) continue;

      const treeDensity = this.biomeManager.sampleTreeDensity(wx, wz, wy, slope);
      const weights = this.biomeManager.sampleBiomeWeights(wx, wz, roadInfo.distance, wy, slope);

      let chosenId: string | null = null;

      if (weights.highland > 0.40) {
        // Highland / Mountain Scree: Boulders and sedimentary cliffs
        if (rng.nextFloat() < 0.65) {
          const rockCandidates = ['talus_boulder', 'sedimentary_cliff', 'talus_boulder'];
          chosenId = rockCandidates[rng.int(0, rockCandidates.length - 1)];
        }
      } else if (treeDensity > 0.05) {
        // Forest transition or dense forest
        if (rng.nextFloat() < treeDensity) {
          if (treeDensity > 0.50) {
            // Dense forest: Pine, Oak, and occasional Alpine Cottage
            const forestCandidates = ['pine_hero', 'oak_hero', 'pine_hero', 'alpine_cottage'];
            chosenId = forestCandidates[rng.int(0, forestCandidates.length - 1)];
          } else {
            // Sparse transition zone: Oak, Pine, Grass Tuft, and Boulder
            const sparseCandidates = ['oak_hero', 'pine_hero', 'talus_boulder', 'grass_tuft'];
            chosenId = sparseCandidates[rng.int(0, sparseCandidates.length - 1)];
          }
        }
      } else {
        // Open Grassland: wide open plains with occasional grass tuft or low boulder
        if (rng.nextFloat() < 0.20) {
          chosenId = rng.nextFloat() > 0.3 ? 'grass_tuft' : 'talus_boulder';
        }
      }

      if (chosenId) {
        const instance = registry.getTemplate(chosenId);
        const assetDef = registry.getDefinition(chosenId);
        const scaleRange = assetDef ? assetDef.scaleRange : [0.8, 1.2];
        const scale = rng.range(scaleRange[0], scaleRange[1]);

        instance.position.set(lx, wy, lz);
        instance.scale.setScalar(scale);
        instance.rotation.y = rng.range(0, Math.PI * 2);

        this.placedObjectsGroup.add(instance);
      }
    }
  }

  /**
   * Creates 3D Wireframe Boundary Box and Label ("CHUNK X,Z") for developer debug
   */
  private buildDebugOverlay() {
    const size = WORLD_CONFIG.CHUNK_SIZE;

    const boxGeo = new THREE.BoxGeometry(size, 40, size);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf39c12,
      linewidth: 2,
      depthTest: false
    });
    this.debugWireframe = new THREE.LineSegments(edges, lineMat);
    this.debugWireframe.position.set(0, 20, 0);
    this.debugWireframe.visible = false;
    this.group.add(this.debugWireframe);

    // Floating 3D Text Label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#121626';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 56);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CHUNK ${this.chunkX},${this.chunkZ}`, 128, 32);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(36, 9);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false
    });
    this.debugLabelMesh = new THREE.Mesh(labelGeo, labelMat);
    this.debugLabelMesh.position.set(0, 16, 0);
    this.debugLabelMesh.visible = false;
    this.group.add(this.debugLabelMesh);
  }

  public setDebugVisible(visible: boolean) {
    this.isDebugVisible = visible;
    if (this.debugWireframe) this.debugWireframe.visible = visible;
    if (this.debugLabelMesh) this.debugLabelMesh.visible = visible;
  }

  public setLOD(lod: ChunkLOD) {
    if (this.lodLevel === lod) return;
    this.lodLevel = lod;
    this.placedObjectsGroup.visible = lod <= 1;
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });

    if (this.debugLabelMesh && this.debugLabelMesh.material) {
      const mat = this.debugLabelMesh.material as THREE.MeshBasicMaterial;
      if (mat.map) mat.map.dispose();
    }

    this.group.clear();
  }
}
