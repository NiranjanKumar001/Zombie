import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

/**
 * High-Quality Sculpted Geological Cliff and Rock Formations
 * Features stratified horizontal sedimentary shelves, sharp planar cleavage faces,
 * crevice insets, and standalone small/medium/large boulders.
 */
export class CliffRockModel {
  public root: THREE.Group;

  constructor() {
    this.root = new THREE.Group();

    const matRockStratum1 = new ToonMaterial({ color: '#825a38', hatchIntensity: 0.45 });
    const matRockStratum2 = new ToonMaterial({ color: '#9e734c', hatchIntensity: 0.35 });
    const matRockDark = new ToonMaterial({ color: '#4a3220', hatchIntensity: 0.55 });
    const matMossLedge = new ToonMaterial({ color: '#4d6935', hatchIntensity: 0.4 });

    // 1. Stratified Cliff Wall (Stacked geological tiers with stepped overhangs)
    const cliffHeight = 16.0;
    const tierCount = 5;
    const tierHeight = cliffHeight / tierCount;

    for (let t = 0; t < tierCount; t++) {
      const tierY = t * tierHeight;
      const tierWidth = 24.0 - t * 1.8;
      const tierDepth = 8.0 + Math.sin(t * 1.4) * 2.5;

      // Planar fractured rock block geometry
      const blockGeo = new THREE.BoxGeometry(tierWidth, tierHeight * 1.15, tierDepth, 4, 3, 3);
      
      // Deform vertices to create geological stratification & shear angles
      const pos = blockGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Sedimentary horizontal fault lines
        const stepOffset = Math.floor((y + tierHeight / 2) / 1.0) * 0.2;
        z += stepOffset + Math.sin(x * 0.4 + t) * 0.6;
        x += Math.sin(y * 0.8 + z * 0.5) * 0.4;

        // Front planar face angular fracturing
        if (z > 0) {
          z += Math.cos(x * 0.6) * 0.5;
        }
        pos.setXYZ(i, x, y, z);
      }
      blockGeo.computeVertexNormals();

      const mat = t % 2 === 0 ? matRockStratum1 : matRockStratum2;
      const tierMesh = new THREE.Mesh(blockGeo, mat);
      tierMesh.position.set(Math.sin(t) * 1.2, tierY + tierHeight / 2, -tierDepth / 2 + Math.cos(t * 0.8) * 1.5);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      this.root.add(tierMesh);

      // Overhang rock shelf ledge with moss/vegetation cap
      if (t > 0 && t < tierCount - 1) {
        const ledgeGeo = new THREE.BoxGeometry(tierWidth * 0.7, 0.4, 1.8);
        const ledgeMesh = new THREE.Mesh(ledgeGeo, matMossLedge);
        ledgeMesh.position.set(0, tierY + tierHeight, 0.4);
        ledgeMesh.castShadow = true;
        ledgeMesh.receiveShadow = true;
        this.root.add(ledgeMesh);
      }
    }

    // 2. Geological Vertical Crevice / Crack Accent
    const creviceGeo = new THREE.BoxGeometry(0.8, cliffHeight * 0.9, 2.5);
    const creviceMesh = new THREE.Mesh(creviceGeo, matRockDark);
    creviceMesh.position.set(2.4, cliffHeight / 2, 0.2);
    creviceMesh.rotation.y = 0.15;
    this.root.add(creviceMesh);

    // 3. Scree / Talus Boulders at Cliff Base
    const talusPositions = [
      { x: -5.5, z: 2.2, r: 1.4, mat: matRockStratum2 },
      { x: -2.8, z: 3.1, r: 0.9, mat: matRockStratum1 },
      { x: 3.6, z: 2.8, r: 1.8, mat: matRockStratum1 },
      { x: 6.2, z: 1.9, r: 1.1, mat: matRockStratum2 }
    ];

    for (const b of talusPositions) {
      const boulder = CliffRockModel.createFacetedBoulder(b.r, b.mat);
      boulder.position.set(b.x, b.r * 0.6, b.z);
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      this.root.add(boulder);
    }
  }

  /**
   * Helper to create a standalone faceted rock (Small, Medium, Large)
   */
  public static createFacetedBoulder(radius: number, material?: ToonMaterial): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = 0.85 + Math.sin(x * 3.0 + z * 2.0) * 0.2 + (Math.random() - 0.5) * 0.1;
      pos.setXYZ(i, x * noise, y * (noise * 0.8), z * noise);
    }
    geo.computeVertexNormals();

    const mat = material || new ToonMaterial({ color: '#886240', hatchIntensity: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
