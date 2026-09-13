import * as THREE from 'three';
import { TerrainSceneModel } from '../../assets/models/TerrainSceneModel';
import { RoadSegmentModel } from '../../assets/models/RoadSegmentModel';
import { CliffRockModel } from '../../assets/models/CliffRockModel';
import { PineTreeModel } from '../../assets/models/PineTreeModel';
import { BroadleafTreeModel } from '../../assets/models/BroadleafTreeModel';
import { BuildingModel } from '../../assets/models/BuildingModel';
import { SurvivalVehicleModel } from '../../assets/models/SurvivalVehicleModel';
import { ArcadeRaycastPhysics } from '../physics/ArcadeRaycastPhysics';
import { AtmosphereEffects } from '../../rendering/atmosphere/AtmosphereEffects';

/**
 * Visual Quality Test Scene
 * Assembles the foundational quality gate assets in an art-directed composition:
 * - 1 3D Road segment (camber, curbs, dashed markings, crosswalk)
 * - 1 3D Sculpted Terrain section (rolling hills, dirt/grass blend)
 * - 1 Stratified Cliff formation (sedimentary shelves & cracks)
 * - 1 Sculpted Pine tree (tapered trunk & 5-tier foliage clusters)
 * - 1 Sculpted Broadleaf tree (forked boughs & magenta flowering canopy)
 * - 1 Faceted Rock boulder (sharp comic planes)
 * - 1 Architectural Building (alpine cottage, pitched roof, illuminated windows, chimney)
 * - 1 Hero Survival Vehicle (4x4 off-road buggy with roll cage, roof rack & suspension)
 */
export class VisualTestScene {
  public scene: THREE.Scene;
  public terrain: TerrainSceneModel;
  public road: RoadSegmentModel;
  public cliff: CliffRockModel;
  public pineTree: PineTreeModel;
  public broadleafTree: BroadleafTreeModel;
  public boulder: THREE.Mesh;
  public building: BuildingModel;
  public vehicleModel: SurvivalVehicleModel;
  public physics: ArcadeRaycastPhysics;
  public atmosphere: AtmosphereEffects;

  constructor() {
    this.scene = new THREE.Scene();
    this.physics = new ArcadeRaycastPhysics();

    // 1. Terrain
    this.terrain = new TerrainSceneModel(140, 140, 70);
    this.scene.add(this.terrain.root);

    // 2. Road Segment (Center corridor z = -35 to +35)
    this.road = new RoadSegmentModel({ length: 80, width: 9.2, hasMarkings: true, hasCrosswalk: true });
    this.road.root.position.set(0, 0.02, 0);
    this.scene.add(this.road.root);

    // 3. Sculpted Pine Tree (Along right road verge at x = 7.0, z = -12)
    this.pineTree = new PineTreeModel();
    const pineY = this.terrain.getHeightAt(7.0, -12);
    this.pineTree.root.position.set(7.0, pineY, -12);
    this.scene.add(this.pineTree.root);

    // 4. Sculpted Flowering Broadleaf Tree (Along left road verge at x = -7.5, z = -6)
    this.broadleafTree = new BroadleafTreeModel({ isFlowering: true, scale: 1.15 });
    const broadleafY = this.terrain.getHeightAt(-7.5, -6);
    this.broadleafTree.root.position.set(-7.5, broadleafY, -6);
    this.scene.add(this.broadleafTree.root);

    // 5. Faceted Rock Boulder (Right roadside corner at x = 6.0, z = 2)
    this.boulder = CliffRockModel.createFacetedBoulder(1.8);
    const boulderY = this.terrain.getHeightAt(6.0, 2);
    this.boulder.position.set(6.0, boulderY + 0.6, 2);
    this.scene.add(this.boulder);

    // 6. Stratified Rock Cliff (Towering eastern bluff along road at x = 12.0, z = 10)
    this.cliff = new CliffRockModel();
    const cliffY = this.terrain.getHeightAt(12.0, 10);
    this.cliff.root.position.set(12.0, cliffY, 10);
    this.cliff.root.rotation.y = -0.32;
    this.scene.add(this.cliff.root);

    // 7. Architectural Building (Elevated western terrace at x = -12.5, z = 6)
    this.building = new BuildingModel();
    const bldgY = this.terrain.getHeightAt(-12.5, 6);
    this.building.root.position.set(-12.5, bldgY - 0.8, 6);
    this.building.root.rotation.y = Math.PI / 4.0;
    this.scene.add(this.building.root);

    // 8. Hero Survival Vehicle
    this.vehicleModel = new SurvivalVehicleModel();
    this.scene.add(this.vehicleModel.root);

    // 9. Atmospheric Effects (Falling leaves)
    this.atmosphere = new AtmosphereEffects();
    this.scene.add(this.atmosphere.root);
  }

  public update(dt: number) {
    // Synchronize Vehicle Visual with Vehicle Physics
    this.vehicleModel.root.position.copy(this.physics.position);
    this.vehicleModel.root.rotation.set(0, this.physics.yaw, 0);

    const compressions: [number, number, number, number] = [
      this.physics.wheels[0].compression,
      this.physics.wheels[1].compression,
      this.physics.wheels[2].compression,
      this.physics.wheels[3].compression
    ];

    this.vehicleModel.updateVisuals(
      this.physics.steerAngle,
      this.physics.wheelSpinAngle,
      compressions,
      this.physics.chassisRoll,
      this.physics.chassisPitch
    );

    // Update atmospheric drifting leaves
    this.atmosphere.update(dt, this.physics.position);
  }
}
