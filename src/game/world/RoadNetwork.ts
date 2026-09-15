import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

/**
 * 3D Spline-Based Road Network Generator for Phase 2B.
 * Creates Main Highway (asphalt + lane lines + curbs), Secondary Road, and Dirt Trail.
 * Enforces ROAD_CLEARANCE queries and smooth road surface terrain conforming.
 */

export interface RoadPointInfo {
  distance: number;       // Distance in meters to nearest road centerline
  roadType: 'main' | 'secondary' | 'dirt' | 'none';
  width: number;
}

export class RoadNetwork {
  private mainSpline: THREE.CatmullRomCurve3;
  private secondarySpline: THREE.CatmullRomCurve3;
  private dirtSpline: THREE.CatmullRomCurve3;

  constructor() {
    // 1. Main Highway Spline (Winding N-S corridor through 3x3 region)
    const mainPoints = [
      new THREE.Vector3(-150, 0, -420),
      new THREE.Vector3(-80, 0, -250),
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(60, 0, 80),
      new THREE.Vector3(-20, 0, 260),
      new THREE.Vector3(120, 0, 420)
    ];
    this.mainSpline = new THREE.CatmullRomCurve3(mainPoints, false, 'catmullrom', 0.5);

    // 2. Secondary Road Spline (Branching East from Main Highway at z=80)
    const secPoints = [
      new THREE.Vector3(60, 0, 80),
      new THREE.Vector3(160, 0, 110),
      new THREE.Vector3(280, 0, 180),
      new THREE.Vector3(380, 0, 240)
    ];
    this.secondarySpline = new THREE.CatmullRomCurve3(secPoints, false, 'catmullrom', 0.5);

    // 3. Dirt Trail Spline (Winding West into forest & river valley)
    const dirtPoints = [
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(-140, 0, -60),
      new THREE.Vector3(-260, 0, -140),
      new THREE.Vector3(-360, 0, -80)
    ];
    this.dirtSpline = new THREE.CatmullRomCurve3(dirtPoints, false, 'catmullrom', 0.5);
  }

  /** Calculates nearest distance to any road centerline across 3x3 region */
  public getRoadInfo(worldX: number, worldZ: number): RoadPointInfo {
    const p = new THREE.Vector3(worldX, 0, worldZ);
    let minDistance = 99999;
    let closestType: 'main' | 'secondary' | 'dirt' | 'none' = 'none';
    let roadWidth = 0;

    // Sample points along main spline
    const mainSamples = 80;
    for (let i = 0; i <= mainSamples; i++) {
      const pt = this.mainSpline.getPoint(i / mainSamples);
      const dist = p.distanceTo(pt);
      if (dist < minDistance) {
        minDistance = dist;
        closestType = 'main';
        roadWidth = 9.5;
      }
    }

    // Sample points along secondary spline
    const secSamples = 40;
    for (let i = 0; i <= secSamples; i++) {
      const pt = this.secondarySpline.getPoint(i / secSamples);
      const dist = p.distanceTo(pt);
      if (dist < minDistance) {
        minDistance = dist;
        closestType = 'secondary';
        roadWidth = 6.5;
      }
    }

    // Sample points along dirt spline
    const dirtSamples = 40;
    for (let i = 0; i <= dirtSamples; i++) {
      const pt = this.dirtSpline.getPoint(i / dirtSamples);
      const dist = p.distanceTo(pt);
      if (dist < minDistance) {
        minDistance = dist;
        closestType = 'dirt';
        roadWidth = 4.5;
      }
    }

    return {
      distance: minDistance,
      roadType: closestType,
      width: roadWidth
    };
  }

  /** Modifies terrain elevation near roads to flatten road beds smoothly */
  public applyRoadTerrainFlattening(worldX: number, worldZ: number, rawTerrainY: number): number {
    const info = this.getRoadInfo(worldX, worldZ);
    if (info.distance > info.width * 2.0) {
      return rawTerrainY;
    }

    const halfW = info.width * 0.5;
    const shoulderW = info.width * 1.2;

    if (info.distance <= halfW) {
      // Direct road crown elevation (slightly raised 0.15m over terrain)
      return rawTerrainY * 0.1 + 0.15;
    } else if (info.distance <= shoulderW) {
      // Smooth blend factor from road edge to terrain shoulder
      const t = (info.distance - halfW) / (shoulderW - halfW);
      const smoothT = t * t * (3 - 2 * t);
      const roadY = rawTerrainY * 0.1 + 0.15;
      return THREE.MathUtils.lerp(roadY, rawTerrainY, smoothT);
    }

    return rawTerrainY;
  }

  /** Builds 3D road corridor ribbon mesh for a given 256m chunk */
  public buildChunkRoadMesh(chunkX: number, chunkZ: number, heightSampler: (x: number, z: number) => number): THREE.Group {
    const group = new THREE.Group();
    group.name = `Roads_Chunk_${chunkX}_${chunkZ}`;

    const minX = chunkX * 256 - 128;
    const maxX = chunkX * 256 + 128;
    const minZ = chunkZ * 256 - 128;
    const maxZ = chunkZ * 256 + 128;

    const mainMat = new ToonMaterial({ color: 0x3d3731 }); // Warm terracotta asphalt
    const lineMat = new ToonMaterial({ color: 0xe6c875 }); // Yellow center line
    const dirtMat = new ToonMaterial({ color: 0x6e5238 }); // Dark earth dirt

    // Helper to generate ribbon geometry along curve segment inside chunk
    const buildRibbon = (spline: THREE.CatmullRomCurve3, width: number, mat: THREE.Material, numSteps: number) => {
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      let vertIdx = 0;
      for (let i = 0; i <= numSteps; i++) {
        const u = i / numSteps;
        const pt = spline.getPoint(u);
        if (pt.x < minX - 20 || pt.x > maxX + 20 || pt.z < minZ - 20 || pt.z > maxZ + 20) {
          continue;
        }

        const tangent = spline.getTangent(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const y = heightSampler(pt.x, pt.z) + 0.08;

        const left = pt.clone().add(normal.clone().multiplyScalar(-width * 0.5));
        const right = pt.clone().add(normal.clone().multiplyScalar(width * 0.5));

        positions.push(left.x, heightSampler(left.x, left.z) + 0.08, left.z);
        positions.push(right.x, heightSampler(right.x, right.z) + 0.08, right.z);

        normals.push(0, 1, 0, 0, 1, 0);
        uvs.push(0, u * 10, 1, u * 10);

        if (vertIdx > 0) {
          const a = vertIdx * 2 - 2;
          const b = vertIdx * 2 - 1;
          const c = vertIdx * 2;
          const d = vertIdx * 2 + 1;
          indices.push(a, b, c, b, d, c);
        }
        vertIdx++;
      }

      if (indices.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    };

    buildRibbon(this.mainSpline, 9.5, mainMat, 100);
    buildRibbon(this.mainSpline, 0.4, lineMat, 100); // Yellow centerline
    buildRibbon(this.secondarySpline, 6.5, mainMat, 50);
    buildRibbon(this.dirtSpline, 4.5, dirtMat, 50);

    return group;
  }
}
