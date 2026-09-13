import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

/**
 * High-Quality Sculpted Stylized Pine Tree Asset
 * Features an organic tapered timber trunk with exposed branch knuckles,
 * 5 staggered tiers of sculpted foliage masses with jagged silhouettes,
 * and multi-tone forest greens.
 */
export class PineTreeModel {
  public root: THREE.Group;

  constructor() {
    this.root = new THREE.Group();

    const matTrunk = new ToonMaterial({ color: '#544133', hatchIntensity: 0.45 });
    const matFoliagePrimary = new ToonMaterial({ color: '#2b5239', hatchIntensity: 0.35 });
    const matFoliageSecondary = new ToonMaterial({ color: '#386948', hatchIntensity: 0.25 });
    const matFoliageDark = new ToonMaterial({ color: '#1c3826', hatchIntensity: 0.5 });

    // 1. Tapered Timber Trunk with natural curvature & root flare
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, 2.5, 0.05),
      new THREE.Vector3(-0.06, 5.0, -0.04),
      new THREE.Vector3(0.04, 7.5, 0.02),
      new THREE.Vector3(0, 9.8, 0)
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.45, 8, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, matTrunk);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.root.add(trunkMesh);

    // Root buttresses at base
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2 + 0.3;
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * 0.3, 0.6, Math.sin(angle) * 0.3),
        new THREE.Vector3(Math.cos(angle) * 0.85, 0.1, Math.sin(angle) * 0.85),
        new THREE.Vector3(Math.cos(angle) * 1.3, 0.0, Math.sin(angle) * 1.3)
      ]);
      const rootMesh = new THREE.Mesh(
        new THREE.TubeGeometry(rootCurve, 8, 0.18, 6, false),
        matTrunk
      );
      rootMesh.castShadow = true;
      this.root.add(rootMesh);
    }

    // 2. Multi-tier Sculpted Foliage Clusters (5 ascending tiers)
    // Tier specifications: height, radius, cluster count, materials
    const tiers = [
      { y: 3.2, radius: 2.4, count: 7, heightScale: 0.7, mat: matFoliageDark },
      { y: 4.8, radius: 2.1, count: 6, heightScale: 0.65, mat: matFoliagePrimary },
      { y: 6.4, radius: 1.7, count: 5, heightScale: 0.6, mat: matFoliageSecondary },
      { y: 7.9, radius: 1.3, count: 4, heightScale: 0.55, mat: matFoliagePrimary },
      { y: 9.2, radius: 0.8, count: 3, heightScale: 0.8, mat: matFoliageSecondary }
    ];

    for (let t = 0; t < tiers.length; t++) {
      const tier = tiers[t];
      const tierGroup = new THREE.Group();
      tierGroup.position.y = tier.y;

      // Primary radiating branches supporting the foliage
      for (let b = 0; b < tier.count; b++) {
        const angle = (b / tier.count) * Math.PI * 2 + (t * 0.6);
        const branchLen = tier.radius * 0.85;

        // Timber branch arm
        const branchGeo = new THREE.CylinderGeometry(0.04, 0.1, branchLen, 5);
        branchGeo.rotateZ(Math.PI / 2);
        const branchMesh = new THREE.Mesh(branchGeo, matTrunk);
        branchMesh.position.set(
          (Math.cos(angle) * branchLen) / 2,
          -0.1,
          (Math.sin(angle) * branchLen) / 2
        );
        branchMesh.rotation.y = -angle;
        branchMesh.rotation.z = -0.18; // Downward pine sag
        branchMesh.castShadow = true;
        tierGroup.add(branchMesh);

        // Sculpted foliage cluster (Irregular faceted icosahedron / dodecahedron)
        const clusterR = 0.75 + (tier.radius * 0.25);
        const clusterGeo = new THREE.IcosahedronGeometry(clusterR, 1);
        
        // Jitter vertices slightly for hand-drawn organic silhouette
        const pos = clusterGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);
          const deform = 1.0 + Math.sin(vx * 3 + vy * 2) * 0.18;
          pos.setXYZ(i, vx * deform, vy * (deform * 0.85), vz * deform);
        }
        clusterGeo.computeVertexNormals();

        const clusterMesh = new THREE.Mesh(clusterGeo, tier.mat);
        clusterMesh.position.set(
          Math.cos(angle) * tier.radius,
          (Math.random() - 0.5) * 0.2,
          Math.sin(angle) * tier.radius
        );
        clusterMesh.scale.set(1.2, tier.heightScale, 1.0);
        clusterMesh.rotation.set(Math.random() * 0.4, angle, (Math.random() - 0.5) * 0.3);
        clusterMesh.castShadow = true;
        clusterMesh.receiveShadow = true;
        tierGroup.add(clusterMesh);
      }

      this.root.add(tierGroup);
    }

    // Top conical crown leader
    const crownGeo = new THREE.ConeGeometry(0.7, 1.8, 7);
    const crownMesh = new THREE.Mesh(crownGeo, matFoliageSecondary);
    crownMesh.position.y = 10.3;
    crownMesh.castShadow = true;
    this.root.add(crownMesh);
  }
}
