import * as THREE from 'three';
import { ToonMaterial } from '../materials/ToonMaterial';

/**
 * Stylized Environment:
 * - Directional sunlight with high-resolution graphic shadow map
 * - Illustrated sky hemisphere with dusk/golden hour gradient and hand-drawn cartoon clouds
 * - Ambient hemispheric fill light
 */
export class StylizedEnvironment {
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    // 1. Directional Sun
    this.sunLight = new THREE.DirectionalLight('#fff4e0', 1.8);
    this.sunLight.position.set(45, 65, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 250;
    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);

    // 2. Ambient Hemisphere Light
    this.ambientLight = new THREE.HemisphereLight('#6a8cb8', '#423326', 0.85);
    scene.add(this.ambientLight);

    // 3. Illustrated Sky Dome with Graphic Gradient
    const skyGeo = new THREE.SphereGeometry(300, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color('#223d68') },    // Deep twilight indigo
        uMidColor: { value: new THREE.Color('#4c6b94') },    // Muted periwinkle
        uBottomColor: { value: new THREE.Color('#e09756') }, // Warm amber sunset
        uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() }
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
          float h = clamp(dir.y * 1.5, 0.0, 1.0);
          
          vec3 sky = mix(uBottomColor, uMidColor, smoothstep(0.0, 0.35, h));
          sky = mix(sky, uTopColor, smoothstep(0.35, 1.0, h));

          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyMesh);

    // 4. Stylized Hand-Drawn Clouds (Multi-layer billowy volumes with toon materials)
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new ToonMaterial({
      color: '#f3ede2',
      hatchIntensity: 0.25
    });

    for (let i = 0; i < 9; i++) {
      const cloud = this.createCloudMesh(cloudMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 180 + Math.sin(i * 3) * 30;
      const height = 45 + Math.cos(i * 2) * 15;
      cloud.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      cloud.scale.setScalar(1.5 + (i % 3) * 0.5);
      cloud.rotation.y = angle + Math.PI / 2;
      this.cloudsGroup.add(cloud);
    }
    scene.add(this.cloudsGroup);
  }

  private createCloudMesh(material: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const puffCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < puffCount; i++) {
      const r = 8 + Math.random() * 7;
      const puffGeo = new THREE.DodecahedronGeometry(r, 1);
      const mesh = new THREE.Mesh(puffGeo, material);
      mesh.position.set(
        (i - puffCount / 2) * 9 + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6
      );
      mesh.scale.set(1.1, 0.75, 1.0);
      group.add(mesh);
    }
    return group;
  }

  public update(delta: number) {
    this.cloudsGroup.rotation.y += delta * 0.005;
  }
}
