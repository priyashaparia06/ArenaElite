import React from 'react';
import { formatDateTime } from '../utils/dateUtils';
import CricketOverStrip from './CricketOverStrip';

const SPORT_ICONS = {
  CRICKET: '🏏',
  FOOTBALL: '⚽',
  BASKETBALL: '🏀',
  BADMINTON: '🏸',
  VOLLEYBALL: '🏐',
  KABADDI: '🤼',
};

export default function ViewerScorecardModal({ match, onClose, onOpenBracket }) {
  if (!match) return null;

  const sportCode = (match.sportCategory || 'FOOTBALL').toUpperCase();
  const icon = SPORT_ICONS[sportCode] || '🏆';

  const nameA = match.teamA?.name || 'Team A';
  const nameB = match.teamB?.name || 'Team B';
  const isCompleted = match.status === 'COMPLETED';
  const isLive = match.status === 'LIVE';

  const details = match.score?.details || {};
  const timeline = match.score?.timeline || [];

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1200,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '850px',
          width: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '18px' }}>{icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {sportCode} • {match.tournamentId?.title || 'Arena Elite Championship'}
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {nameA} vs {nameB}
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
              📍 {match.venue || match.tournamentId?.venueName || 'Main Arena'} &nbsp;|&nbsp; 📅 {formatDateTime(match.scheduledDate)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => onOpenBracket && onOpenBracket(match.tournamentId || match)}
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              title="View Knockout Bracket Tree for this Tournament"
            >
              <span>🌳</span> View Bracket
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                fontSize: '16px',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* CricHeroes Style Large Score Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 12,
            padding: '24px',
            color: '#ffffff',
            marginBottom: 20,
            boxShadow: '0 8px 16px -2px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Team A */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>{nameA}</h4>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>{match.teamA?.district || 'Squad'}</div>
            </div>

            {/* Score Center */}
            <div style={{ flex: 1.4, textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.5px' }}>
                {match.score?.teamAScore || '0'} - {match.score?.teamBScore || '0'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: isLive ? '#ef4444' : isCompleted ? '#16a34a' : 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: 20,
                  marginTop: 6,
                  textTransform: 'uppercase',
                }}
              >
                {isLive ? '🔴 LIVE' : isCompleted ? '✓ FINAL RESULT' : 'SCHEDULED'}
              </div>
            </div>

            {/* Team B */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>{nameB}</h4>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>{match.teamB?.district || 'Squad'}</div>
            </div>
          </div>

          {/* Result / In-Play text banner */}
          <div
            style={{
              marginTop: 18,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '10px 14px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#bae6fd',
            }}
          >
            {match.score?.resultSummary || 'Match in progress'}
          </div>
        </div>

        {/* SPORT-SPECIFIC DETAILED METRICS */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Detailed Match Analytics
          </h4>

          {/* 1. CRICKET METRICS */}
          {sportCode === 'CRICKET' && details.teamA && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: 6 }}>
                  {nameA} (1st Innings)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {details.teamA.runs}/{details.teamA.wickets} <span style={{ fontSize: '13px', color: '#64748b' }}>({details.teamA.oversFormatted || '20.0'} ov)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>
                  Balls bowled: {details.teamA.balls} • Run rate: {((details.teamA.runs / (details.teamA.balls || 1)) * 6).toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: 6 }}>
                  {nameB} (2nd Innings)
                </div>
                {details.currentInnings === 1 ? (
                  <div>
                    <div style={{ fontSize: '16px', color: '#94a3b8', fontStyle: 'italic', fontWeight: 700 }}>
                      Yet to Bat
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>
                      Bowling in 1st Innings • Target will be set at innings break
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                      {details.teamB?.runs || 0}/{details.teamB?.wickets || 0}{' '}
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        ({details.teamB?.oversFormatted || '0.0'} ov)
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>
                      Target: {details.target || ((details.teamA?.runs || 0) + 1)} • Balls:{' '}
                      {details.teamB?.balls || 0}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. FOOTBALL METRICS */}
          {sportCode === 'FOOTBALL' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Match Period:</span>
                <strong style={{ color: '#0f172a' }}>{details.period || 'Full Time'}</strong>
              </div>
              {details.penaltyA !== null && details.penaltyB !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Penalty Shootout:</span>
                  <strong style={{ color: '#0284c7' }}>{nameA} {details.penaltyA} - {details.penaltyB} {nameB}</strong>
                </div>
              )}
            </div>
          )}

          {/* 3. BASKETBALL METRICS */}
          {sportCode === 'BASKETBALL' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Current Quarter:</span>
                <strong style={{ color: '#0f172a' }}>{details.quarter || 'Final'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Point Margin:</span>
                <strong style={{ color: '#0284c7' }}>
                  {Math.abs(Number(match.score?.teamAScore || 0) - Number(match.score?.teamBScore || 0))} points
                </strong>
              </div>
            </div>
          )}

          {/* 4. BADMINTON / VOLLEYBALL METRICS */}
          {(sportCode === 'BADMINTON' || sportCode === 'VOLLEYBALL') && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Completed Set Scores:
              </div>
              {details.completedSets && details.completedSets.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {details.completedSets.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      Set {idx + 1}: {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Set 1 currently in play.</div>
              )}
            </div>
          )}

          {/* 5. KABADDI METRICS */}
          {sportCode === 'KABADDI' && details.teamA && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{nameA}</div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Raid Points: <strong>{details.teamA.raidPoints || 0}</strong></div>
                  <div>Tackle Points: <strong>{details.teamA.tacklePoints || 0}</strong></div>
                  <div>All-Outs: <strong>{details.teamA.allOutPoints || 0}</strong></div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{nameB}</div>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Raid Points: <strong>{details.teamB?.raidPoints || 0}</strong></div>
                  <div>Tackle Points: <strong>{details.teamB?.tacklePoints || 0}</strong></div>
                  <div>All-Outs: <strong>{details.teamB?.allOutPoints || 0}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CRICKET: THIS OVER BALL-BY-BALL STRIP (6 BALLS IN A ROW) */}
        {sportCode === 'CRICKET' && (
          <div
            style={{
              marginBottom: 20,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
            }}
          >
            {(() => {
              const activeState = details.currentInnings === 1 ? details.teamA : details.teamB;
              const totalBalls = activeState?.balls || 0;
              const completedOvers = Math.floor(totalBalls / 6);
              const ballsInOver = totalBalls % 6;

              const isExtra = (b) => {
                if (!b) return false;
                const s = String(b).toLowerCase();
                return s.includes('wd') || s.includes('nb');
              };

              const rawBalls = details.currentOverBalls || [];
              const legalCount = rawBalls.filter((b) => !isExtra(b)).length;
              const isOverCompleted = legalCount >= 6 && ballsInOver === 0;
              const overNumber = isOverCompleted ? (completedOvers || 1) : completedOvers + 1;

              return (
                <CricketOverStrip
                  balls={rawBalls}
                  overNumber={overNumber}
                  isOverCompleted={isOverCompleted}
                />
              );
            })()}
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => onOpenBracket && onOpenBracket(match.tournamentId || match)}
            style={{
              background: '#f8fafc',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0f2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
            }}
          >
            <span>🌳</span> View Tournament Knockout Bracket
          </button>

          <button
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '9px 24px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
