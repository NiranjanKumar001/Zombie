import * as THREE from 'three';
import { ToonMaterial } from '../materials/ToonMaterial';
import { LIGHTING_CONFIG } from '../../game/world/WorldConfig';

/**
 * Stylized Environment (Phase 3 Part 3):
 * - One unified global lighting system with consistent sun direction and lifted ambient fill
 * - Anime-inspired sky dome (1200m radius) seamlessly blended into horizon atmospheric fog
 * - Elevated soft cartoon cloud canopy (Y = 75m–110m), strictly above MAX_TERRAIN_HEIGHT (26m)
 * - Directional light, sky dome, and clouds follow player/camera for infinite coherent lighting
 */
export class StylizedEnvironment {
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;
  private sunDirNorm: THREE.Vector3;

  constructor(scene: THREE.Scene) {
    this.sunDirNorm = new THREE.Vector3(
      LIGHTING_CONFIG.SUN_DIR_X,
      LIGHTING_CONFIG.SUN_DIR_Y,
      LIGHTING_CONFIG.SUN_DIR_Z
    ).normalize();

    // 1. One Unified Global Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.SUN_COLOR,
      LIGHTING_CONFIG.SUN_INTENSITY
    );
    this.sunLight.position.copy(this.sunDirNorm).multiplyScalar(120);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 280;
    const d = 60;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    // 2. Consistent Ambient Hemisphere Light (Lifted to prevent dark shadow crush)
    this.ambientLight = new THREE.HemisphereLight(
      LIGHTING_CONFIG.AMBIENT_SKY_COLOR,
      LIGHTING_CONFIG.AMBIENT_GROUND_COLOR,
      LIGHTING_CONFIG.AMBIENT_INTENSITY
    );
    scene.add(this.ambientLight);

    // 3. Illustrated Sky Dome with Anime Horizon Gradient
    const skyRadius = LIGHTING_CONFIG.SKY_DOME_RADIUS;
    const skyGeo = new THREE.SphereGeometry(skyRadius, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color('#224270') },       // Deep anime azure
        uMidColor: { value: new THREE.Color('#4a72a8') },       // Bright cerulean sky
        uBottomColor: { value: new THREE.Color(LIGHTING_CONFIG.FOG_COLOR) }, // Horizon atmospheric haze
        uSunDir: { value: this.sunDirNorm }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uBottomColor;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = clamp(dir.y * 2.2, 0.0, 1.0);
          
          vec3 sky = mix(uBottomColor, uMidColor, smoothstep(0.0, 0.28, h));
          sky = mix(sky, uTopColor, smoothstep(0.28, 1.0, h));

          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyMesh);

    // 4. Stylized Hand-Drawn Clouds (Elevated: Y = 75m to 110m, Mountains max 26m)
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new ToonMaterial({
      color: '#faf7f0',
      hatchIntensity: 0.18
    });

    const cloudCount = 14;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.createCloudMesh(cloudMat);
      const angle = (i / cloudCount) * Math.PI * 2 + (i % 2) * 0.2;
      const radius = 140 + (i % 4) * 80 + Math.sin(i * 3) * 30;
      // High altitude: 78m to 108m, strictly above max terrain height (26m)
      const height = LIGHTING_CONFIG.CLOUD_ALTITUDE_MIN + (i % 5) * 6.5 + Math.cos(i * 2) * 4.0;
      cloud.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      cloud.scale.setScalar(2.0 + (i % 3) * 0.6);
      cloud.rotation.y = angle + Math.PI / 2;
      this.cloudsGroup.add(cloud);
    }
    scene.add(this.cloudsGroup);
  }

  private createCloudMesh(material: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const puffCount = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < puffCount; i++) {
      const r = 9 + Math.random() * 6;
      const puffGeo = new THREE.DodecahedronGeometry(r, 1);
      const mesh = new THREE.Mesh(puffGeo, material);
      mesh.position.set(
        (i - puffCount / 2) * 11 + (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 8
      );
      mesh.scale.set(1.15, 0.65, 1.0);
      group.add(mesh);
    }
    return group;
  }

  /**
   * Updates clouds rotation and centers environment smoothly around camera
   */
  public update(delta: number, cameraPos?: THREE.Vector3) {
    this.cloudsGroup.rotation.y += delta * 0.003;

    if (cameraPos) {
      // Sky dome and clouds move with camera to create an infinite horizon
      this.skyMesh.position.x = cameraPos.x;
      this.skyMesh.position.z = cameraPos.z;

      this.cloudsGroup.position.x = cameraPos.x;
      this.cloudsGroup.position.z = cameraPos.z;

      // Shadow casting sun moves with camera so shadows are always sharp around player
      this.sunLight.position.set(
        cameraPos.x + this.sunDirNorm.x * 120,
        cameraPos.y + this.sunDirNorm.y * 120,
        cameraPos.z + this.sunDirNorm.z * 120
      );
      this.sunLight.target.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      this.sunLight.target.updateMatrixWorld();
    }
  }
}
