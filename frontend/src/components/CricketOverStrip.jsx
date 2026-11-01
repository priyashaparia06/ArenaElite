import React from 'react';

/**
 * CricHeroes-style 6-ball Over Strip component
 * Renders a row of 6 circular ball boxes representing the 6 deliveries of an over:
 * - 0 / dot: grey background with centered dark dot
 * - 1, 2, 3: clean white background with grey border
 * - 4: vivid cyan-blue filled circle
 * - 6: vibrant magenta-purple filled circle
 * - W: vivid red filled circle
 * - Wd / Nb: amber badge
 * - Unbowled: subtle dashed empty circle
 */
export default function CricketOverStrip({
  balls = [],
  overNumber = 1,
  totalRuns = null,
  showTitle = true,
  compact = false,
  isOverCompleted = false,
}) {
  const isExtra = (b) => {
    if (!b) return false;
    const s = String(b).toLowerCase();
    return s.includes('wd') || s.includes('nb');
  };

  const rawBalls = Array.isArray(balls) ? [...balls] : [];

  // Protect against bleeding across overs:
  // If an array has more than 6 legal balls (e.g. 6 from old over + 2 new),
  // extract only the latest in-progress over's balls!
  let currentOverBalls = [];
  let legalCount = 0;
  for (let i = rawBalls.length - 1; i >= 0; i--) {
    const b = rawBalls[i];
    if (!isExtra(b)) {
      legalCount++;
      if (legalCount > 6) {
        break;
      }
    }
    currentOverBalls.unshift(b);
  }

  // If legalCount was more than 6 and we broke, check if the remaining balls after the first 6 were the new over
  const totalLegal = rawBalls.filter((b) => !isExtra(b)).length;
  if (totalLegal > 6) {
    // Take the balls that belong strictly to the new over (after the 6th legal ball)
    let count = 0;
    const newOverDeliveries = [];
    for (let i = 0; i < rawBalls.length; i++) {
      const b = rawBalls[i];
      if (!isExtra(b)) count++;
      if (count > 6) {
        newOverDeliveries.push(b);
      }
    }
    if (newOverDeliveries.length > 0) {
      currentOverBalls = newOverDeliveries;
    }
  }

  const safeBalls = currentOverBalls.length > 0 ? currentOverBalls : (rawBalls.length <= 6 ? rawBalls : rawBalls.slice(-6));

  // A standard cricket over always displays a row of 6 ball slots
  // If there are extras (wide / no-ball) in this over, slots expands to accommodate them
  const displaySlots = Math.max(6, safeBalls.length);
  const slots = Array.from({ length: displaySlots }, (_, i) => safeBalls[i] ?? null);

  // Calculate runs scored in this over if not provided
  const computedRuns = totalRuns !== null
    ? totalRuns
    : safeBalls.reduce((acc, b) => {
        if (!b) return acc;
        if (b === '4' || b === 4) return acc + 4;
        if (b === '6' || b === 6) return acc + 6;
        if (b === '1' || b === 1) return acc + 1;
        if (b === '2' || b === 2) return acc + 2;
        if (b === '3' || b === 3) return acc + 3;
        if (typeof b === 'string' && b.toLowerCase().includes('wd')) return acc + 1;
        if (typeof b === 'string' && b.toLowerCase().includes('nb')) return acc + 1;
        return acc;
      }, 0);

  const circleSize = compact ? 28 : 36;
  const fontSize = compact ? 12 : 14;

  const renderBall = (val, index) => {
    // Unbowled / Waiting delivery slot
    if (val === null || val === undefined) {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title={`Ball ${index + 1} (Waiting)`}
        />
      );
    }

    const str = String(val).trim();
    const lower = str.toLowerCase();

    // 1. Dot Ball (0 or •)
    if (str === '0' || str === '•' || str === '.' || lower === 'dot') {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#e2e8f0',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          title="Dot ball (0 runs)"
        >
          <div
            style={{
              width: compact ? 5 : 6,
              height: compact ? 5 : 6,
              borderRadius: '50%',
              background: '#475569',
            }}
          />
        </div>
      );
    }

    // 2. Boundary FOUR (4)
    if (str === '4') {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#00b4d8',
            border: 'none',
            color: '#ffffff',
            fontSize: fontSize,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 5px rgba(0, 180, 216, 0.4)',
          }}
          title="FOUR (4 Runs)"
        >
          4
        </div>
      );
    }

    // 3. Maximum SIX (6)
    if (str === '6') {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#a855f7',
            border: 'none',
            color: '#ffffff',
            fontSize: fontSize,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 5px rgba(168, 85, 247, 0.4)',
          }}
          title="SIX (6 Runs)"
        >
          6
        </div>
      );
    }

    // 4. WICKET (W)
    if (str === 'W' || str === 'w' || (lower.includes('w') && !lower.includes('wd'))) {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#ef4444',
            border: 'none',
            color: '#ffffff',
            fontSize: fontSize,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
          }}
          title="WICKET Dismissal"
        >
          W
        </div>
      );
    }

    // 5. WIDE (Wd)
    if (lower.includes('wd')) {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#fef3c7',
            border: '1.5px solid #f59e0b',
            color: '#b45309',
            fontSize: compact ? 10 : 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title="Wide delivery"
        >
          {str}
        </div>
      );
    }

    // 6. NO-BALL (Nb)
    if (lower.includes('nb')) {
      return (
        <div
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: '#ffedd5',
            border: '1.5px solid #f97316',
            color: '#c2410c',
            fontSize: compact ? 10 : 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title="No-ball delivery"
        >
          {str}
        </div>
      );
    }

    // 7. Regular Runs (1, 2, 3, etc.)
    return (
      <div
        key={index}
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: '50%',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          color: '#1e293b',
          fontSize: fontSize,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
        title={`${str} Run${str !== '1' ? 's' : ''}`}
      >
        {str}
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {showTitle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h4
              style={{
                fontSize: compact ? '15px' : '18px',
                fontWeight: 900,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Over {overNumber}
            </h4>
            {isOverCompleted ? (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                (Completed • {computedRuns} run{computedRuns !== 1 ? 's' : ''})
              </span>
            ) : computedRuns > 0 ? (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                ({computedRuns} run{computedRuns !== 1 ? 's' : ''})
              </span>
            ) : null}
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: isOverCompleted ? '#16a34a' : '#0284c7',
              background: isOverCompleted ? '#dcfce7' : '#e0f2fe',
              padding: '2px 8px',
              borderRadius: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {isOverCompleted ? 'Over Completed' : 'Ball by Ball'}
          </span>
        </div>
      )}

      {/* Row of 6 individual ball boxes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 8 : 12,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {slots.map((val, idx) => renderBall(val, idx))}
      </div>
    </div>
  );
}
