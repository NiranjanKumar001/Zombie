import React from 'react';

interface GameOverlayProps {
  scoreMultiplier: number;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ scoreMultiplier }) => {
  return (
    <>
      {/* Top Multiplier Badge */}
      <div style={styles.multiplierContainer}>
        <span style={styles.multiplierText}>x{scoreMultiplier}</span>
      </div>

      {/* Bottom-Left Damage Bar */}
      <div style={styles.damageContainer}>
        <div style={styles.damageLabel}>DAMAGE</div>
        <div style={styles.damageTrack}>
          <div style={styles.damageFill} />
        </div>
      </div>

      {/* Top-Left Game Brand & Controls Hint */}
      <div style={styles.infoBadge}>
        <div style={styles.title}>SKETCH APOCALYPSE</div>
        <div style={styles.subtitle}>VISUAL QUALITY GATE — PHASE B</div>
        <div style={styles.controlsHint}>
          [W, A, S, D] Drive &nbsp;|&nbsp; [SPACE] Drift &nbsp;|&nbsp; [SHIFT] Boost &nbsp;|&nbsp; [R] Reset
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  multiplierContainer: {
    position: 'absolute',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    pointerEvents: 'none'
  },
  multiplierText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '32px',
    fontWeight: 900,
    color: '#ff2a85',
    textShadow: '2px 2px 0px #121626, -1px -1px 0px #121626, 0 0 12px rgba(255, 42, 133, 0.5)',
    letterSpacing: '-1px'
  },
  damageContainer: {
    position: 'absolute',
    bottom: '24px',
    left: '28px',
    zIndex: 10,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  damageLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px #121626'
  },
  damageTrack: {
    width: '120px',
    height: '6px',
    backgroundColor: 'rgba(18, 22, 38, 0.8)',
    border: '1.5px solid #121626',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  damageFill: {
    width: '12%',
    height: '100%',
    backgroundColor: '#e67e22'
  },
  infoBadge: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    zIndex: 10,
    pointerEvents: 'none',
    backgroundColor: 'rgba(251, 248, 240, 0.92)',
    padding: '10px 16px',
    borderRadius: '6px',
    border: '2px solid #121626',
    boxShadow: '3px 3px 0px #121626'
  },
  title: {
    fontFamily: 'var(--font-main)',
    fontSize: '15px',
    fontWeight: 900,
    color: '#121626',
    letterSpacing: '0.5px'
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: 700,
    color: '#c0392b',
    letterSpacing: '1px',
    marginTop: '2px'
  },
  controlsHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    color: '#4a5568',
    marginTop: '6px'
  }
};
