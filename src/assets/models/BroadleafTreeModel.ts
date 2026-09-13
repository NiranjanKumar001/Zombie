import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

export interface BroadleafOptions {
  isFlowering?: boolean;
  scale?: number;
}

/**
 * High-Quality Sculpted Broadleaf Tree Asset
 * Features an organic curved trunk splitting into multiple thick scaffold boughs,
 * 8-10 sculpted voluminous foliage clusters forming an irregular asymmetrical crown.
 */
export class BroadleafTreeModel {
  public root: THREE.Group;

  constructor(options: BroadleafOptions = {}) {
    this.root = new THREE.Group();

    const isFlowering = options.isFlowering ?? false;
    const leafColorPrimary = isFlowering ? '#b83b68' : '#4d7c38';
    const leafColorSecondary = isFlowering ? '#df5c8d' : '#689d4e';
    const leafColorDark = isFlowering ? '#782142' : '#2d5222';

    const matTrunk = new ToonMaterial({ color: '#5a4635', hatchIntensity: 0.45 });
    const matFoliage1 = new ToonMaterial({ color: leafColorPrimary, hatchIntensity: 0.3 });
    const matFoliage2 = new ToonMaterial({ color: leafColorSecondary, hatchIntensity: 0.25 });
    const matFoliageDark = new ToonMaterial({ color: leafColorDark, hatchIntensity: 0.45 });

    // 1. Organic Curved Main Trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25, 1.8, -0.1),
      new THREE.Vector3(-0.2, 3.4, 0.15),
      new THREE.Vector3(0.1, 4.6, 0.0) // Fork node
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 16, 0.52, 8, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, matTrunk);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.root.add(trunkMesh);

    // 2. Scaffold Boughs (3 major divergent limbs)
    const branches = [
      {
        curve: [
          new THREE.Vector3(0.1, 4.6, 0.0),
          new THREE.Vector3(-1.4, 6.0, -0.6),
          new THREE.Vector3(-2.2, 7.2, -1.1)
        ],
        radius: 0.32
      },
      {
        curve: [
          new THREE.Vector3(0.1, 4.6, 0.0),
          new THREE.Vector3(1.5, 6.2, 0.7),
          new THREE.Vector3(2.4, 7.6, 1.2)
        ],
        radius: 0.34
      },
      {
        curve: [
          new THREE.Vector3(0.1, 4.6, 0.0),
          new THREE.Vector3(-0.2, 6.8, 1.3),
          new THREE.Vector3(-0.3, 8.2, 1.8)
        ],
        radius: 0.28
      }
    ];

    for (const b of branches) {
      const bCurve = new THREE.CatmullRomCurve3(b.curve);
      const bGeo = new THREE.TubeGeometry(bCurve, 12, b.radius, 6, false);
      const bMesh = new THREE.Mesh(bGeo, matTrunk);
      bMesh.castShadow = true;
      this.root.add(bMesh);
    }

    // 3. Voluminous Asymmetric Canopy (8-10 distinct irregular clusters)
    const clusterDefs = [
      { pos: new THREE.Vector3(-2.4, 7.8, -1.2), size: 2.1, mat: matFoliage1, scale: [1.2, 0.9, 1.1] },
      { pos: new THREE.Vector3(-1.6, 8.8, -0.6), size: 1.8, mat: matFoliage2, scale: [1.1, 1.0, 1.0] },
      { pos: new THREE.Vector3(2.6, 8.2, 1.3), size: 2.3, mat: matFoliage1, scale: [1.3, 0.95, 1.1] },
      { pos: new THREE.Vector3(1.7, 9.2, 0.8), size: 1.9, mat: matFoliage2, scale: [1.1, 1.1, 1.0] },
      { pos: new THREE.Vector3(-0.4, 9.0, 1.9), size: 2.0, mat: matFoliageDark, scale: [1.0, 0.9, 1.2] },
      { pos: new THREE.Vector3(0.2, 10.0, 0.2), size: 2.5, mat: matFoliage2, scale: [1.2, 1.0, 1.1] }, // Apex
      { pos: new THREE.Vector3(0.8, 8.4, -1.4), size: 1.7, mat: matFoliageDark, scale: [1.0, 0.85, 1.0] },
      { pos: new THREE.Vector3(-0.9, 7.2, 0.4), size: 1.6, mat: matFoliage1, scale: [1.1, 0.9, 1.0] }
    ];

    for (const c of clusterDefs) {
      const geo = new THREE.DodecahedronGeometry(c.size, 1);
      
      // Sculpt vertices for organic comic clump aesthetic
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const noise = 1.0 + Math.sin(x * 2.2 + z * 1.8) * 0.16 + Math.cos(y * 2.5) * 0.12;
        pos.setXYZ(i, x * noise, y * noise, z * noise);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, c.mat);
      mesh.position.copy(c.pos);
      mesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
      mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    }

    if (options.scale) {
      this.root.scale.setScalar(options.scale);
    }
  }
}
