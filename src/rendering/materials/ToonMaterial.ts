import * as THREE from 'three';
import { TextureFactory } from './TextureFactory';

export interface ToonMaterialParams {
  color: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  wireframe?: boolean;
  hatchIntensity?: number;
  useVertexColors?: boolean;
}

/**
 * Custom NPR Toon Shader Material
 * Renders geometry with 3-band quantized lighting and comic book crosshatch shadows.
 * Calibrated for vibrant graphic novel aesthetics matching the reference video.
 */
export class ToonMaterial extends THREE.ShaderMaterial {
  constructor(params: ToonMaterialParams) {
    const baseColor = new THREE.Color(params.color);
    const hatchTex = TextureFactory.getHatchTexture();

    super({
      uniforms: {
        uBaseColor: { value: baseColor },
        uHatchTex: { value: hatchTex },
        uHatchIntensity: { value: params.hatchIntensity ?? 0.28 },
        uLightDir: { value: new THREE.Vector3(-0.45, 0.75, -0.48).normalize() },
        uLightColor: { value: new THREE.Color('#fff7e6') },
        uAmbientColor: { value: new THREE.Color('#687d99') },
        uInkColor: { value: new THREE.Color('#121626') },
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
        uniform float uUseVertexColors;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 L = normalize(uLightDir);
          float NdotL = dot(N, L);

          // 3-Band Quantized Toon Lighting with high readability
          float lightBand;
          if (NdotL > 0.25) {
            lightBand = 1.0;  // Highlight / Direct Sun
          } else if (NdotL > -0.25) {
            lightBand = 0.82; // Midtone
          } else {
            lightBand = 0.58; // Soft Core Shadow
          }

          // Screen-space hatching in core shadow
          vec2 screenUv = gl_FragCoord.xy / 140.0;
          vec4 hatchSample = texture2D(uHatchTex, screenUv);
          float shadowDepth = clamp((0.15 - NdotL) * 1.5, 0.0, 1.0);
          float hatchFactor = mix(1.0, hatchSample.r, shadowDepth * uHatchIntensity);

          vec3 effectiveColor = uBaseColor;
          if (uUseVertexColors > 0.5) {
            effectiveColor *= vColor;
          }

          // Blend light color and ambient shadow tone
          vec3 litColor = effectiveColor * uLightColor * lightBand;
          vec3 shadowColor = mix(effectiveColor * 0.7, uAmbientColor * 0.85, 0.28);
          vec3 finalRgb = mix(shadowColor, litColor, step(0.65, lightBand));

          // Apply hatching in shadow
          finalRgb *= hatchFactor;

          // Subtle rim light accent for graphic comic pop
          vec3 V = normalize(-vWorldPosition);
          float rim = 1.0 - max(0.0, dot(V, N));
          rim = smoothstep(0.72, 0.98, rim) * 0.18;
          finalRgb += uLightColor * rim;

          gl_FragColor = vec4(finalRgb, 1.0);
        }
      `,
      wireframe: params.wireframe ?? false,
      vertexColors: params.useVertexColors ?? false
    });
  }

  public setLightDirection(dir: THREE.Vector3) {
    this.uniforms.uLightDir.value.copy(dir).normalize();
  }
}
