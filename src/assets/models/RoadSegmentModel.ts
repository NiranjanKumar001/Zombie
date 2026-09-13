import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';
import { TextureFactory } from '../../rendering/materials/TextureFactory';

export interface RoadOptions {
  length?: number;
  width?: number;
  hasMarkings?: boolean;
  hasCrosswalk?: boolean;
}

/**
 * High-Quality 3D Road Segment Asset
 * Features:
 * - Crowned/cambered asphalt surface (subtle curve from center to gutters)
 * - Raised stone curbs and textured cobblestone/dirt shoulder transitions
 * - Dashed center line markings and solid outer boundary lines
 * - Optional crosswalk striping
 */
export class RoadSegmentModel {
  public root: THREE.Group;

  constructor(options: RoadOptions = {}) {
    this.root = new THREE.Group();

    const roadLen = options.length ?? 60.0;
    const roadWidth = options.width ?? 9.0;
    const hasMarkings = options.hasMarkings ?? true;
    const hasCrosswalk = options.hasCrosswalk ?? false;

    // Materials
    const matAsphalt = new ToonMaterial({
      color: '#b25d35', // Warm terracotta / sun-baked asphalt
      hatchIntensity: 0.3
    });
    const matCurb = new ToonMaterial({
      color: '#5c412f', // Stone curb / shoulder gutter
      hatchIntensity: 0.4
    });
    const matShoulder = new ToonMaterial({
      color: '#4a3525', // Crushed gravel / dirt transition
      hatchIntensity: 0.45
    });
    const matMarking = new ToonMaterial({
      color: '#f0ebd8', // Painted off-white line
      hatchIntensity: 0.1
    });

    // 1. Crowned Asphalt Road Mesh (Curved cross-section with 7 subdivisions)
    const segmentsX = 8;
    const segmentsZ = Math.floor(roadLen / 2);
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLen, segmentsX, segmentsZ);
    roadGeo.rotateX(-Math.PI / 2);

    // Apply crown curvature (highest in center, sloping down ~0.12m toward gutters)
    const pos = roadGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedX = (x / (roadWidth / 2));
      const crown = (1.0 - normalizedX * normalizedX) * 0.12;
      pos.setY(i, crown);
    }
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, matAsphalt);
    roadMesh.receiveShadow = true;
    this.root.add(roadMesh);

    // 2. Raised Curbs (Left & Right)
    const curbWidth = 0.45;
    const curbHeight = 0.22;
    const curbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, roadLen);

    const curbLeft = new THREE.Mesh(curbGeo, matCurb);
    curbLeft.position.set(-roadWidth / 2 - curbWidth / 2, curbHeight / 2 - 0.04, 0);
    curbLeft.receiveShadow = true;
    curbLeft.castShadow = true;
    this.root.add(curbLeft);

    const curbRight = new THREE.Mesh(curbGeo, matCurb);
    curbRight.position.set(roadWidth / 2 + curbWidth / 2, curbHeight / 2 - 0.04, 0);
    curbRight.receiveShadow = true;
    curbRight.castShadow = true;
    this.root.add(curbRight);

    // 3. Dirt / Gravel Shoulders (Transition into landscape terrain)
    const shoulderWidth = 2.4;
    const shoulderGeo = new THREE.BoxGeometry(shoulderWidth, 0.12, roadLen);

    const shoulderLeft = new THREE.Mesh(shoulderGeo, matShoulder);
    shoulderLeft.position.set(-roadWidth / 2 - curbWidth - shoulderWidth / 2, 0.02, 0);
    shoulderLeft.receiveShadow = true;
    this.root.add(shoulderLeft);

    const shoulderRight = new THREE.Mesh(shoulderGeo, matShoulder);
    shoulderRight.position.set(roadWidth / 2 + curbWidth + shoulderWidth / 2, 0.02, 0);
    shoulderRight.receiveShadow = true;
    this.root.add(shoulderRight);

    // 4. Road Markings
    if (hasMarkings) {
      // Solid outer boundary lines (White)
      const lineThickness = 0.18;
      const edgeLineOffset = roadWidth / 2 - 0.6;
      const edgeLineGeo = new THREE.PlaneGeometry(lineThickness, roadLen);
      edgeLineGeo.rotateX(-Math.PI / 2);

      const edgeLineL = new THREE.Mesh(edgeLineGeo, matMarking);
      edgeLineL.position.set(-edgeLineOffset, 0.05, 0);
      this.root.add(edgeLineL);

      const edgeLineR = new THREE.Mesh(edgeLineGeo, matMarking);
      edgeLineR.position.set(edgeLineOffset, 0.05, 0);
      this.root.add(edgeLineR);

      // Dashed center line markings (4m stripe, 3m gap)
      const dashLen = 3.5;
      const gapLen = 2.5;
      const dashCount = Math.floor(roadLen / (dashLen + gapLen));
      const dashGeo = new THREE.PlaneGeometry(0.24, dashLen);
      dashGeo.rotateX(-Math.PI / 2);

      for (let d = 0; d < dashCount; d++) {
        const dashMesh = new THREE.Mesh(dashGeo, matMarking);
        const z = -roadLen / 2 + (d + 0.5) * (dashLen + gapLen);
        dashMesh.position.set(0, 0.128, z); // Sits right on road crown
        this.root.add(dashMesh);
      }
    }

    // 5. Optional Pedestrian Crosswalk
    if (hasCrosswalk) {
      const stripeW = 0.65;
      const stripeL = 3.8;
      const stripeGeo = new THREE.PlaneGeometry(stripeW, stripeL);
      stripeGeo.rotateX(-Math.PI / 2);

      const crosswalkCount = 7;
      for (let c = 0; c < crosswalkCount; c++) {
        const x = -roadWidth / 2 + 1.2 + c * 1.1;
        const cwMesh = new THREE.Mesh(stripeGeo, matMarking);
        cwMesh.position.set(x, 0.09, roadLen * 0.35);
        this.root.add(cwMesh);
      }
    }
  }
}
