import React from 'react';

interface SpeedometerProps {
  speedMph: number;
  gear: number;
  boostReserve: number;
  isDrifting: boolean;
}

export const SpeedometerHUD: React.FC<SpeedometerProps> = ({
  speedMph,
  gear,
  boostReserve,
  isDrifting
}) => {
  const displaySpeed = Math.round(speedMph);
  const maxSpeed = 120;
  // Needle angle: -135deg (0 MPH) to +135deg (120 MPH)
  const needleAngle = -135 + Math.min(1.0, speedMph / maxSpeed) * 270;

  const gearText = gear === -1 ? 'R' : gear.toString();

  return (
    <div style={styles.container}>
      {/* Boost Gauge Column */}
      <div style={styles.boostColumn}>
        <div style={styles.boostMeterContainer}>
          <div
            style={{
              ...styles.boostFill,
              height: `${Math.max(0, Math.min(100, boostReserve))}%`
            }}
          />
        </div>
        <span style={styles.boostLabel}>BOOST</span>
      </div>

      {/* Speedometer Dial */}
      <div style={styles.dialWrapper}>
        <svg style={styles.dialSvg} viewBox="0 0 200 200">
          {/* Outer dial ring */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke="#121626"
            strokeWidth="4"
            fill="rgba(25, 28, 40, 0.75)"
          />

          {/* Tick marks */}
          {Array.from({ length: 13 }).map((_, i) => {
            const angle = (-135 + i * 22.5) * (Math.PI / 180);
            const r1 = 76;
            const r2 = 83;
            const x1 = 100 + Math.cos(angle) * r1;
            const y1 = 100 + Math.sin(angle) * r1;
            const x2 = 100 + Math.cos(angle) * r2;
            const y2 = 100 + Math.sin(angle) * r2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#fff"
                strokeWidth={i % 2 === 0 ? '2.5' : '1.5'}
              />
            );
          })}

          {/* Center Pivot */}
          <circle cx="100" cy="100" r="8" fill="#121626" stroke="#fff" strokeWidth="2" />

          {/* Indicator Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + Math.cos(needleAngle * (Math.PI / 180)) * 70}
            y2={100 + Math.sin(needleAngle * (Math.PI / 180)) * 70}
            stroke="#f1c40f"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Digital Speed & Gear Display */}
        <div style={styles.digitalReadout}>
          <div style={styles.gearDisplay}>{gearText}</div>
          <div style={styles.speedNumber}>{displaySpeed}</div>
          <div style={styles.unitLabel}>MPH</div>
        </div>
      </div>

      {isDrifting && (
        <div style={styles.driftBadge}>
          DRIFT!
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '24px',
    right: '28px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    zIndex: 10,
    pointerEvents: 'none',
    filter: 'drop-shadow(0 4px 12px rgba(18, 22, 38, 0.45))'
  },
  boostColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  boostMeterContainer: {
    width: '18px',
    height: '90px',
    backgroundColor: 'rgba(20, 24, 35, 0.85)',
    border: '2px solid #121626',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  },
  boostFill: {
    width: '100%',
    backgroundColor: '#f39c12',
    backgroundImage: 'linear-gradient(to top, #e67e22, #f1c40f)',
    transition: 'height 0.08s ease-out'
  },
  boostLabel: {
    fontSize: '9px',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: '#fff',
    letterSpacing: '1px'
  },
  dialWrapper: {
    position: 'relative',
    width: '170px',
    height: '170px'
  },
  dialSvg: {
    width: '100%',
    height: '100%'
  },
  digitalReadout: {
    position: 'absolute',
    top: '48%',
    left: '50%',
    transform: 'translate(-50%, -20%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'var(--font-mono)'
  },
  gearDisplay: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#f39c12',
    marginBottom: '-4px'
  },
  speedNumber: {
    fontSize: '34px',
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: '-1px'
  },
  unitLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#a0aec0',
    letterSpacing: '1px'
  },
  driftBadge: {
    position: 'absolute',
    top: '-32px',
    right: '20px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '4px',
    fontWeight: 900,
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    border: '2px solid #121626',
    transform: 'rotate(-4deg)',
    animation: 'pulse 0.4s infinite alternate'
  }
};
