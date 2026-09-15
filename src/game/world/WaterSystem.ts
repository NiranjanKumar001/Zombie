import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldConfig';

export type WaterDepthState = 'LAND' | 'SHALLOW WATER' | 'DEEP WATER' | 'SUBMERGED';

/**
 * Animated Stylized Water System for Phase 3 Part 2.
 * Provides:
 * - Stylized anime water shader with animated ripples, foam, and sunlight highlights
 * - Continuous chunk-aligned water geometry spanning the river corridor without seams
 * - Physical water depth queries and depth classification (LAND, SHALLOW, DEEP, SUBMERGED)
 */
export class WaterSystem {
  public static readonly WATER_LEVEL = WORLD_CONFIG.WATER_LEVEL; // -1.2m
  private waterMaterial: THREE.ShaderMaterial;
  private time: number = 0;

  constructor() {
    this.waterMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uShallowColor: { value: new THREE.Color('#38bdf8') }, // Luminous translucent cyan
        uDeepColor: { value: new THREE.Color('#1e40af') },    // Deep sapphire blue
        uFoamColor: { value: new THREE.Color('#f0f9ff') },    // Foam highlights
        uSunDir: { value: new THREE.Vector3(0.5, 0.7, 0.4).normalize() },
        uOpacity: { value: 0.82 }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          
          // Dual-frequency gentle anime water ripples
          float wave1 = sin(worldPos.x * 0.12 + uTime * 2.2) * cos(worldPos.z * 0.10 + uTime * 1.8) * 0.07;
          float wave2 = sin(worldPos.x * 0.28 - uTime * 1.5 + worldPos.z * 0.22) * 0.035;
          worldPos.y += wave1 + wave2;

          vWorldPosition = worldPos.xyz;
          
          // Surface normal perturb
          vec3 n = vec3(
            -cos(worldPos.x * 0.12 + uTime * 2.2) * 0.08,
            1.0,
            -cos(worldPos.z * 0.10 + uTime * 1.8) * 0.08
          );
          vNormal = normalize((modelMatrix * vec4(n, 0.0)).xyz);

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uShallowColor;
        uniform vec3 uDeepColor;
        uniform vec3 uFoamColor;
        uniform vec3 uSunDir;
        uniform float uOpacity;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Distance from center of western river (-200)
          float riverDist = abs(vWorldPosition.x - (-200.0));
          float depthFactor = clamp((85.0 - riverDist) / 85.0, 0.0, 1.0);
          
          // Blend shallow turquoise along banks into deep sapphire at center
          vec3 waterCol = mix(uShallowColor, uDeepColor, depthFactor * 0.75);

          // Animated stylized ripple caustic ribbons
          float ripple1 = sin(vWorldPosition.x * 0.35 + vWorldPosition.z * 0.30 + uTime * 2.4);
          float ripple2 = cos(vWorldPosition.x * 0.25 - vWorldPosition.z * 0.40 - uTime * 1.6);
          float caustic = smoothstep(0.68, 0.96, ripple1 * ripple2);
          waterCol = mix(waterCol, uFoamColor, caustic * 0.32);

          // Specular sunlight highlight
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfDir = normalize(uSunDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
          waterCol += uFoamColor * spec * 0.40;

          // Gentle edge foam along riverbank verge
          float edgeFoam = smoothstep(80.0, 96.0, riverDist);
          waterCol = mix(waterCol, uFoamColor, edgeFoam * 0.35);

          gl_FragColor = vec4(waterCol, uOpacity);
        }
      `
    });
  }

  /** Animate water shader ripples */
  public update(dt: number) {
    this.time += dt;
    this.waterMaterial.uniforms.uTime.value = this.time;
  }

  /** Calculates water depth at (worldX, worldZ). Returns 0 on dry land. */
  public getWaterDepth(worldX: number, worldZ: number, terrainHeight: number): number {
    const riverDist = Math.abs(worldX - (-200));
    // Water basin located in western river valley (-310 < x < -90)
    if (riverDist < 110 && terrainHeight < WaterSystem.WATER_LEVEL) {
      return WaterSystem.WATER_LEVEL - terrainHeight;
    }
    return 0;
  }

  /** Classifies water depth state for physics and telemetry */
  public getWaterState(depth: number): WaterDepthState {
    if (depth <= 0.04) return 'LAND';
    if (depth <= WORLD_CONFIG.SHALLOW_WATER_DEPTH) return 'SHALLOW WATER';
    if (depth <= WORLD_CONFIG.DEEP_WATER_DEPTH) return 'DEEP WATER';
    return 'SUBMERGED';
  }

  /**
   * Builds continuous, chunk-aligned water surface mesh.
   * Matches the chunk's 256m x 256m horizontal bounds exactly so adjacent water chunks
   * tile seamlessly across chunk boundaries with zero gaps or seams.
   */
  public buildChunkWaterMesh(chunkX: number, chunkZ: number, hasWater: boolean = true): THREE.Mesh | null {
    if (!hasWater) {
      return null;
    }

    const size = WORLD_CONFIG.CHUNK_SIZE; // 256m
    const geo = new THREE.PlaneGeometry(size, size, 24, 24);
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, this.waterMaterial);
    mesh.name = `Water_Chunk_${chunkX}_${chunkZ}`;
    mesh.receiveShadow = true;
    mesh.position.set(0, WaterSystem.WATER_LEVEL, 0);

    return mesh;
  }
}

