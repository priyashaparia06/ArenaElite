import React from 'react';
import { formatDateTime } from '../utils/dateUtils';
import CricketOverStrip from './CricketOverStrip';

// Helper to determine sport icon and label
const SPORT_META = {
  CRICKET: { icon: '🏏', label: 'Cricket', formatLabel: '20 Ov.' },
  FOOTBALL: { icon: '⚽', label: 'Football', formatLabel: '90 Mins' },
  BASKETBALL: { icon: '🏀', label: 'Basketball', formatLabel: '4 Quarters' },
  BADMINTON: { icon: '🏸', label: 'Badminton', formatLabel: 'Best of 3 Sets' },
  VOLLEYBALL: { icon: '🏐', label: 'Volleyball', formatLabel: 'Best of 5 Sets' },
  KABADDI: { icon: '🤼', label: 'Kabaddi', formatLabel: '40 Mins (2 Halves)' },
};

export default function CricHeroesMatchCard({ match, onOpenScorecard, onOpenBracket }) {
  if (!match) return null;

  const sportCode = (match.sportCategory || 'FOOTBALL').toUpperCase();
  const meta = SPORT_META[sportCode] || { icon: '🏆', label: sportCode, formatLabel: 'Standard' };

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isScheduled = match.status === 'SCHEDULED';

  const nameA = match.teamA?.name || 'TBD';
  const nameB = match.teamB?.name || 'TBD';

  // Scores
  const rawScoreA = match.score?.teamAScore || '';
  const rawScoreB = match.score?.teamBScore || '';

  // Determine winner or leader for highlighting
  const isWinnerA = isCompleted && match.winnerId && (match.winnerId._id === match.teamA?._id || match.winnerId === match.teamA?._id);
  const isWinnerB = isCompleted && match.winnerId && (match.winnerId._id === match.teamB?._id || match.winnerId === match.teamB?._id);

  // Parse Cricket scores for CricHeroes style rendering: "147/10 (20.0 Ov)"
  const renderScoreValue = (scoreStr, isLeader) => {
    if (!scoreStr) return <span style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 600 }}>-</span>;

    if (typeof scoreStr === 'string' && scoreStr.toLowerCase().includes('yet to bat')) {
      return (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#94a3b8',
            fontStyle: 'italic',
            background: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: 6,
          }}
        >
          Yet to bat
        </span>
      );
    }

    // Check if score contains overs like "156/6 (20.0 ov)"
    const ovMatch = scoreStr.match(/^(.*?)\s*(\(.*?\))$/);
    if (ovMatch) {
      return (
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: isLeader ? '#0284c7' : '#0f172a',
              letterSpacing: '-0.5px',
            }}
          >
            {ovMatch[1]}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: 6 }}>
            {ovMatch[2]}
          </span>
        </div>
      );
    }

    // Check if sets score like "1 [21-17]"
    const setMatch = scoreStr.match(/^(\d+)\s*(\[.*?\])?$/);
    if (setMatch && (sportCode === 'BADMINTON' || sportCode === 'VOLLEYBALL')) {
      return (
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: isLeader ? '#0284c7' : '#0f172a',
            }}
          >
            {setMatch[1]}
          </span>
          {setMatch[2] && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginLeft: 5 }}>
              {setMatch[2]}
            </span>
          )}
        </div>
      );
    }

    return (
      <span
        style={{
          fontSize: '24px',
          fontWeight: 900,
          color: isLeader ? '#0284c7' : '#0f172a',
          letterSpacing: '-0.5px',
        }}
      >
        {scoreStr}
      </span>
    );
  };

  return (
    <div
      onClick={() => onOpenScorecard && onOpenScorecard(match)}
      style={{
        background: '#ffffff',
        border: isLive ? '1.5px solid #38bdf8' : '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: isLive
          ? '0 4px 12px -2px rgba(56, 189, 248, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
          : '0 2px 6px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isLive
          ? '0 8px 20px -2px rgba(56, 189, 248, 0.35)'
          : '0 8px 18px -2px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isLive
          ? '0 4px 12px -2px rgba(56, 189, 248, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
          : '0 2px 6px -1px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* Top Banner Accent Line for LIVE matches */}
      {isLive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
          }}
        />
      )}

      <div>
        {/* Header: Tournament Title & Status Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ flex: 1, paddingRight: 8 }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#64748b',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {match.tournamentId?.title || 'Arena Elite Championship'} • {match.round || `Match #${match.matchNumber}`}
            </span>
          </div>

          <div>
            {isLive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 12,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#dc2626',
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                LIVE
              </span>
            )}
            {isCompleted && (
              <span
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 12,
                  letterSpacing: '0.3px',
                }}
              >
                Result
              </span>
            )}
            {isScheduled && (
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 12,
                }}
              >
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* Subtitle: Date | Format | Ground */}
        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span>{meta.icon} {meta.label}</span>
          <span>•</span>
          <span>{formatDateTime(match.scheduledDate)}</span>
          <span>•</span>
          <span>{match.venue || match.tournamentId?.venueName || 'Main Arena'}</span>
        </div>

        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: 14 }} />

        {/* Main CricHeroes Scoreboard Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {/* Team A Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 6,
              background: isWinnerA ? '#f8fafc' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: isWinnerA ? 800 : 700,
                  color: isWinnerA ? '#0f172a' : '#334155',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nameA}
                {isWinnerA && <span style={{ marginLeft: 6, color: '#16a34a', fontSize: '13px' }}>✓</span>}
              </span>
            </div>

            <div style={{ flexShrink: 0, marginLeft: 12 }}>
              {renderScoreValue(rawScoreA, isWinnerA)}
            </div>
          </div>

          {/* Team B Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 6,
              background: isWinnerB ? '#f8fafc' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: isWinnerB ? 800 : 700,
                  color: isWinnerB ? '#0f172a' : '#334155',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nameB}
                {isWinnerB && <span style={{ marginLeft: 6, color: '#16a34a', fontSize: '13px' }}>✓</span>}
              </span>
            </div>

            <div style={{ flexShrink: 0, marginLeft: 12 }}>
              {renderScoreValue(rawScoreB, isWinnerB)}
            </div>
          </div>
        </div>

        {/* Cricket: 6-Ball Over Strip */}
        {sportCode === 'CRICKET' && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
            }}
          >
            {(() => {
              const details = match.score?.details || {};
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
                  compact={true}
                  balls={rawBalls}
                  overNumber={overNumber}
                  isOverCompleted={isOverCompleted}
                />
              );
            })()}
          </div>
        )}

        {/* CricHeroes Match Result / In-Play Status Banner */}
        <div
          style={{
            background: isCompleted ? '#f0fdf4' : isLive ? '#eff6ff' : '#f8fafc',
            border: isCompleted ? '1px solid #bbf7d0' : isLive ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: isCompleted ? '#15803d' : isLive ? '#1d4ed8' : '#64748b',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{isCompleted ? '🏆' : isLive ? '🔴' : '📅'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.score?.resultSummary || (isScheduled ? 'Scheduled Fixture' : 'Match in progress')}
          </span>
        </div>
      </div>

      {/* Card Footer: Knockout Bracket Trigger & Scorecard Hint */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenBracket) {
              onOpenBracket(match.tournamentId || match);
            }
          }}
          style={{
            background: '#f8fafc',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e0f2fe';
            e.currentTarget.style.borderColor = '#7dd3fc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#bae6fd';
          }}
          title="View Knockout Bracket Tree for this Tournament"
        >
          <span>🌳</span> View Bracket
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {match.assignedScorer && (
            <span
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={`Official Scorer: ${match.assignedScorer.name || match.assignedScorer.email}`}
            >
              <span>⏱️</span> Scorer Active
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              color: '#0284c7',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            Scorecard →
          </span>
        </div>
      </div>
    </div>
  );
}
