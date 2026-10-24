import React, { useState, useRef } from 'react';
import API from '../api/axios';
import { formatDateTime } from '../utils/dateUtils';

export default function BracketViewer({
  tournament,
  matches = [],
  scorers = [],
  isOrganizer = false,
  onMatchUpdated,
  onRegenerate,
  loading = false,
}) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [activeRoundFilter, setActiveRoundFilter] = useState('ALL');
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    venue: '',
    assignedScorer: '',
  });
  const [scheduleError, setScheduleError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const scrollContainerRef = useRef(null);
  const roundColumnRefs = useRef({});

  // Group matches by roundIndex
  const roundMap = {};
  matches.forEach((m) => {
    const r = m.roundIndex || 1;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(m);
  });
  const sortedRoundKeys = Object.keys(roundMap).sort((a, b) => Number(a) - Number(b));

  // Sort matches within each round by matchNumber ascending
  sortedRoundKeys.forEach((k) => {
    roundMap[k].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
  });

  const openScheduleModal = (match) => {
    setEditingMatch(match);
    setScheduleError('');
    let formattedDate = '';
    if (match.scheduledDate) {
      const d = new Date(match.scheduledDate);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    setScheduleForm({
      scheduledDate: formattedDate,
      venue: match.venue || tournament?.venueName || '',
      assignedScorer: match.assignedScorer?._id || '',
    });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;

    try {
      setSavingSchedule(true);
      setScheduleError('');
      const res = await API.put(`/matches/${editingMatch._id}/schedule`, {
        scheduledDate: scheduleForm.scheduledDate ? new Date(scheduleForm.scheduledDate).toISOString() : null,
        venue: scheduleForm.venue,
        assignedScorer: scheduleForm.assignedScorer || null,
      });

      setSuccessMessage(`Match #${editingMatch.matchNumber} schedule saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      if (onMatchUpdated) {
        onMatchUpdated(res.data.match);
      }
      setEditingMatch(null);
    } catch (err) {
      setScheduleError(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const scrollToRound = (roundKey) => {
    setActiveRoundFilter(roundKey);
    if (roundKey === 'ALL') {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else {
      const el = roundColumnRefs.current[roundKey];
      if (el && scrollContainerRef.current) {
        const containerLeft = scrollContainerRef.current.getBoundingClientRect().left;
        const elLeft = el.getBoundingClientRect().left;
        const currentScroll = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.scrollTo({
          left: currentScroll + (elLeft - containerLeft) - 20,
          behavior: 'smooth',
        });
      }
    }
  };

  if (!matches || matches.length === 0) {
    return (
      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '36px' }}>🏆</span>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: 12, marginBottom: 6 }}>
          No Match Fixtures Generated Yet
        </h4>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          Fixtures will appear here once the tournament organizer generates the knockout bracket.
        </p>
      </div>
    );
  }

  // --- Bracket Tree Layout Dimensions ---
  const CARD_WIDTH = 220; // width of each match card in px
  const CARD_HEIGHT = 86; // height of each match card in px
  const CONNECTOR_WIDTH = 46; // width of SVG fork connecting two rounds
  const BASE_ROW_HEIGHT = 124; // row height in Round 1 (base vertical unit)

  const numRounds = sortedRoundKeys.length;
  const firstRoundMatchesCount = (roundMap[sortedRoundKeys[0]] || []).length;
  const TOTAL_HEIGHT = Math.max(firstRoundMatchesCount * BASE_ROW_HEIGHT, 320);

  // Dynamic Y-coordinate calculator for round r (0-indexed) and match index m
  const getY = (rIndex, mIndex) => {
    if (rIndex === 0) {
      return mIndex * BASE_ROW_HEIGHT + BASE_ROW_HEIGHT / 2;
    }
    const prevCount = (roundMap[sortedRoundKeys[rIndex - 1]] || []).length;
    const topFeederIdx = 2 * mIndex;
    const botFeederIdx = 2 * mIndex + 1;

    const yTop = getY(rIndex - 1, Math.min(topFeederIdx, prevCount - 1));
    const yBot = botFeederIdx < prevCount ? getY(rIndex - 1, botFeederIdx) : yTop;
    return (yTop + yBot) / 2;
  };

  // Helper to format short date/time
  const getMatchTimeBadge = (m) => {
    if (m.isBye) {
      return <span style={{ color: '#15803d', fontWeight: 700, fontSize: '10px' }}>BYE</span>;
    }
    if (m.status === 'COMPLETED') {
      return <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10px' }}>Full time</span>;
    }
    if (m.status === 'LIVE') {
      return <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '10px' }}>● LIVE</span>;
    }
    if (m.scheduledDate) {
      const formatted = formatDateTime(m.scheduledDate);
      return <span style={{ color: '#64748b', fontSize: '10px' }}>{formatted ? formatted.slice(0, 16) : 'Scheduled'}</span>;
    }
    return <span style={{ color: '#94a3b8', fontSize: '10px' }}>TBD</span>;
  };

  return (
    <div>
      {/* Top Header & Round Navigation Pills (FIFA World Cup Style) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Knockout Bracket
            </h4>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0 0' }}>
              Single-elimination championship tree with direct tournament path
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setViewMode('tree')}
              style={{
                background: viewMode === 'tree' ? '#0284c7' : '#ffffff',
                color: viewMode === 'tree' ? '#ffffff' : '#475569',
                border: viewMode === 'tree' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌳 Bracket Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#0284c7' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : '#475569',
                border: viewMode === 'list' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📋 Fixtures List
            </button>

            {isOrganizer && onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={loading}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⚡...' : '🔄 Regenerate'}
              </button>
            )}
          </div>
        </div>

        {/* Round Filter Pills (FIFA style) */}
        {viewMode === 'tree' && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            <button
              onClick={() => scrollToRound('ALL')}
              style={{
                background: activeRoundFilter === 'ALL' ? '#0284c7' : '#ffffff',
                color: activeRoundFilter === 'ALL' ? '#ffffff' : '#475569',
                border: activeRoundFilter === 'ALL' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              All Rounds
            </button>
            {sortedRoundKeys.map((roundKey) => {
              const rMatches = roundMap[roundKey];
              const roundTitle = rMatches[0]?.round || `Round ${roundKey}`;
              const isActive = activeRoundFilter === roundKey;

              return (
                <button
                  key={roundKey}
                  onClick={() => scrollToRound(roundKey)}
                  style={{
                    background: isActive ? '#0284c7' : '#ffffff',
                    color: isActive ? '#ffffff' : '#475569',
                    border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: 20,
                    padding: '4px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {roundTitle}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '8px 12px', borderRadius: 6, fontSize: '13px', marginBottom: 12 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* VIEW MODE 1: VISUAL BRACKET TREE WITH CONNECTING LINES */}
      {viewMode === 'tree' ? (
        <div
          ref={scrollContainerRef}
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '24px 20px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          {/* Main Flex Row of Columns and Connecting SVG Lines */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'flex-start',
              minWidth: '100%',
              position: 'relative',
            }}
          >
            {sortedRoundKeys.map((roundKey, rIndex) => {
              const roundMatches = roundMap[roundKey];
              const roundTitle = roundMatches[0]?.round || `Round ${roundKey}`;
              const isNextRoundAvailable = rIndex < numRounds - 1;

              return (
                <React.Fragment key={roundKey}>
                  {/* Round Column */}
                  <div
                    ref={(el) => (roundColumnRefs.current[roundKey] = el)}
                    style={{
                      width: `${CARD_WIDTH}px`,
                      flexShrink: 0,
                      position: 'relative',
                    }}
                  >
                    {/* Round Header Column Label */}
                    <div
                      style={{
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '2px solid #e2e8f0',
                        marginBottom: 12,
                        paddingBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {roundTitle}
                      </span>
                    </div>

                    {/* Column Match Cards Area */}
                    <div style={{ position: 'relative', height: `${TOTAL_HEIGHT}px`, width: '100%' }}>
                      {roundMatches.map((m, mIndex) => {
                        const yCenter = getY(rIndex, mIndex);
                        const top = yCenter - CARD_HEIGHT / 2;
                        const isCompleted = m.status === 'COMPLETED';
                        const isBye = m.isBye || m.score?.note?.includes('BYE');
                        const isWinnerA = m.winnerId?._id && m.teamA?._id && m.winnerId._id === m.teamA._id;
                        const isWinnerB = m.winnerId?._id && m.teamB?._id && m.winnerId._id === m.teamB._id;

                        return (
                          <div
                            key={m._id}
                            onClick={() => isOrganizer && !isBye && openScheduleModal(m)}
                            title={isOrganizer && !isBye ? 'Click to edit date, venue, or assign scorer' : ''}
                            style={{
                              position: 'absolute',
                              top: `${top}px`,
                              left: 0,
                              width: `${CARD_WIDTH}px`,
                              height: `${CARD_HEIGHT}px`,
                              background: '#ffffff',
                              border: isBye ? '1.5px solid #86efac' : isCompleted ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '6px 8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              boxSizing: 'border-box',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              cursor: isOrganizer && !isBye ? 'pointer' : 'default',
                              transition: 'all 0.15s ease',
                              zIndex: 2,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.08)';
                              e.currentTarget.style.borderColor = isBye ? '#4ade80' : '#94a3b8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                              e.currentTarget.style.borderColor = isBye ? '#86efac' : isCompleted ? '#cbd5e1' : '#e2e8f0';
                            }}
                          >
                            {/* Card Top: Match ID & Status / Time */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1 }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: '#64748b',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                M{m.matchNumber}
                              </span>
                              {getMatchTimeBadge(m)}
                            </div>

                            {/* Team A Row */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '2px 4px',
                                borderRadius: 4,
                                background: isWinnerA ? '#f0fdf4' : 'transparent',
                                fontSize: '11px',
                                lineHeight: 1.2,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1 }}>
                                <span style={{ fontSize: '11px' }}>🛡️</span>
                                <span
                                  style={{
                                    fontWeight: isWinnerA ? 800 : 600,
                                    color: m.teamA ? '#0f172a' : '#94a3b8',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '145px',
                                  }}
                                >
                                  {m.teamA?.name || (m.sourceMatchA ? `W${m.sourceMatchA.matchNumber}` : 'TBD')}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontWeight: isWinnerA ? 800 : 700,
                                  color: isWinnerA ? '#16a34a' : '#334155',
                                  minWidth: '16px',
                                  textAlign: 'right',
                                }}
                              >
                                {m.score?.teamAScore || (isBye ? '★' : isCompleted ? '0' : '')}
                              </span>
                            </div>

                            {/* Team B Row */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '2px 4px',
                                borderRadius: 4,
                                background: isWinnerB ? '#f0fdf4' : 'transparent',
                                fontSize: '11px',
                                lineHeight: 1.2,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1 }}>
                                <span style={{ fontSize: '11px' }}>{isBye ? '⭕' : '🛡️'}</span>
                                <span
                                  style={{
                                    fontWeight: isWinnerB ? 800 : 600,
                                    color: m.teamB ? '#0f172a' : isBye ? '#94a3b8' : '#94a3b8',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '145px',
                                    fontStyle: isBye ? 'italic' : 'normal',
                                  }}
                                >
                                  {isBye ? 'BYE Slot' : m.teamB?.name || (m.sourceMatchB ? `W${m.sourceMatchB.matchNumber}` : 'TBD')}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontWeight: isWinnerB ? 800 : 700,
                                  color: isWinnerB ? '#16a34a' : '#334155',
                                  minWidth: '16px',
                                  textAlign: 'right',
                                }}
                              >
                                {isBye ? '' : (m.score?.teamBScore || (isCompleted ? '0' : ''))}
                              </span>
                            </div>

                            {/* Card Footer: Assigned Scorer or Schedule Hint */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                                📍 {m.venue || tournament?.venueName || 'Main Ground'}
                              </span>
                              {m.assignedScorer && (
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>⏱️</span>
                              )}
                              {isOrganizer && !isBye && (
                                <span style={{ color: '#0284c7', fontSize: '9px', fontWeight: 700 }}>EDIT</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connecting Bracket Lines SVG (Between this round and next round) */}
                  {isNextRoundAvailable && (
                    <div
                      style={{
                        width: `${CONNECTOR_WIDTH}px`,
                        flexShrink: 0,
                        position: 'relative',
                        paddingTop: '44px', // offset for round header title height
                      }}
                    >
                      <svg
                        width={CONNECTOR_WIDTH}
                        height={TOTAL_HEIGHT}
                        style={{ display: 'block', overflow: 'visible' }}
                      >
                        {(() => {
                          const nextRoundMatches = roundMap[sortedRoundKeys[rIndex + 1]] || [];
                          const paths = [];

                          for (let k = 0; k < nextRoundMatches.length; k++) {
                            const yTop = getY(rIndex, 2 * k);
                            const yBot = getY(rIndex, 2 * k + 1);
                            const yTarget = getY(rIndex + 1, k);
                            const xMid = CONNECTOR_WIDTH / 2;
                            const xEnd = CONNECTOR_WIDTH;
                            const R = Math.min(8, Math.max(2, (yBot - yTop) / 4));

                            // Curved bracket connector path
                            const pathData = `
                              M 0 ${yTop}
                              H ${xMid - R}
                              Q ${xMid} ${yTop} ${xMid} ${yTop + R}
                              V ${yBot - R}
                              Q ${xMid} ${yBot} ${xMid - R} ${yBot}
                              H 0
                              M ${xMid} ${yTarget}
                              H ${xEnd}
                            `;

                            paths.push(
                              <path
                                key={`conn-${rIndex}-${k}`}
                                d={pathData}
                                fill="none"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            );
                          }
                          return paths;
                        })()}
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: CHRONOLOGICAL FIXTURES LIST */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map((m) => {
            const isBye = m.isBye || m.score?.note?.includes('BYE');

            return (
              <div
                key={m._id}
                style={{
                  background: '#ffffff',
                  border: isBye ? '1px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                      {m.round} • Match #{m.matchNumber}
                    </span>
                    {isBye && (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                        ★ BYE - Advanced to Round 2
                      </span>
                    )}
                  </div>
                  <span className={`badge ${m.status === 'LIVE' ? 'badge-blue' : m.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`}>
                    {m.status}
                  </span>
                </div>

                {/* Matchup Banner */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ flex: 1, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                    {m.teamA?.name || (m.sourceMatchA ? `Winner of Match #${m.sourceMatchA.matchNumber}` : 'TBD')}
                  </div>
                  <span style={{ padding: '2px 8px', background: '#e2e8f0', borderRadius: 9999, fontSize: '11px', fontWeight: 800, color: '#64748b', margin: '0 10px' }}>
                    {isBye ? 'BYE' : 'VS'}
                  </span>
                  <div style={{ flex: 1, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                    {isBye ? '(Automatic Advancement)' : m.teamB?.name || (m.sourceMatchB ? `Winner of Match #${m.sourceMatchB.matchNumber}` : 'TBD')}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span>📍 {m.venue || tournament?.venueName}</span>
                    <span>⏰ {formatDateTime(m.scheduledDate) || 'TBD'}</span>
                    {m.assignedScorer && (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        ⏱️ Scorer: {m.assignedScorer.name}
                      </span>
                    )}
                  </div>

                  {isOrganizer && !isBye && (
                    <button
                      onClick={() => openScheduleModal(m)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#0284c7',
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      📅 Edit Schedule & Scorer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE & SCORER MODAL */}
      {editingMatch && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                📅 Schedule Match #{editingMatch.matchNumber} ({editingMatch.round})
              </h3>
              <button
                onClick={() => setEditingMatch(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '13px', color: '#334155' }}>
              <strong>{editingMatch.teamA?.name || 'TBD'}</strong> vs <strong>{editingMatch.teamB?.name || 'TBD'}</strong>
            </div>

            {scheduleError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 12px', borderRadius: 6, fontSize: '13px', marginBottom: 14 }}>
                ⚠️ {scheduleError}
              </div>
            )}

            <form onSubmit={handleSaveSchedule}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Scheduled Date & Time (DD-MM-YYYY HH:mm)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Venue / Ground Name
                </label>
                <input
                  type="text"
                  value={scheduleForm.venue}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, venue: e.target.value })}
                  placeholder="e.g. Sardar Patel Stadium, Ground #1"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  ⏱️ Assign Designated Field Scorer
                </label>
                <select
                  value={scheduleForm.assignedScorer}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assignedScorer: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                >
                  <option value="">-- No Field Scorer Assigned --</option>
                  {scorers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.phone || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 700, fontSize: '13px', cursor: savingSchedule ? 'not-allowed' : 'pointer' }}
                >
                  {savingSchedule ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
