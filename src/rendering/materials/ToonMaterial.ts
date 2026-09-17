import * as THREE from 'three';
import { TextureFactory } from './TextureFactory';
import { LIGHTING_CONFIG } from '../../game/world/WorldConfig';

export interface ToonMaterialParams {
  color: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  wireframe?: boolean;
  hatchIntensity?: number;
  useVertexColors?: boolean;
}

/**
 * Custom NPR Toon Shader Material (Phase 3 Part 3)
 * Renders geometry with 3-band quantized anime lighting, comic book crosshatch shadows,
 * and distance-based atmospheric perspective (fog fade).
 * Calibrated with unified global lighting to prevent dark shadow crush.
 */
export class ToonMaterial extends THREE.ShaderMaterial {
  constructor(params: ToonMaterialParams) {
    const baseColor = new THREE.Color(params.color);
    const hatchTex = TextureFactory.getHatchTexture();

    const sunDir = new THREE.Vector3(
      LIGHTING_CONFIG.SUN_DIR_X,
      LIGHTING_CONFIG.SUN_DIR_Y,
      LIGHTING_CONFIG.SUN_DIR_Z
    ).normalize();

    super({
      uniforms: {
        uBaseColor: { value: baseColor },
        uHatchTex: { value: hatchTex },
        uHatchIntensity: { value: params.hatchIntensity ?? 0.25 },
        uLightDir: { value: sunDir },
        uLightColor: { value: new THREE.Color(LIGHTING_CONFIG.SUN_COLOR) },
        uAmbientColor: { value: new THREE.Color(LIGHTING_CONFIG.AMBIENT_SKY_COLOR) },
        uInkColor: { value: new THREE.Color('#121626') },
        uFogColor: { value: new THREE.Color(LIGHTING_CONFIG.FOG_COLOR) },
        uFogNear: { value: LIGHTING_CONFIG.FOG_NEAR },
        uFogFar: { value: LIGHTING_CONFIG.FOG_FAR },
        uCameraPos: { value: new THREE.Vector3(0, 5, 0) },
        uUseVertexColors: { value: params.useVertexColors ? 1.0 : 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vUv = uv;
          #ifdef USE_COLOR
            vColor = color;
          #else
            vColor = vec3(1.0);
          #endif
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform sampler2D uHatchTex;
        uniform float uHatchIntensity;
        uniform vec3 uLightDir;
        uniform vec3 uLightColor;
        uniform vec3 uAmbientColor;
        uniform vec3 uInkColor;
        uniform vec3 uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;
        uniform vec3 uCameraPos;
        uniform float uUseVertexColors;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 L = normalize(uLightDir);
          float NdotL = dot(N, L);

          // 3-Band Quantized Toon Lighting (Lifted floor so shadows are never pitch black)
          float lightBand;
          if (NdotL > 0.22) {
            lightBand = 1.0;   // Direct Highlight / Sun
          } else if (NdotL > -0.22) {
            lightBand = 0.88;  // Midtone
          } else {
            lightBand = 0.74;  // Soft, readable shadow
          }

          // Screen-space cross-hatching in core shadow
          vec2 screenUv = gl_FragCoord.xy / 140.0;
          vec4 hatchSample = texture2D(uHatchTex, screenUv);
          float shadowDepth = clamp((0.15 - NdotL) * 1.4, 0.0, 1.0);
          float hatchFactor = mix(1.0, hatchSample.r, shadowDepth * uHatchIntensity * 0.65);

          vec3 effectiveColor = uBaseColor;
          if (uUseVertexColors > 0.5) {
            effectiveColor *= vColor;
          }

          // Blend light color and ambient shadow tone
          vec3 litColor = effectiveColor * uLightColor * lightBand;
          vec3 shadowColor = mix(effectiveColor * 0.82, uAmbientColor, 0.22);
          vec3 finalRgb = mix(shadowColor, litColor, step(0.80, lightBand));

          // Apply hatching texture
          finalRgb *= hatchFactor;

          // Subtle rim light accent for graphic comic pop
          vec3 V = normalize(uCameraPos - vWorldPosition);
          float rim = 1.0 - max(0.0, dot(V, N));
          rim = smoothstep(0.70, 0.98, rim) * 0.16;
          finalRgb += uLightColor * rim;

          // Atmospheric Depth: Distance fog fading distant mountains softly into horizon sky
          float dist = length(vWorldPosition - uCameraPos);
          float fogFactor = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
          float smoothFog = fogFactor * fogFactor * (3.0 - 2.0 * fogFactor);
          finalRgb = mix(finalRgb, uFogColor, smoothFog * 0.85);

          gl_FragColor = vec4(finalRgb, 1.0);
        }
      `,
      wireframe: params.wireframe ?? false,
      vertexColors: params.useVertexColors ?? false
    });

    this.onBeforeRender = (_renderer, _scene, camera) => {
      this.uniforms.uCameraPos.value.copy(camera.position);
    };
  }

  public setLightDirection(dir: THREE.Vector3) {
    this.uniforms.uLightDir.value.copy(dir).normalize();
  }
}
