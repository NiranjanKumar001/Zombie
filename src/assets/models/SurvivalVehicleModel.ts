import * as THREE from 'three';
import { ToonMaterial } from '../../rendering/materials/ToonMaterial';

export interface WheelNodes {
  mesh: THREE.Group;
  tireMesh: THREE.Mesh;
  suspensionArm: THREE.Group;
  shockSpring: THREE.Mesh;
  initialLocalY: number;
}

/**
 * High-Quality Hero Survival Vehicle Asset
 * Rugged 4x4 off-road buggy with roll cage, roof rack, spare tire,
 * front bull bar, articulated suspension wishbones, and knobby tires.
 */
export class SurvivalVehicleModel {
  public root: THREE.Group;
  public chassisGroup: THREE.Group;
  public wheels: WheelNodes[] = [];
  public frontLeftWheel!: WheelNodes;
  public frontRightWheel!: WheelNodes;
  public rearLeftWheel!: WheelNodes;
  public rearRightWheel!: WheelNodes;

  // Separated NPR Materials
  private matBody: ToonMaterial;
  private matStripe: ToonMaterial;
  private matRollCage: ToonMaterial;
  private matWindows: ToonMaterial;
  private matTireRubber: ToonMaterial;
  private matRims: ToonMaterial;
  private matSuspensionSteel: ToonMaterial;
  private matHeadlights: ToonMaterial;
  private matTaillights: ToonMaterial;
  private matCargoOlive: ToonMaterial;
  private matJerryCan: ToonMaterial;

  constructor() {
    this.root = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.root.add(this.chassisGroup);

    // Initialize stylized materials
    this.matBody = new ToonMaterial({ color: '#c0362b', hatchIntensity: 0.3 });
    this.matStripe = new ToonMaterial({ color: '#e67e22', hatchIntensity: 0.2 });
    this.matRollCage = new ToonMaterial({ color: '#272d3b', hatchIntensity: 0.4 });
    this.matWindows = new ToonMaterial({ color: '#162233', hatchIntensity: 0.15 });
    this.matTireRubber = new ToonMaterial({ color: '#1c2029', hatchIntensity: 0.45 });
    this.matRims = new ToonMaterial({ color: '#7f8c8d', hatchIntensity: 0.2 });
    this.matSuspensionSteel = new ToonMaterial({ color: '#4a5568', hatchIntensity: 0.35 });
    this.matHeadlights = new ToonMaterial({ color: '#fef1a7', hatchIntensity: 0.05 });
    this.matTaillights = new ToonMaterial({ color: '#ff2a2a', hatchIntensity: 0.1 });
    this.matCargoOlive = new ToonMaterial({ color: '#445b3a', hatchIntensity: 0.35 });
    this.matJerryCan = new ToonMaterial({ color: '#b33927', hatchIntensity: 0.3 });

    this.buildChassis();
    this.buildCabinAndRollCage();
    this.buildRoofRackAndGear();
    this.buildFrontBumperAndGrille();
    this.buildLights();
    this.buildExhaustAndRear();
    this.buildWheelsAndSuspension();

    // Enable shadows on all parts
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  /**
   * Main sculpted aerodynamic/faceted lower chassis
   */
  private buildChassis() {
    // 1. Lower tub / skid plate
    const skidGeo = new THREE.BoxGeometry(1.4, 0.2, 3.4);
    const skidMesh = new THREE.Mesh(skidGeo, this.matRollCage);
    skidMesh.position.set(0, 0.45, 0);
    this.chassisGroup.add(skidMesh);

    // 2. Main lower body hull (tapered wedge)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-0.85, -1.6);
    hullShape.lineTo(0.85, -1.6);
    hullShape.lineTo(0.9, 0.8);
    hullShape.lineTo(0.7, 1.7);
    hullShape.lineTo(-0.7, 1.7);
    hullShape.lineTo(-0.9, 0.8);
    hullShape.closePath();

    const hullExtrude = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06
    });
    hullExtrude.rotateX(Math.PI / 2);
    hullExtrude.center();

    const hullMesh = new THREE.Mesh(hullExtrude, this.matBody);
    hullMesh.position.set(0, 0.72, 0);
    this.chassisGroup.add(hullMesh);

    // 3. Flared high-clearance wheel arches / fenders
    const fenderGeo = new THREE.BoxGeometry(0.3, 0.15, 0.9);
    // Front-left
    const flFender = new THREE.Mesh(fenderGeo, this.matRollCage);
    flFender.position.set(-0.95, 0.82, 1.15);
    flFender.rotation.z = 0.2;
    this.chassisGroup.add(flFender);

    // Front-right
    const frFender = flFender.clone();
    frFender.position.x = 0.95;
    frFender.rotation.z = -0.2;
    this.chassisGroup.add(frFender);

    // Rear-left
    const rlFender = new THREE.Mesh(fenderGeo, this.matRollCage);
    rlFender.position.set(-0.95, 0.86, -1.2);
    rlFender.rotation.z = 0.2;
    this.chassisGroup.add(rlFender);

    // Rear-right
    const rrFender = rlFender.clone();
    rrFender.position.x = 0.95;
    rrFender.rotation.z = -0.2;
    this.chassisGroup.add(rrFender);

    // 4. Center hood racing/warning stripes
    const stripeGeo = new THREE.BoxGeometry(0.24, 0.02, 1.1);
    const stripeL = new THREE.Mesh(stripeGeo, this.matStripe);
    stripeL.position.set(-0.16, 0.97, 1.05);
    stripeL.rotation.x = -0.12;
    this.chassisGroup.add(stripeL);

    const stripeR = stripeL.clone();
    stripeR.position.x = 0.16;
    this.chassisGroup.add(stripeR);

    // 5. Hood air intake scoop
    const scoopGeo = new THREE.BoxGeometry(0.44, 0.08, 0.5);
    const scoopMesh = new THREE.Mesh(scoopGeo, this.matRollCage);
    scoopMesh.position.set(0, 1.0, 0.9);
    scoopMesh.rotation.x = -0.15;
    this.chassisGroup.add(scoopMesh);
  }

  /**
   * Cabin cockpit, roll cage bars, windshield, and windows
   */
  private buildCabinAndRollCage() {
    // 1. Angular cockpit cabin volume
    const cabinGeo = new THREE.BoxGeometry(1.3, 0.68, 1.6);
    const cabinMesh = new THREE.Mesh(cabinGeo, this.matBody);
    cabinMesh.position.set(0, 1.18, -0.15);
    this.chassisGroup.add(cabinMesh);

    // 2. Windshield (slanted tinted glass)
    const windshieldGeo = new THREE.PlaneGeometry(1.15, 0.65);
    const windshield = new THREE.Mesh(windshieldGeo, this.matWindows);
    windshield.position.set(0, 1.25, 0.66);
    windshield.rotation.x = -Math.PI / 4.2;
    this.chassisGroup.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.52), this.matWindows);
    rearWindow.position.set(0, 1.25, -0.96);
    rearWindow.rotation.x = Math.PI / 3.8;
    this.chassisGroup.add(rearWindow);

    // Side windows (Left & Right)
    const sideWinGeo = new THREE.PlaneGeometry(1.25, 0.44);
    const leftWin = new THREE.Mesh(sideWinGeo, this.matWindows);
    leftWin.position.set(-0.66, 1.22, -0.15);
    leftWin.rotation.y = -Math.PI / 2;
    this.chassisGroup.add(leftWin);

    const rightWin = leftWin.clone();
    rightWin.position.x = 0.66;
    rightWin.rotation.y = Math.PI / 2;
    this.chassisGroup.add(rightWin);

    // 3. Tubular Roll Cage A-pillars, B-pillars, C-pillars
    const barRadius = 0.038;
    // Front A-pillars
    const aPillarGeo = new THREE.CylinderGeometry(barRadius, barRadius, 0.95, 8);
    const leftAPillar = new THREE.Mesh(aPillarGeo, this.matRollCage);
    leftAPillar.position.set(-0.62, 1.22, 0.58);
    leftAPillar.rotation.x = 0.65;
    leftAPillar.rotation.z = -0.12;
    this.chassisGroup.add(leftAPillar);

    const rightAPillar = leftAPillar.clone();
    rightAPillar.position.x = 0.62;
    rightAPillar.rotation.z = 0.12;
    this.chassisGroup.add(rightAPillar);

    // Rear B/C-pillars
    const leftBPillar = new THREE.Mesh(aPillarGeo, this.matRollCage);
    leftBPillar.position.set(-0.62, 1.22, -0.88);
    leftBPillar.rotation.x = -0.55;
    leftBPillar.rotation.z = -0.12;
    this.chassisGroup.add(leftBPillar);

    const rightBPillar = leftBPillar.clone();
    rightBPillar.position.x = 0.62;
    rightBPillar.rotation.z = 0.12;
    this.chassisGroup.add(rightBPillar);

    // Top horizontal roof bars
    const roofBarGeo = new THREE.CylinderGeometry(barRadius, barRadius, 1.5, 8);
    const leftRoofBar = new THREE.Mesh(roofBarGeo, this.matRollCage);
    leftRoofBar.position.set(-0.62, 1.56, -0.15);
    leftRoofBar.rotation.x = Math.PI / 2;
    this.chassisGroup.add(leftRoofBar);

    const rightRoofBar = leftRoofBar.clone();
    rightRoofBar.position.x = 0.62;
    this.chassisGroup.add(rightRoofBar);

    // Side Rock Sliders / Steps
    const stepGeo = new THREE.BoxGeometry(0.12, 0.05, 1.8);
    const leftStep = new THREE.Mesh(stepGeo, this.matRollCage);
    leftStep.position.set(-0.9, 0.52, -0.1);
    this.chassisGroup.add(leftStep);

    const rightStep = leftStep.clone();
    rightStep.position.x = 0.9;
    this.chassisGroup.add(rightStep);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.12, 0.1, 0.16);
    const leftMirror = new THREE.Mesh(mirrorGeo, this.matRollCage);
    leftMirror.position.set(-0.78, 1.15, 0.52);
    this.chassisGroup.add(leftMirror);

    const rightMirror = leftMirror.clone();
    rightMirror.position.x = 0.78;
    this.chassisGroup.add(rightMirror);
  }

  /**
   * Roof rack basket with spare knobby wheel and survival equipment
   */
  private buildRoofRackAndGear() {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0, 1.62, -0.2);

    // Basket Frame
    const frameMat = this.matRollCage;
    const rGeo = new THREE.BoxGeometry(1.2, 0.08, 1.4);
    const bottomMesh = new THREE.Mesh(rGeo, frameMat);
    rackGroup.add(bottomMesh);

    // Side rails
    const railXGeo = new THREE.BoxGeometry(0.04, 0.16, 1.4);
    const railL = new THREE.Mesh(railXGeo, frameMat);
    railL.position.set(-0.58, 0.1, 0);
    rackGroup.add(railL);

    const railR = railL.clone();
    railR.position.x = 0.58;
    rackGroup.add(railR);

    // Spare Wheel on Roof Rack (full fidelity!)
    const spareGroup = this.createWheelMesh(0.42, 0.24);
    spareGroup.rotation.x = Math.PI / 2;
    spareGroup.position.set(-0.18, 0.22, 0.15);
    rackGroup.add(spareGroup);

    // Heavy duty survival cargo crate
    const crateGeo = new THREE.BoxGeometry(0.48, 0.32, 0.55);
    const crate = new THREE.Mesh(crateGeo, this.matCargoOlive);
    crate.position.set(0.3, 0.22, -0.25);
    crate.rotation.y = 0.08;
    rackGroup.add(crate);

    // Steel Jerry can (fuel container)
    const canGeo = new THREE.BoxGeometry(0.2, 0.38, 0.32);
    const jerryCan = new THREE.Mesh(canGeo, this.matJerryCan);
    jerryCan.position.set(0.32, 0.25, 0.35);
    rackGroup.add(jerryCan);

    this.chassisGroup.add(rackGroup);
  }

  /**
   * Reinforced front bull bar, steel bumper, tow shackles, protective wire grille
   */
  private buildFrontBumperAndGrille() {
    // 1. Heavy front steel bumper
    const bumperGeo = new THREE.BoxGeometry(1.8, 0.22, 0.35);
    const bumper = new THREE.Mesh(bumperGeo, this.matRollCage);
    bumper.position.set(0, 0.56, 1.82);
    this.chassisGroup.add(bumper);

    // 2. Tubular Bull Bar / Grille Guard
    const bullBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.2, 8),
      this.matRollCage
    );
    bullBar.position.set(0, 0.88, 1.88);
    bullBar.rotation.z = Math.PI / 2;
    this.chassisGroup.add(bullBar);

    // Uprights
    const uprightGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8);
    const upL = new THREE.Mesh(uprightGeo, this.matRollCage);
    upL.position.set(-0.45, 0.74, 1.86);
    this.chassisGroup.add(upL);

    const upR = upL.clone();
    upR.position.x = 0.45;
    this.chassisGroup.add(upR);

    // Tow Shackles (red D-rings)
    const ringGeo = new THREE.TorusGeometry(0.06, 0.02, 6, 12);
    const ringL = new THREE.Mesh(ringGeo, this.matJerryCan);
    ringL.position.set(-0.55, 0.48, 2.0);
    this.chassisGroup.add(ringL);

    const ringR = ringL.clone();
    ringR.position.x = 0.55;
    this.chassisGroup.add(ringR);

    // Front Grille Slats
    const grilleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.3, 0.05),
      this.matRollCage
    );
    grilleMesh.position.set(0, 0.78, 1.74);
    this.chassisGroup.add(grilleMesh);
  }

  /**
   * Headlights, roof light bar, and tail lamps
   */
  private buildLights() {
    // 1. Dual rally pod headlights
    const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    podGeo.rotateX(Math.PI / 2);

    const leftLight = new THREE.Mesh(podGeo, this.matHeadlights);
    leftLight.position.set(-0.58, 0.82, 1.72);
    this.chassisGroup.add(leftLight);

    const rightLight = leftLight.clone();
    rightLight.position.x = 0.58;
    this.chassisGroup.add(rightLight);

    // 2. Roof LED Light Bar
    const barGeo = new THREE.BoxGeometry(0.95, 0.09, 0.12);
    const lightBarHousing = new THREE.Mesh(barGeo, this.matRollCage);
    lightBarHousing.position.set(0, 1.62, 0.6);
    this.chassisGroup.add(lightBarHousing);

    const ledsMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.04, 0.02),
      this.matHeadlights
    );
    ledsMesh.position.set(0, 1.62, 0.67);
    this.chassisGroup.add(ledsMesh);

    // 3. Rear Tail Light Pods (Crimson red)
    const tailGeo = new THREE.BoxGeometry(0.26, 0.12, 0.06);
    const leftTail = new THREE.Mesh(tailGeo, this.matTaillights);
    leftTail.position.set(-0.68, 0.84, -1.68);
    this.chassisGroup.add(leftTail);

    const rightTail = leftTail.clone();
    rightTail.position.x = 0.68;
    this.chassisGroup.add(rightTail);
  }

  /**
   * Dual exhaust tips and rear plate
   */
  private buildExhaustAndRear() {
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8);
    exhaustGeo.rotateX(Math.PI / 2);

    const exhaustL = new THREE.Mesh(exhaustGeo, this.matSuspensionSteel);
    exhaustL.position.set(-0.45, 0.44, -1.72);
    this.chassisGroup.add(exhaustL);

    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.45;
    this.chassisGroup.add(exhaustR);
  }

  /**
   * Helper to build a high-detail knobby wheel:
   * - Rounded rim with spokes and central hub
   * - Chunky rubber tire with 16 tread lugs
   * - Ventilated brake disc
   */
  public createWheelMesh(radius = 0.46, width = 0.28): THREE.Group {
    const wheelGroup = new THREE.Group();

    // 1. Tire Main Donut
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, this.matTireRubber);
    wheelGroup.add(tireMesh);

    // 2. Chunky Off-Road Tread Lugs around circumference
    const lugCount = 14;
    const lugGeo = new THREE.BoxGeometry(width * 1.05, 0.05, 0.08);
    for (let i = 0; i < lugCount; i++) {
      const angle = (i / lugCount) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, this.matTireRubber);
      lug.position.set(
        0,
        Math.cos(angle) * (radius * 0.98),
        Math.sin(angle) * (radius * 0.98)
      );
      lug.rotation.x = -angle;
      wheelGroup.add(lug);
    }

    // 3. Deep-Dish Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width * 0.9, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, this.matRims);
    wheelGroup.add(rimMesh);

    // Rim Spoke Ring
    const spokeRingGeo = new THREE.TorusGeometry(radius * 0.42, 0.03, 6, 12);
    spokeRingGeo.rotateY(Math.PI / 2);
    const spokeRing = new THREE.Mesh(spokeRingGeo, this.matRollCage);
    wheelGroup.add(spokeRing);

    // 4. Brake Disc & Red Caliper (visible behind rim)
    const discGeo = new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, 0.03, 16);
    discGeo.rotateZ(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, this.matSuspensionSteel);
    wheelGroup.add(discMesh);

    const caliperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.16),
      this.matTaillights
    );
    caliperMesh.position.set(0, radius * 0.32, 0);
    wheelGroup.add(caliperMesh);

    return wheelGroup;
  }

  /**
   * Construct 4 independent wheel assemblies with wishbone suspension arms and coil springs
   */
  private buildWheelsAndSuspension() {
    const wheelPositions = [
      { name: 'FL', x: -1.05, y: 0.46, z: 1.15, isFront: true, isLeft: true },
      { name: 'FR', x: 1.05, y: 0.46, z: 1.15, isFront: true, isLeft: false },
      { name: 'RL', x: -1.05, y: 0.46, z: -1.18, isFront: false, isLeft: true },
      { name: 'RR', x: 1.05, y: 0.46, z: -1.18, isFront: false, isLeft: false }
    ];

    for (const p of wheelPositions) {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(p.x, p.y, p.z);

      // Wheel visual group (for spinning and steering)
      const wheelVisual = this.createWheelMesh(0.46, 0.28);
      wheelAssembly.add(wheelVisual);

      // Articulated Double Wishbone Suspension Linkage
      const armGroup = new THREE.Group();
      const armLength = 0.55;
      const armGeo = new THREE.CylinderGeometry(0.024, 0.024, armLength, 6);
      armGeo.rotateZ(Math.PI / 2);

      const upperArm = new THREE.Mesh(armGeo, this.matSuspensionSteel);
      upperArm.position.set(p.isLeft ? armLength / 2 : -armLength / 2, 0.15, 0);
      armGroup.add(upperArm);

      const lowerArm = new THREE.Mesh(armGeo, this.matSuspensionSteel);
      lowerArm.position.set(p.isLeft ? armLength / 2 : -armLength / 2, -0.05, 0);
      armGroup.add(lowerArm);

      // Coilover Shock Damper
      const shockGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.45, 8);
      const shockSpring = new THREE.Mesh(shockGeo, this.matStripe); // Accent color spring
      shockSpring.position.set(p.isLeft ? 0.22 : -0.22, 0.12, 0);
      shockSpring.rotation.z = p.isLeft ? -0.35 : 0.35;
      armGroup.add(shockSpring);

      wheelAssembly.add(armGroup);
      this.root.add(wheelAssembly);

      const node: WheelNodes = {
        mesh: wheelAssembly,
        tireMesh: wheelVisual.children[0] as THREE.Mesh,
        suspensionArm: armGroup,
        shockSpring,
        initialLocalY: p.y
      };

      this.wheels.push(node);
      if (p.name === 'FL') this.frontLeftWheel = node;
      if (p.name === 'FR') this.frontRightWheel = node;
      if (p.name === 'RL') this.rearLeftWheel = node;
      if (p.name === 'RR') this.rearRightWheel = node;
    }
  }

  /**
   * Update visual pose: steer angle, spin angle, suspension compression, chassis roll & pitch
   */
  public updateVisuals(
    steerAngle: number,
    wheelSpinAngle: number,
    compressions: [number, number, number, number], // FL, FR, RL, RR in meters (-0.15 to +0.15)
    bodyRoll: number,
    bodyPitch: number
  ) {
    // 1. Chassis rests aligned with root orientation (pitch and roll are carried by root)
    this.chassisGroup.rotation.z = bodyRoll * 0.15; // Subtle secondary suspension roll
    this.chassisGroup.rotation.x = bodyPitch * 0.15; // Subtle secondary suspension pitch

    // 2. Wheels steering & suspension vertical travel
    const nodes = [this.frontLeftWheel, this.frontRightWheel, this.rearLeftWheel, this.rearRightWheel];
    for (let i = 0; i < 4; i++) {
      const node = nodes[i];
      const comp = compressions[i];

      // Physical vertical movement of wheel relative to chassis
      node.mesh.position.y = node.initialLocalY + comp;

      // Wheel visual rotation
      const wheelVisual = node.mesh.children[0] as THREE.Group;
      wheelVisual.rotation.x = wheelSpinAngle;

      // Front wheels steering
      if (i < 2) {
        node.mesh.rotation.y = steerAngle;
      }

      // Shock spring scale compression
      const springCompFactor = Math.max(0.6, Math.min(1.4, 1.0 - comp * 2.0));
      node.shockSpring.scale.set(1.0, springCompFactor, 1.0);
    }
  }
}
