import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

/**
 * 3D Sculpted Terrain Scene Asset
 * Features:
 * - Rolling hills, slopes, road valley corridor, and elevated ridge bank
 * - Vertex colors for blended stylized grass, dirt, and rock shelf zones
 * - Deterministic procedural height function for vehicle physics raycasts
 */
export class TerrainSceneModel {
  public root: THREE.Group;
  public terrainMesh: THREE.Mesh;
  private width: number;
  private length: number;
  private segments: number;

  constructor(width = 160, length = 160, segments = 80) {
    this.root = new THREE.Group();
    this.width = width;
    this.length = length;
    this.segments = segments;

    const geo = new THREE.PlaneGeometry(width, length, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const colGrass = new THREE.Color('#385c31');
    const colHighGrass = new THREE.Color('#4c783c');
    const colDirt = new THREE.Color('#5a4332');
    const colRock = new THREE.Color('#78583c');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Height evaluation
      const y = TerrainSceneModel.sampleElevation(x, z);
      pos.setY(i, y);

      // Color blending based on height, slope, and proximity to road (x=0 corridor)
      const distFromRoad = Math.abs(x);
      let vertexColor = colGrass.clone();

      if (distFromRoad < 7.0) {
        // Road corridor shoulder / dirt
        vertexColor.lerp(colDirt, Math.max(0, 1.0 - distFromRoad / 7.0));
      } else if (y > 4.5) {
        // High ridge rock
        vertexColor.lerp(colRock, Math.min(1.0, (y - 4.5) / 5.0));
      } else if (y > 1.5) {
        // Lush meadow crest
        vertexColor.lerp(colHighGrass, 0.6);
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new ToonMaterial({
      color: '#ffffff',
      useVertexColors: true,
      hatchIntensity: 0.35
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.root.add(this.terrainMesh);
  }

  /**
   * Deterministic height function used by both the mesh generation and vehicle physics
   */
  public static sampleElevation(x: number, z: number): number {
    const distFromCenter = Math.abs(x);

    // Road corridor (x between -6 and +6) remains flat and smooth
    let roadCarve = 1.0;
    if (distFromCenter < 6.5) {
      roadCarve = 0.0;
    } else if (distFromCenter < 12.0) {
      roadCarve = (distFromCenter - 6.5) / 5.5;
    }

    // East side cliff ridge (x > 14)
    let eastCliff = 0;
    if (x > 12) {
      eastCliff = Math.min(9.5, (x - 12) * 0.75 + Math.sin(z * 0.1) * 1.5);
    }

    // West side rolling meadow & hill (x < -12)
    let westHills = 0;
    if (x < -10) {
      westHills = (Math.sin(-x * 0.12) * 2.2 + Math.cos(z * 0.08) * 1.8 + Math.sin((x + z) * 0.05) * 1.5);
    }

    // Gentle undulations along road length (gradual crest and dip)
    const roadGrade = Math.sin(z * 0.04) * 0.8;

    return roadGrade + (eastCliff + westHills) * roadCarve;
  }

  /**
   * Query ground elevation at world (x, z)
   */
  public getHeightAt(x: number, z: number): number {
    return TerrainSceneModel.sampleElevation(x, z);
  }
}
