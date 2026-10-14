import React, { useState } from 'react';
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
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    venue: '',
    assignedScorer: '',
  });
  const [scheduleError, setScheduleError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Group matches by roundIndex
  const roundMap = {};
  matches.forEach((m) => {
    const r = m.roundIndex || 1;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(m);
  });
  const sortedRoundKeys = Object.keys(roundMap).sort((a, b) => Number(a) - Number(b));

  const openScheduleModal = (match) => {
    setEditingMatch(match);
    setScheduleError('');
    // Format date for datetime-local input
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

  return (
    <div>
      {/* Top Controls: View Mode & Regenerate Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setViewMode('tree')}
            style={{
              background: viewMode === 'tree' ? '#0284c7' : '#ffffff',
              color: viewMode === 'tree' ? '#ffffff' : '#475569',
              border: viewMode === 'tree' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🌳</span> Visual Bracket Tree
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              background: viewMode === 'list' ? '#0284c7' : '#ffffff',
              color: viewMode === 'list' ? '#ffffff' : '#475569',
              border: viewMode === 'list' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>📋</span> Fixtures List
          </button>
        </div>

        {isOrganizer && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={loading}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading ? '⚡ Regenerating...' : '🔄 Regenerate Fixtures & BYEs'}
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: 6, fontSize: '13px', marginBottom: 14 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* VIEW MODE 1: VISUAL BRACKET TREE */}
      {viewMode === 'tree' ? (
        <div
          style={{
            overflowX: 'auto',
            paddingBottom: 16,
            display: 'flex',
            gap: 24,
            minHeight: '440px',
            alignItems: 'stretch',
          }}
        >
          {sortedRoundKeys.map((roundKey) => {
            const roundMatches = roundMap[roundKey];
            const roundTitle = roundMatches[0]?.round || `Round ${roundKey}`;

            return (
              <div
                key={roundKey}
                style={{
                  minWidth: '290px',
                  maxWidth: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                {/* Round Header */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '8px 12px',
                    textAlign: 'center',
                    marginBottom: 14,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                    {roundTitle}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                {/* Match Cards aligned vertically */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    flex: 1,
                    gap: 16,
                  }}
                >
                  {roundMatches.map((m) => {
                    const isCompleted = m.status === 'COMPLETED';
                    const isBye = m.isBye || m.score?.note?.includes('BYE');

                    return (
                      <div
                        key={m._id}
                        style={{
                          background: '#ffffff',
                          border: isBye ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: 12,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          position: 'relative',
                        }}
                      >
                        {/* Match Title & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                            Match #{m.matchNumber}
                          </span>
                          {isBye ? (
                            <span
                              style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 10,
                                border: '1px solid #bbf7d0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}
                            >
                              ★ BYE - Advanced to Round 2
                            </span>
                          ) : (
                            <span
                              className={`badge ${
                                m.status === 'LIVE' ? 'badge-blue' : m.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'
                              }`}
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              {m.status}
                            </span>
                          )}
                        </div>

                        {/* Team A Row */}
                        <div
                          style={{
                            background: m.winnerId?._id === m.teamA?._id ? '#f0fdf4' : '#f8fafc',
                            border: m.winnerId?._id === m.teamA?._id ? '1px solid #86efac' : '1px solid #f1f5f9',
                            borderRadius: 6,
                            padding: '6px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                            <span style={{ fontSize: '13px' }}>🛡️</span>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: m.winnerId?._id === m.teamA?._id ? 800 : 600,
                                color: m.teamA ? '#0f172a' : '#94a3b8',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {m.teamA?.name || (m.sourceMatchA ? `Winner of Match #${m.sourceMatchA.matchNumber}` : 'TBD')}
                            </span>
                          </div>
                          {m.score?.teamAScore && (
                            <span style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7' }}>
                              {m.score.teamAScore}
                            </span>
                          )}
                        </div>

                        {/* Team B Row */}
                        {isBye ? (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px dashed #cbd5e1',
                              borderRadius: 6,
                              padding: '5px 10px',
                              color: '#94a3b8',
                              fontSize: '11px',
                              fontStyle: 'italic',
                              textAlign: 'center',
                              marginBottom: 8,
                            }}
                          >
                            (Automatic BYE Slot)
                          </div>
                        ) : (
                          <div
                            style={{
                              background: m.winnerId?._id === m.teamB?._id ? '#f0fdf4' : '#f8fafc',
                              border: m.winnerId?._id === m.teamB?._id ? '1px solid #86efac' : '1px solid #f1f5f9',
                              borderRadius: 6,
                              padding: '6px 10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                              <span style={{ fontSize: '13px' }}>🛡️</span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: m.winnerId?._id === m.teamB?._id ? 800 : 600,
                                  color: m.teamB ? '#0f172a' : '#94a3b8',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {m.teamB?.name || (m.sourceMatchB ? `Winner of Match #${m.sourceMatchB.matchNumber}` : 'TBD')}
                              </span>
                            </div>
                            {m.score?.teamBScore && (
                              <span style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7' }}>
                                {m.score.teamBScore}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: isOrganizer && !isBye ? 6 : 0 }}>
                          <span>⏰ {formatDateTime(m.scheduledDate) || 'TBD'}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📍 {m.venue || tournament.venueName || 'Main Ground'}
                          </span>
                          {m.assignedScorer && (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>
                              ⏱️ Scorer: {m.assignedScorer.name}
                            </span>
                          )}
                        </div>

                        {/* Organizer Action: Edit Schedule */}
                        {isOrganizer && !isBye && (
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, marginTop: 4, textAlign: 'right' }}>
                            <button
                              onClick={() => openScheduleModal(m)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              📅 Edit Schedule & Scorer →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
                    <span>📍 {m.venue || tournament.venueName}</span>
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
