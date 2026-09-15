import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

/**
 * High-Detail Procedural 3D Asset Generators for Phase 2B World Building.
 * Creates organic silhouettes, layered foliage masses, detailed architecture, and sharp rock fractures.
 */

// Colors matching ART_DIRECTION.md
const PALETTE = {
  PINE_TRUNK: 0x4a3525,
  PINE_LEAF: 0x1f4728,
  OAK_TRUNK: 0x5a3e2b,
  OAK_LEAF: 0x8a385c, // Flowering magenta/pink/mauve
  OAK_LEAF_BG: 0x2b4c32, // Deep forest green sub-leaf
  ROCK_DARK: 0x5a6375,
  ROCK_LIGHT: 0x7e889b,
  CLIFF_BASE: 0x444b58,
  ROOF_TILE: 0xa84332, // Terracotta red roof
  WALL_TIMBER: 0x3d2b1f,
  WALL_PLASTER: 0xded2c1,
  WINDOW_AMBER: 0xffb733,
  WOOD_POST: 0x6e5239,
  METAL_SIGN: 0xd6dbdf,
  GRASS_GREEN: 0x3b6e3d,
  BUSH_GREEN: 0x2b5730
};

/** 1. Multi-Tier Sculpted Pine Tree with Root Flare & Layered Foliage */
export function createPineTreeHero(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PineTreeHero';

  // Trunk with flared root base
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.75, 7.5, 8);
  const trunkMat = new ToonMaterial({ color: PALETTE.PINE_TRUNK });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3.75;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Root flares
  for (let i = 0; i < 4; i++) {
    const rootGeo = new THREE.CylinderGeometry(0.1, 0.4, 1.8, 5);
    const root = new THREE.Mesh(rootGeo, trunkMat);
    const angle = (i / 4) * Math.PI * 2;
    root.position.set(Math.cos(angle) * 0.6, 0.6, Math.sin(angle) * 0.6);
    root.rotation.z = Math.PI / 6;
    root.rotation.y = angle;
    group.add(root);
  }

  // 5 Tiered foliage crowns (ascending radius & height)
  const tierHeights = [3.2, 5.0, 6.8, 8.4, 9.8];
  const tierRadii = [2.6, 2.2, 1.7, 1.2, 0.6];
  const foliageMat = new ToonMaterial({ color: PALETTE.PINE_LEAF });

  tierHeights.forEach((y, i) => {
    const r = tierRadii[i];
    const coneGeo = new THREE.ConeGeometry(r, 2.2, 7);
    const cone = new THREE.Mesh(coneGeo, foliageMat);
    cone.position.y = y;
    cone.rotation.y = i * 0.7; // Rotate tiers for organic silhouette
    cone.scale.set(1.0 + Math.sin(i) * 0.1, 1.0, 1.0 + Math.cos(i) * 0.1);
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
  });

  return group;
}

/** 2. Organic Broadleaf Oak Tree with Curved Trunk & Flowering Canopy */
export function createOakTreeHero(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OakTreeHero';

  const trunkMat = new ToonMaterial({ color: PALETTE.OAK_TRUNK });
  const leafMat = new ToonMaterial({ color: PALETTE.OAK_LEAF });

  // Main curved trunk
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 6.0, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 3, 0);
  trunk.rotation.z = -0.12;
  trunk.castShadow = true;
  group.add(trunk);

  // Scaffold branches
  const branchData = [
    { pos: [0.6, 5.0, 0.4], rot: [0.3, 0.5, -0.4], scale: [0.35, 3.0, 0.35] },
    { pos: [-0.6, 4.8, -0.3], rot: [-0.2, -0.8, 0.5], scale: [0.3, 2.5, 0.3] },
    { pos: [0.1, 5.5, -0.5], rot: [0.5, 2.1, 0.2], scale: [0.28, 2.2, 0.28] }
  ];

  branchData.forEach((b) => {
    const geo = new THREE.CylinderGeometry(b.scale[0] * 0.7, b.scale[0], b.scale[1], 6);
    const mesh = new THREE.Mesh(geo, trunkMat);
    mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
    mesh.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
    group.add(mesh);
  });

  // Layered Voluminous Canopy Masses
  const canopyPositions = [
    { pos: [0, 7.8, 0], scale: [3.2, 2.6, 3.2] },
    { pos: [1.8, 6.5, 1.2], scale: [2.4, 2.0, 2.4] },
    { pos: [-1.6, 6.2, -1.0], scale: [2.2, 1.8, 2.2] },
    { pos: [0.5, 6.8, -1.6], scale: [2.3, 1.9, 2.3] }
  ];

  canopyPositions.forEach((c) => {
    const geo = new THREE.DodecahedronGeometry(1.0, 1);
    const mesh = new THREE.Mesh(geo, leafMat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  return group;
}

/** 3. Multi-Faceted Talus Rock Boulder */
export function createTalusBoulder(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TalusBoulder';

  const rockMat = new ToonMaterial({ color: PALETTE.ROCK_DARK });
  const geo = new THREE.DodecahedronGeometry(2.0, 0);

  // Deform vertices for sharp angular faces
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const offset = Math.sin(x * 3.0 + y * 2.0) * 0.35;
    posAttr.setXYZ(i, x + offset, y * 0.8 + offset, z + offset);
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, rockMat);
  mesh.position.y = 1.2;
  mesh.rotation.set(0.4, 0.8, 0.2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

/** 4. Stacked Sedimentary Cliff Segment */
export function createSedimentaryCliff(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SedimentaryCliff';

  const cliffMat = new ToonMaterial({ color: PALETTE.CLIFF_BASE });

  // Stacked horizontal rock shelves
  const shelfCount = 4;
  for (let i = 0; i < shelfCount; i++) {
    const w = 12.0 - i * 1.5;
    const h = 2.2;
    const d = 5.0 - i * 0.8;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, cliffMat);
    mesh.position.set(
      (Math.sin(i * 2.3) - 0.5) * 0.8,
      i * 2.0 + 1.1,
      (Math.cos(i * 1.7) - 0.5) * 0.6
    );
    mesh.rotation.y = (i * 0.15);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

/** 5. Detailed Alpine Cottage Building with Roof Overhang & Porch */
export function createAlpineCottage(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'AlpineCottage';

  const wallMat = new ToonMaterial({ color: PALETTE.WALL_PLASTER });
  const timberMat = new ToonMaterial({ color: PALETTE.WALL_TIMBER });
  const roofMat = new ToonMaterial({ color: PALETTE.ROOF_TILE });
  const windowMat = new ToonMaterial({ color: PALETTE.WINDOW_AMBER });

  // Main House Body (Plaster Walls)
  const bodyGeo = new THREE.BoxGeometry(7.0, 4.2, 5.5);
  const body = new THREE.Mesh(bodyGeo, wallMat);
  body.position.y = 2.1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Timber Frame Beams
  const postGeo = new THREE.BoxGeometry(0.35, 4.3, 0.35);
  [
    [-3.5, 2.15, -2.75],
    [3.5, 2.15, -2.75],
    [-3.5, 2.15, 2.75],
    [3.5, 2.15, 2.75]
  ].forEach((pos) => {
    const post = new THREE.Mesh(postGeo, timberMat);
    post.position.set(pos[0], pos[1], pos[2]);
    group.add(post);
  });

  // Pitched Gabled Roof
  const roofGeo = new THREE.ConeGeometry(5.2, 3.2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 5.6;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.2, 0.9, 1.0);
  roof.castShadow = true;
  group.add(roof);

  // Chimney
  const chimneyGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
  const chimney = new THREE.Mesh(chimneyGeo, timberMat);
  chimney.position.set(2.0, 6.2, 0.8);
  chimney.castShadow = true;
  group.add(chimney);

  // Recessed Glowing Windows
  const windowGeo = new THREE.PlaneGeometry(1.0, 1.2);
  [
    [-1.8, 2.5, 2.76, 0],
    [1.8, 2.5, 2.76, 0],
    [-3.51, 2.5, 0, -Math.PI / 2],
    [3.51, 2.5, 0, Math.PI / 2]
  ].forEach((win) => {
    const wMesh = new THREE.Mesh(windowGeo, windowMat);
    wMesh.position.set(win[0], win[1], win[2]);
    wMesh.rotation.y = win[3];
    group.add(wMesh);
  });

  // Front Porch Doorway
  const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.2);
  const door = new THREE.Mesh(doorGeo, timberMat);
  door.position.set(0, 1.1, 2.78);
  group.add(door);

  return group;
}

/** 6. Wooden Survival Watchtower Outpost */
export function createWatchtowerOutpost(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WatchtowerOutpost';

  const woodMat = new ToonMaterial({ color: PALETTE.WOOD_POST });
  const roofMat = new ToonMaterial({ color: PALETTE.ROOF_TILE });

  // 4 Support Stilts
  const stiltGeo = new THREE.CylinderGeometry(0.18, 0.25, 7.0, 6);
  [
    [-1.6, 3.5, -1.6],
    [1.6, 3.5, -1.6],
    [-1.6, 3.5, 1.6],
    [1.6, 3.5, 1.6]
  ].forEach((pos) => {
    const stilt = new THREE.Mesh(stiltGeo, woodMat);
    stilt.position.set(pos[0], pos[1], pos[2]);
    stilt.castShadow = true;
    group.add(stilt);
  });

  // Observation Deck Platform
  const deckGeo = new THREE.BoxGeometry(4.0, 0.3, 4.0);
  const deck = new THREE.Mesh(deckGeo, woodMat);
  deck.position.y = 7.0;
  deck.castShadow = true;
  group.add(deck);

  // Deck Roof
  const roofGeo = new THREE.ConeGeometry(3.2, 1.6, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 9.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  return group;
}

/** 7. Highway Guardrail & Road Sign Props */
export function createRoadSignProp(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RoadSignProp';

  const woodMat = new ToonMaterial({ color: PALETTE.WOOD_POST });
  const metalMat = new ToonMaterial({ color: PALETTE.METAL_SIGN });

  // Post
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6);
  const post = new THREE.Mesh(postGeo, woodMat);
  post.position.y = 1.2;
  post.castShadow = true;
  group.add(post);

  // Sign Board
  const boardGeo = new THREE.BoxGeometry(1.2, 0.9, 0.06);
  const board = new THREE.Mesh(boardGeo, metalMat);
  board.position.set(0, 1.8, 0.05);
  board.castShadow = true;
  group.add(board);

  return group;
}

/** 8. Decorative Foliage Props (Grass Tuft) */
export function createGrassTuft(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GrassTuft';

  const grassMat = new ToonMaterial({ color: PALETTE.GRASS_GREEN });

  for (let i = 0; i < 5; i++) {
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.8, 3);
    const blade = new THREE.Mesh(bladeGeo, grassMat);
    const angle = (i / 5) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.2, 0.4, Math.sin(angle) * 0.2);
    blade.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(blade);
  }

  return group;
}
