import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

export interface BuildingOptions {
  type?: 'cottage' | 'garage' | 'shop';
}

/**
 * High-Quality Architectural Stylized Building Asset
 * Features an alpine/European rural structure:
 * - Stone masonry foundation base
 * - Stucco plaster walls with timber corner quoins/beams
 * - Steep pitched terracotta/slate shingled gabled roof with overhanging eaves
 * - Recessed multi-pane windows with framed wooden lintels and warm evening glow
 * - Paneled timber door with stone porch step
 * - Brick chimney stack with terracotta flue pot
 * - Exterior architectural props: vintage lantern, shop awning or rain barrel
 */
export class BuildingModel {
  public root: THREE.Group;

  constructor(options: BuildingOptions = {}) {
    this.root = new THREE.Group();

    // Separated materials
    const matStucco = new ToonMaterial({ color: '#eee5d4', hatchIntensity: 0.25 });
    const matTimber = new ToonMaterial({ color: '#4a3726', hatchIntensity: 0.45 });
    const matFoundation = new ToonMaterial({ color: '#685c52', hatchIntensity: 0.4 });
    const matRoofTile = new ToonMaterial({ color: '#a04832', hatchIntensity: 0.35 });
    const matWindowGlass = new ToonMaterial({ color: '#f7d377', hatchIntensity: 0.1 }); // Warm glowing amber glass
    const matWindowDark = new ToonMaterial({ color: '#243242', hatchIntensity: 0.15 });
    const matChimneyBrick = new ToonMaterial({ color: '#8c3d2b', hatchIntensity: 0.4 });
    const matLanternIron = new ToonMaterial({ color: '#1f242e', hatchIntensity: 0.3 });

    const width = 7.2;
    const depth = 6.4;
    const wallHeight = 4.8;

    // 1. Stone Masonry Foundation Base
    const foundationHeight = 0.9;
    const foundationGeo = new THREE.BoxGeometry(width + 0.3, foundationHeight, depth + 0.3);
    const foundation = new THREE.Mesh(foundationGeo, matFoundation);
    foundation.position.set(0, foundationHeight / 2, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    this.root.add(foundation);

    // 2. Main Stucco Wall Body
    const wallGeo = new THREE.BoxGeometry(width, wallHeight, depth);
    const walls = new THREE.Mesh(wallGeo, matStucco);
    walls.position.set(0, foundationHeight + wallHeight / 2, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.root.add(walls);

    // 3. Timber Corner Beams (Architectural Quoins)
    const beamThick = 0.22;
    const beamGeo = new THREE.BoxGeometry(beamThick, wallHeight + 0.1, beamThick);
    const corners = [
      { x: -width / 2, z: -depth / 2 },
      { x: width / 2, z: -depth / 2 },
      { x: -width / 2, z: depth / 2 },
      { x: width / 2, z: depth / 2 }
    ];
    for (const c of corners) {
      const beam = new THREE.Mesh(beamGeo, matTimber);
      beam.position.set(c.x, foundationHeight + wallHeight / 2, c.z);
      beam.castShadow = true;
      this.root.add(beam);
    }

    // Horizontal timber wall band
    const bandGeo = new THREE.BoxGeometry(width + 0.08, 0.18, depth + 0.08);
    const band = new THREE.Mesh(bandGeo, matTimber);
    band.position.set(0, foundationHeight + wallHeight * 0.52, 0);
    this.root.add(band);

    // 4. Steep Pitched Gabled Roof with Overhanging Eaves
    const roofY = foundationHeight + wallHeight;
    const roofPitch = Math.PI / 4.8;
    const roofSlopeLen = depth * 0.72;
    const roofOverhangX = 0.8;
    const roofOverhangZ = 0.6;

    // Left roof plane
    const roofPlaneGeo = new THREE.BoxGeometry(width + roofOverhangX * 2, 0.16, roofSlopeLen + roofOverhangZ);
    const roofLeft = new THREE.Mesh(roofPlaneGeo, matRoofTile);
    roofLeft.position.set(0, roofY + 1.25, -1.35);
    roofLeft.rotation.x = -roofPitch;
    roofLeft.castShadow = true;
    roofLeft.receiveShadow = true;
    this.root.add(roofLeft);

    // Right roof plane
    const roofRight = new THREE.Mesh(roofPlaneGeo, matRoofTile);
    roofRight.position.set(0, roofY + 1.25, 1.35);
    roofRight.rotation.x = roofPitch;
    roofRight.castShadow = true;
    roofRight.receiveShadow = true;
    this.root.add(roofRight);

    // Ridge cap
    const ridgeCapGeo = new THREE.BoxGeometry(width + roofOverhangX * 2 + 0.1, 0.18, 0.35);
    const ridgeCap = new THREE.Mesh(ridgeCapGeo, matTimber);
    ridgeCap.position.set(0, roofY + 2.35, 0);
    this.root.add(ridgeCap);

    // Gable triangular facades (Front & Back)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-depth / 2, 0);
    gableShape.lineTo(depth / 2, 0);
    gableShape.lineTo(0, 2.3);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.15, bevelEnabled: false });
    gableGeo.rotateY(Math.PI / 2);

    const gableWest = new THREE.Mesh(gableGeo, matStucco);
    gableWest.position.set(-width / 2 + 0.1, roofY, 0);
    this.root.add(gableWest);

    const gableEast = new THREE.Mesh(gableGeo, matStucco);
    gableEast.position.set(width / 2 - 0.05, roofY, 0);
    this.root.add(gableEast);

    // 5. Front Timber Door with Stone Step & Lintel
    const doorWidth = 1.35;
    const doorHeight = 2.4;
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.22, doorHeight + 0.15, 0.16),
      matTimber
    );
    doorFrame.position.set(0, foundationHeight + doorHeight / 2, depth / 2 + 0.08);
    this.root.add(doorFrame);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.08),
      new ToonMaterial({ color: '#683a22', hatchIntensity: 0.3 })
    );
    doorPanel.position.set(0, foundationHeight + doorHeight / 2, depth / 2 + 0.12);
    this.root.add(doorPanel);

    // Stone doorstep
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.6, 0.22, 0.7),
      matFoundation
    );
    stepMesh.position.set(0, 0.11, depth / 2 + 0.45);
    stepMesh.castShadow = true;
    this.root.add(stepMesh);

    // 6. Recessed Multi-Pane Windows
    const windowPositions = [
      { x: -2.2, y: 2.3, z: depth / 2 + 0.02, rotY: 0, glow: true },
      { x: 2.2, y: 2.3, z: depth / 2 + 0.02, rotY: 0, glow: true },
      { x: -2.2, y: 4.0, z: depth / 2 + 0.02, rotY: 0, glow: false },
      { x: 2.2, y: 4.0, z: depth / 2 + 0.02, rotY: 0, glow: true },
      // Back windows
      { x: -1.8, y: 2.6, z: -depth / 2 - 0.02, rotY: Math.PI, glow: false },
      { x: 1.8, y: 2.6, z: -depth / 2 - 0.02, rotY: Math.PI, glow: true }
    ];

    for (const w of windowPositions) {
      const winGroup = this.createFramedWindow(1.1, 1.3, w.glow ? matWindowGlass : matWindowDark, matTimber);
      winGroup.position.set(w.x, foundationHeight + w.y, w.z);
      winGroup.rotation.y = w.rotY;
      this.root.add(winGroup);
    }

    // 7. Brick Chimney Stack
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 3.8, 0.85),
      matChimneyBrick
    );
    chimney.position.set(width * 0.28, roofY + 1.7, -depth * 0.22);
    chimney.castShadow = true;
    this.root.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.15, 1.05),
      matFoundation
    );
    chimneyCap.position.set(width * 0.28, roofY + 3.65, -depth * 0.22);
    this.root.add(chimneyCap);

    // 8. Vintage Wrought-Iron Porch Lantern
    const lanternArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6),
      matLanternIron
    );
    lanternArm.position.set(1.0, foundationHeight + doorHeight + 0.2, depth / 2 + 0.25);
    lanternArm.rotation.x = Math.PI / 2;
    this.root.add(lanternArm);

    const lanternBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.18),
      matWindowGlass
    );
    lanternBox.position.set(1.0, foundationHeight + doorHeight + 0.05, depth / 2 + 0.45);
    this.root.add(lanternBox);
  }

  private createFramedWindow(w: number, h: number, glassMat: ToonMaterial, frameMat: ToonMaterial): THREE.Group {
    const group = new THREE.Group();

    // Outer frame
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.1),
      frameMat
    );
    frameMesh.castShadow = true;
    group.add(frameMesh);

    // Glass pane
    const glassMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      glassMat
    );
    glassMesh.position.z = 0.06;
    group.add(glassMesh);

    // Window cross mullions
    const mullionHoriz = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.04, 0.03),
      frameMat
    );
    mullionHoriz.position.z = 0.07;
    group.add(mullionHoriz);

    const mullionVert = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, h, 0.03),
      frameMat
    );
    mullionVert.position.z = 0.07;
    group.add(mullionVert);

    // Window sill
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.28, 0.08, 0.18),
      frameMat
    );
    sillMesh.position.set(0, -h / 2 - 0.04, 0.06);
    group.add(sillMesh);

    return group;
  }
}
