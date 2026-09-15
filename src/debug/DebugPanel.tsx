import React, { useState } from 'react';

export interface DebugStats {
  fps: number;
  triangles: number;
  drawCalls: number;
  carSpeedKmh: number;
  carSpeedMph: number;
  position: { x: number; y: number; z: number };
  carYaw: number;
  chunkCoord: { chunkX: number; chunkZ: number };
  activeChunks: number;
  loadedChunks: number;
  currentLod: number;
  terrainHeight: number;
  terrainSlope: number;
  wheelContacts: boolean[];
  compressions: number[];
  isGrounded: boolean;
  isDrifting: boolean;
}

interface DebugPanelProps {
  stats: DebugStats;
  outlineEnabled: boolean;
  chunkDebugEnabled: boolean;
  onToggleOutline: () => void;
  onToggleChunkDebug: () => void;
  onResetCar: () => void;
  onWarpTest?: (id: 'A' | 'B' | 'C' | 'D' | 'E') => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  stats,
  outlineEnabled,
  chunkDebugEnabled,
  onToggleOutline,
  onToggleChunkDebug,
  onResetCar,
  onWarpTest
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.toggleButton}
        title="Toggle Developer Debug Panel"
      >
        {isOpen ? '✕ HIDE DEBUG' : '⚙ DEV DEBUG'}
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>DEVELOPER TELEMETRY</div>

          {/* Performance */}
          <div style={styles.section}>
            <div style={styles.row}>
              <span>FPS:</span>
              <strong style={{ color: stats.fps > 50 ? '#27ae60' : '#e67e22' }}>{stats.fps}</strong>
            </div>
            <div style={styles.row}>
              <span>Triangles:</span>
              <strong>{stats.triangles.toLocaleString()}</strong>
            </div>
            <div style={styles.row}>
              <span>Draw Calls:</span>
              <strong>{stats.drawCalls}</strong>
            </div>
          </div>

          {/* Terrain & Slope Telemetry (Phase 3 Part 1 Requirements) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>TERRAIN & SLOPE TELEMETRY</div>
            <div style={styles.row}>
              <span>Terrain Height:</span>
              <strong>{stats.terrainHeight.toFixed(2)} m</strong>
            </div>
            <div style={styles.row}>
              <span>Terrain Slope:</span>
              <strong style={{
                color: stats.terrainSlope > 0.38 ? '#e74c3c' : (stats.terrainSlope > 0.20 ? '#f39c12' : '#27ae60')
              }}>
                {(stats.terrainSlope * 100).toFixed(1)}% ({(Math.atan(stats.terrainSlope) * (180 / Math.PI)).toFixed(1)}°)
              </strong>
            </div>
            <div style={styles.row}>
              <span>Vehicle Grounded:</span>
              <strong style={{ color: stats.isGrounded ? '#27ae60' : '#e74c3c' }}>
                {stats.isGrounded ? 'YES (GROUNDED)' : 'NO (AIRBORNE)'}
              </strong>
            </div>
            <div style={styles.row}>
              <span>Wheel Contact FL:</span>
              <strong style={{ color: stats.wheelContacts[0] ? '#27ae60' : '#e74c3c' }}>
                {stats.wheelContacts[0] ? 'YES' : 'NO'} ({(stats.compressions[0] * 100).toFixed(1)}cm)
              </strong>
            </div>
            <div style={styles.row}>
              <span>Wheel Contact FR:</span>
              <strong style={{ color: stats.wheelContacts[1] ? '#27ae60' : '#e74c3c' }}>
                {stats.wheelContacts[1] ? 'YES' : 'NO'} ({(stats.compressions[1] * 100).toFixed(1)}cm)
              </strong>
            </div>
            <div style={styles.row}>
              <span>Wheel Contact RL:</span>
              <strong style={{ color: stats.wheelContacts[2] ? '#27ae60' : '#e74c3c' }}>
                {stats.wheelContacts[2] ? 'YES' : 'NO'} ({(stats.compressions[2] * 100).toFixed(1)}cm)
              </strong>
            </div>
            <div style={styles.row}>
              <span>Wheel Contact RR:</span>
              <strong style={{ color: stats.wheelContacts[3] ? '#27ae60' : '#e74c3c' }}>
                {stats.wheelContacts[3] ? 'YES' : 'NO'} ({(stats.compressions[3] * 100).toFixed(1)}cm)
              </strong>
            </div>
          </div>

          {/* World & Chunk Streaming Telemetry (Phase 2A) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>WORLD & CHUNK ARCHITECTURE</div>
            <div style={styles.row}>
              <span>World Position:</span>
              <strong>X:{stats.position.x.toFixed(1)} Y:{stats.position.y.toFixed(1)} Z:{stats.position.z.toFixed(1)}</strong>
            </div>
            <div style={styles.row}>
              <span>Chunk Coord:</span>
              <strong style={{ color: '#f39c12' }}>CHUNK ({stats.chunkCoord.chunkX}, {stats.chunkCoord.chunkZ})</strong>
            </div>
            <div style={styles.row}>
              <span>Active Chunks:</span>
              <strong>{stats.activeChunks} active / {stats.loadedChunks} loaded</strong>
            </div>
            <div style={styles.row}>
              <span>Current LOD:</span>
              <strong style={{ color: '#27ae60' }}>LOD {stats.currentLod}</strong>
            </div>
          </div>

          {/* Vehicle Physics */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>VEHICLE DYNAMICS</div>
            <div style={styles.row}>
              <span>Speed:</span>
              <strong>{Math.round(stats.carSpeedMph)} MPH ({Math.round(stats.carSpeedKmh)} km/h)</strong>
            </div>
            <div style={styles.row}>
              <span>Drifting:</span>
              <strong>{stats.isDrifting ? 'TRUE' : 'FALSE'}</strong>
            </div>
          </div>

          {/* Developer Test Locations (Phase 3 Part 1 & 2) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>WARP TEST LOCATIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button onClick={() => onWarpTest?.('A')} style={styles.actionBtn} title="Test A: Flat terrain">
                [A] Flat
              </button>
              <button onClick={() => onWarpTest?.('B')} style={styles.actionBtn} title="Test B: Gentle hill (~0.10 slope)">
                [B] Gentle Hill
              </button>
              <button onClick={() => onWarpTest?.('C')} style={styles.actionBtn} title="Test C: Moderate hill (~0.25 slope)">
                [C] Moderate Hill
              </button>
              <button onClick={() => onWarpTest?.('D')} style={styles.actionBtn} title="Test D: Steep hill (traction loss)">
                [D] Steep Hill
              </button>
              <button onClick={() => onWarpTest?.('E')} style={{ ...styles.actionBtn, backgroundColor: '#8e44ad' }} title="Test E: Mountain cliff barrier">
                [E] Cliff Face
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>DEVELOPER CONTROLS</div>
            <div style={styles.actionRow}>
              <button
                onClick={onToggleChunkDebug}
                style={{
                  ...styles.actionBtn,
                  backgroundColor: chunkDebugEnabled ? '#f39c12' : '#34495e',
                  color: chunkDebugEnabled ? '#121626' : '#fff'
                }}
              >
                [H] Chunk Debug: {chunkDebugEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ ...styles.actionRow, marginTop: '4px' }}>
              <button
                onClick={onToggleOutline}
                style={{
                  ...styles.actionBtn,
                  backgroundColor: outlineEnabled ? '#2980b9' : '#7f8c8d'
                }}
              >
                Ink Outline: {outlineEnabled ? 'ON' : 'OFF'}
              </button>
              <button onClick={onResetCar} style={styles.actionBtn}>
                Reset Car (R)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '20px',
    right: '24px',
    zIndex: 20,
    fontFamily: 'var(--font-mono)'
  },
  toggleButton: {
    backgroundColor: '#121626',
    color: '#fff',
    border: '2px solid #121626',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '2px 2px 0px rgba(0,0,0,0.3)'
  },
  panel: {
    marginTop: '8px',
    width: '300px',
    backgroundColor: 'rgba(18, 22, 38, 0.94)',
    border: '2px solid #121626',
    borderRadius: '6px',
    padding: '14px',
    color: '#ecf0f1',
    fontSize: '11px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
  },
  header: {
    fontSize: '12px',
    fontWeight: 900,
    color: '#f39c12',
    letterSpacing: '1px',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    paddingBottom: '6px',
    marginBottom: '8px'
  },
  section: {
    marginBottom: '10px'
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#95a5a6',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0'
  },
  wheelGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '6px',
    borderRadius: '4px'
  },
  wheelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px'
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px'
  },
  actionBtn: {
    flex: 1,
    padding: '6px',
    backgroundColor: '#34495e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
