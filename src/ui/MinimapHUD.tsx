import React, { useEffect, useRef, useState } from 'react';
import { ChunkMapDataProvider } from '../game/world/ChunkMapDataProvider';
import { RoadNetwork } from '../game/world/RoadNetwork';

interface MinimapHUDProps {
  playerX: number;
  playerZ: number;
  carYaw: number;
}

export const MinimapHUD: React.FC<MinimapHUDProps> = ({ playerX, playerZ, carYaw }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewRadius, setViewRadius] = useState<number>(192); // meters shown across minimap diameter
  const dataProviderRef = useRef<ChunkMapDataProvider>(new ChunkMapDataProvider(new RoadNetwork()));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const scale = width / viewRadius; // pixels per meter

    // 1. Clear & Clip Circular Region
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 4, 0, Math.PI * 2);
    ctx.clip();

    // 2. Paper Parchment Background
    ctx.fillStyle = '#e8e2d5';
    ctx.fillRect(0, 0, width, height);

    // 3. Grid Lines (Chunk borders 256m)
    ctx.strokeStyle = 'rgba(18, 22, 38, 0.08)';
    ctx.lineWidth = 1;
    const startChunkX = Math.floor((playerX - viewRadius) / 256);
    const endChunkX = Math.ceil((playerX + viewRadius) / 256);
    const startChunkZ = Math.floor((playerZ - viewRadius) / 256);
    const endChunkZ = Math.ceil((playerZ + viewRadius) / 256);

    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      const wx = cx * 256 - 128;
      const screenX = center + (wx - playerX) * scale;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }
    for (let cz = startChunkZ; cz <= endChunkZ; cz++) {
      const wz = cz * 256 - 128;
      const screenY = center + (wz - playerZ) * scale;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    // 4. Render Features for Chunks in View
    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      for (let cz = startChunkZ; cz <= endChunkZ; cz++) {
        const chunkData = dataProviderRef.current.getChunkMapData(cx, cz);

        // Water Bodies
        chunkData.waterBodies.forEach((wb) => {
          const x1 = center + (wb.minX - playerX) * scale;
          const x2 = center + (wb.maxX - playerX) * scale;
          const z1 = center + (wb.minZ - playerZ) * scale;
          const z2 = center + (wb.maxZ - playerZ) * scale;

          ctx.fillStyle = '#2e86ab';
          ctx.strokeStyle = '#121626';
          ctx.lineWidth = 1.5;
          ctx.fillRect(x1, z1, x2 - x1, z2 - z1);
          ctx.strokeRect(x1, z1, x2 - x1, z2 - z1);
        });

        // Roads
        chunkData.roads.forEach((road) => {
          if (road.points.length < 2) return;
          ctx.beginPath();

          const p0 = road.points[0];
          ctx.moveTo(center + (p0.x - playerX) * scale, center + (p0.z - playerZ) * scale);

          for (let i = 1; i < road.points.length; i++) {
            const pt = road.points[i];
            ctx.lineTo(center + (pt.x - playerX) * scale, center + (pt.z - playerZ) * scale);
          }

          if (road.type === 'main') {
            ctx.strokeStyle = '#e6c875';
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.strokeStyle = '#121626';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (road.type === 'secondary') {
            ctx.strokeStyle = '#d4ac0d';
            ctx.lineWidth = 3.5;
            ctx.stroke();
          } else if (road.type === 'dirt') {
            ctx.strokeStyle = '#805a36';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        // Landmarks
        chunkData.landmarks.forEach((lm) => {
          const sx = center + (lm.x - playerX) * scale;
          const sz = center + (lm.z - playerZ) * scale;

          ctx.fillStyle = lm.type === 'cottage' ? '#a84332' : '#f39c12';
          ctx.beginPath();
          ctx.arc(sx, sz, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#121626';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    }

    ctx.restore();

    // 5. Outer Circular Rim & Cardinal Compass Labels
    ctx.strokeStyle = '#121626';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(center, center, center - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal Directions (North-Up Map)
    ctx.fillStyle = '#e74c3c'; // Red North
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('N', center, 6);

    ctx.fillStyle = '#121626';
    ctx.textBaseline = 'bottom';
    ctx.fillText('S', center, height - 6);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', width - 14, center);

    ctx.textAlign = 'right';
    ctx.fillText('W', 14, center);

    // 6. Rotating Player Vehicle Arrow Marker at Center
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(carYaw);

    ctx.beginPath();
    ctx.moveTo(0, -9);  // Front tip
    ctx.lineTo(6, 7);   // Bottom right
    ctx.lineTo(0, 4);   // Inner notch
    ctx.lineTo(-6, 7);  // Bottom left
    ctx.closePath();

    ctx.fillStyle = '#121626';
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [playerX, playerZ, carYaw, viewRadius]);

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} width={180} height={180} style={styles.canvas} />
      {/* Zoom Controls */}
      <div style={styles.zoomBar}>
        <button
          style={styles.zoomBtn}
          onClick={() => setViewRadius((r) => Math.max(128, r - 32))}
          title="Zoom In"
        >
          +
        </button>
        <button
          style={styles.zoomBtn}
          onClick={() => setViewRadius((r) => Math.min(384, r + 32))}
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  canvas: {
    borderRadius: '50%',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    backgroundColor: '#e8e2d5'
  },
  zoomBar: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#121626',
    padding: '2px 4px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  zoomBtn: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    width: '20px',
    height: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
