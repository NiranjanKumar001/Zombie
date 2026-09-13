import * as THREE from 'three';

/**
 * Procedural texture generator for NPR rendering:
 * - Paper grain texture (subtle organic fiber noise)
 * - Toon cross-hatch texture (for comic/ink shading in shadows)
 * - Road asphalt & tire tread noise
 */
export class TextureFactory {
  private static paperGrainTexture: THREE.CanvasTexture | null = null;
  private static hatchTexture: THREE.CanvasTexture | null = null;
  private static asphaltTexture: THREE.CanvasTexture | null = null;

  public static getPaperGrainTexture(): THREE.CanvasTexture {
    if (this.paperGrainTexture) return this.paperGrainTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base warm paper tone
    ctx.fillStyle = '#faf7ef';
    ctx.fillRect(0, 0, size, size);

    // Fine organic paper grain noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle fiber flecks
    ctx.fillStyle = 'rgba(120, 100, 80, 0.04)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 2 + Math.random() * 6;
      const angle = Math.random() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.paperGrainTexture = texture;
    return texture;
  }

  public static getHatchTexture(): THREE.CanvasTexture {
    if (this.hatchTexture) return this.hatchTexture;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#121626';
    ctx.lineWidth = 1.5;

    // Diagonal parallel ink hatching lines
    const spacing = 16;
    for (let d = -size; d < size * 2; d += spacing) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + size, size);
      ctx.stroke();
    }

    // Secondary perpendicular crosshatch with lower density
    ctx.strokeStyle = 'rgba(18, 22, 38, 0.4)';
    for (let d = -size; d < size * 2; d += spacing * 2) {
      ctx.beginPath();
      ctx.moveTo(d + size, 0);
      ctx.lineTo(d, size);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.hatchTexture = texture;
    return texture;
  }

  public static getAsphaltTexture(): THREE.CanvasTexture {
    if (this.asphaltTexture) return this.asphaltTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#b25d35';
    ctx.fillRect(0, 0, size, size);

    // Warm gravel grit
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 28;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    this.asphaltTexture = texture;
    return texture;
  }
}
