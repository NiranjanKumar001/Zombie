import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/core/GameEngine';
import { SpeedometerHUD } from '../ui/SpeedometerHUD';
import { GameOverlay } from '../ui/GameOverlay';
import { MinimapHUD } from '../ui/MinimapHUD';
import { DebugPanel, DebugStats } from '../debug/DebugPanel';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [stats, setStats] = useState<DebugStats>({
    fps: 60,
    triangles: 0,
    drawCalls: 0,
    carSpeedKmh: 0,
    carSpeedMph: 0,
    position: { x: 0, y: 1.2, z: -22 },
    carYaw: 0,
    chunkCoord: { chunkX: 0, chunkZ: 0 },
    activeChunks: 49,
    loadedChunks: 49,
    currentLod: 0,
    wheelContacts: [true, true, true, true],
    compressions: [0, 0, 0, 0],
    isGrounded: true,
    isDrifting: false
  });

  const [outlineEnabled, setOutlineEnabled] = useState(true);
  const [chunkDebugEnabled, setChunkDebugEnabled] = useState(false);
  const [boostReserve, setBoostReserve] = useState(100);
  const [gear, setGear] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
      setBoostReserve(engine.worldManager.physics.boostReserve);
      setGear(engine.worldManager.physics.gear);
    };

    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleToggleOutline = () => {
    if (engineRef.current) {
      engineRef.current.toggleOutline();
      setOutlineEnabled(engineRef.current.outlinePass.enabled);
    }
  };

  const handleToggleChunkDebug = () => {
    if (engineRef.current) {
      const active = engineRef.current.toggleChunkDebug();
      setChunkDebugEnabled(active);
    }
  };

  const handleResetCar = () => {
    if (engineRef.current) {
      engineRef.current.resetCar();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <div id="canvas-container" ref={containerRef} />

      {/* Notebook Paper Ruled Margin & Subtle Grain Overlay */}
      <div className="notebook-page-overlay" />

      {/* Reference Game HUD */}
      <GameOverlay scoreMultiplier={7} />

      {/* Speedometer Instrument Cluster */}
      <SpeedometerHUD
        speedMph={stats.carSpeedMph}
        gear={gear}
        boostReserve={boostReserve}
        isDrifting={stats.isDrifting}
      />

      {/* Top-Down Global World Minimap */}
      <MinimapHUD
        playerX={stats.position.x}
        playerZ={stats.position.z}
        carYaw={stats.carYaw}
      />

      {/* Developer Telemetry & Shader Debug Tools */}
      <DebugPanel
        stats={stats}
        outlineEnabled={outlineEnabled}
        chunkDebugEnabled={chunkDebugEnabled}
        onToggleOutline={handleToggleOutline}
        onToggleChunkDebug={handleToggleChunkDebug}
        onResetCar={handleResetCar}
      />
    </div>
  );
};
