import * as THREE from 'three';
import { TextureFactory } from '../materials/TextureFactory';

/**
 * ScreenSpaceOutlinePass
 * Extracts comic ink outlines using a 3x3 Sobel kernel on color & luminance discontinuities.
 * Applies deep indigo ink lines and composites warm notebook paper texture.
 */
export class ScreenSpaceOutlinePass {
  private beautyRenderTarget: THREE.WebGLRenderTarget;
  private outlineQuad: THREE.Mesh;
  private outlineMaterial: THREE.ShaderMaterial;
  private postCamera: THREE.OrthographicCamera;
  private postScene: THREE.Scene;

  public enabled: boolean = true;
  public lineThickness: number = 1.6;
  public edgeThreshold: number = 0.18;
  public inkColor: THREE.Color = new THREE.Color('#121626');
  public paperInfluence: number = 0.08;

  constructor(width: number, height: number) {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const rtWidth = Math.floor(width * pixelRatio);
    const rtHeight = Math.floor(height * pixelRatio);

    // High precision beauty render target
    this.beautyRenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true
    });

    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.postScene = new THREE.Scene();

    const paperTex = TextureFactory.getPaperGrainTexture();

    this.outlineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.beautyRenderTarget.texture },
        tPaper: { value: paperTex },
        uResolution: { value: new THREE.Vector2(rtWidth, rtHeight) },
        uLineThickness: { value: this.lineThickness },
        uEdgeThreshold: { value: this.edgeThreshold },
        uInkColor: { value: this.inkColor },
        uPaperInfluence: { value: this.paperInfluence },
        uEnabled: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tPaper;
        uniform vec2 uResolution;
        uniform float uLineThickness;
        uniform float uEdgeThreshold;
        uniform vec3 uInkColor;
        uniform float uPaperInfluence;
        uniform float uEnabled;

        varying vec2 vUv;

        // Luminance calculation
        float rgbToLuma(vec3 col) {
          return dot(col, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec4 sceneColor = texture2D(tDiffuse, vUv);
          if (uEnabled < 0.5) {
            gl_FragColor = vec4(sceneColor.rgb, 1.0);
            return;
          }

          vec2 texel = (vec2(1.0) / uResolution) * uLineThickness;

          // 3x3 Sobel neighborhood sampling
          vec3 c00 = texture2D(tDiffuse, vUv + vec2(-texel.x, -texel.y)).rgb;
          vec3 c10 = texture2D(tDiffuse, vUv + vec2(0.0,      -texel.y)).rgb;
          vec3 c20 = texture2D(tDiffuse, vUv + vec2( texel.x, -texel.y)).rgb;

          vec3 c01 = texture2D(tDiffuse, vUv + vec2(-texel.x,  0.0)).rgb;
          vec3 c21 = texture2D(tDiffuse, vUv + vec2( texel.x,  0.0)).rgb;

          vec3 c02 = texture2D(tDiffuse, vUv + vec2(-texel.x,  texel.y)).rgb;
          vec3 c12 = texture2D(tDiffuse, vUv + vec2(0.0,       texel.y)).rgb;
          vec3 c22 = texture2D(tDiffuse, vUv + vec2( texel.x,  texel.y)).rgb;

          // Sobel Color Vector Differences
          vec3 gx = (-c00 + c20) + 2.0 * (-c01 + c21) + (-c02 + c22);
          vec3 gy = (-c00 - 2.0 * c10 - c20) + (c02 + 2.0 * c12 + c22);
          float colorGrad = length(gx) + length(gy);

          // Luminance gradient
          float l00 = rgbToLuma(c00);
          float l10 = rgbToLuma(c10);
          float l20 = rgbToLuma(c20);
          float l01 = rgbToLuma(c01);
          float l21 = rgbToLuma(c21);
          float l02 = rgbToLuma(c02);
          float l12 = rgbToLuma(c12);
          float l22 = rgbToLuma(c22);

          float lgx = (-l00 + l20) + 2.0 * (-l01 + l21) + (-l02 + l22);
          float lgy = (-l00 - 2.0 * l10 - l20) + (l02 + 2.0 * l12 + l22);
          float lumaGrad = sqrt(lgx * lgx + lgy * lgy);

          float totalEdge = max(colorGrad * 0.7, lumaGrad * 1.6);
          float edgeFactor = smoothstep(uEdgeThreshold, uEdgeThreshold + 0.15, totalEdge);

          // Blend dark indigo ink outline
          vec3 finalColor = mix(sceneColor.rgb, uInkColor, edgeFactor * 0.95);

          // Blend subtle notebook paper grain
          vec4 paper = texture2D(tPaper, vUv * 3.5);
          finalColor = mix(finalColor, finalColor * paper.rgb, uPaperInfluence);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false
    });

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.outlineQuad = new THREE.Mesh(quadGeo, this.outlineMaterial);
    this.postScene.add(this.outlineQuad);
  }

  public setSize(width: number, height: number) {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const rtWidth = Math.floor(width * pixelRatio);
    const rtHeight = Math.floor(height * pixelRatio);
    this.beautyRenderTarget.setSize(rtWidth, rtHeight);
    this.outlineMaterial.uniforms.uResolution.value.set(rtWidth, rtHeight);
  }

  public render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    if (!this.enabled) {
      renderer.render(scene, camera);
      return;
    }

    this.outlineMaterial.uniforms.uLineThickness.value = this.lineThickness;

    // 1. Render Scene to offscreen Beauty RenderTarget
    renderer.setRenderTarget(this.beautyRenderTarget);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Render Postprocess Sobel Ink Outline & Paper Composite to Screen
    renderer.setRenderTarget(null);
    renderer.render(this.postScene, this.postCamera);
  }

  public dispose() {
    this.beautyRenderTarget.dispose();
    this.outlineMaterial.dispose();
  }
}
