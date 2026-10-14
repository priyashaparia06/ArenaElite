import React, { useState, useEffect } from 'react';
import API from '../api/axios';

export default function ByeStrategyModal({
  isOpen,
  onClose,
  tournament,
  onConfirm,
  loading,
}) {
  const [selectedStrategy, setSelectedStrategy] = useState('SEEDED');
  const [teamStats, setTeamStats] = useState(null);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (isOpen && tournament?._id) {
      fetchStats();
    }
  }, [isOpen, tournament]);

  const fetchStats = async () => {
    try {
      setFetchingStats(true);
      setStatsError('');
      const res = await API.get(`/matches/tournament/${tournament._id}/team-stats`);
      setTeamStats(res.data);
    } catch (err) {
      console.error('Failed to load team stats for BYE preview:', err);
      setStatsError('Could not load live performance metrics. Default seeding will use squad rosters.');
    } finally {
      setFetchingStats(false);
    }
  };

  if (!isOpen || !tournament) return null;

  const approvedTeams = tournament.registeredTeams?.filter((r) => r.status === 'APPROVED') || [];
  const N = approvedTeams.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(N || 2)));
  const byesCount = bracketSize - N;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 12,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '24px' }}>⚖️</span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                BYE Allocation Strategy Required
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
              {tournament.title} • {tournament.sportCategory}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: '#94a3b8',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Bracket Math Banner */}
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>
                Single-Elimination Knockout Math:
              </div>
              <div style={{ fontSize: '13px', color: '#0c4a6e', marginTop: 2 }}>
                Approved Squads: <strong>{N}</strong> &nbsp;→&nbsp; Bracket Size: <strong>{bracketSize}</strong> &nbsp;→&nbsp;{' '}
                <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: '12px' }}>
                  {byesCount} {byesCount === 1 ? 'BYE' : 'BYEs'} Required
                </span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1' }}>
              Round 1 will have {bracketSize / 2 - byesCount} match(es) + {byesCount} direct BYE advancement(s)
            </div>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#334155', fontWeight: 600, marginBottom: 12 }}>
          Choose how the {byesCount} automatic BYE(s) to Round 2 should be awarded:
        </p>

        {/* Strategy Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          {/* Option A: Seeded by Past Performance */}
          <div
            onClick={() => setSelectedStrategy('SEEDED')}
            style={{
              border: selectedStrategy === 'SEEDED' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedStrategy === 'SEEDED' ? '#f8fafc' : '#ffffff',
              borderRadius: 10,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="radio"
                name="byeStrategy"
                value="SEEDED"
                checked={selectedStrategy === 'SEEDED'}
                onChange={() => setSelectedStrategy('SEEDED')}
                style={{ marginTop: 4, cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                    Option A: Seeded by Past Performance / History
                  </strong>
                  <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    Merit-Based Seeding
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 10px 0', lineHeight: 1.4 }}>
                  Approved squads are ranked by historical win percentage and match victories. The top{' '}
                  <strong>{byesCount}</strong> {byesCount === 1 ? 'squad receives' : 'squads receive'} an automatic BYE and advance directly to Round 2.
                </p>

                {/* Team Ranking Preview Table */}
                {selectedStrategy === 'SEEDED' && (
                  <div style={{ marginTop: 10, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Seeded Ranking Preview</span>
                      {fetchingStats && <span>Loading live stats...</span>}
                    </div>

                    {statsError ? (
                      <div style={{ padding: '10px 12px', fontSize: '12px', color: '#b45309' }}>
                        {statsError}
                      </div>
                    ) : teamStats?.teams?.length > 0 ? (
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px 10px' }}>Rank</th>
                              <th style={{ padding: '6px 10px' }}>Team Name</th>
                              <th style={{ padding: '6px 10px', textAlign: 'center' }}>Win Rate</th>
                              <th style={{ padding: '6px 10px', textAlign: 'center' }}>Wins / Played</th>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>Allocation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamStats.teams.map((t, index) => {
                              const getsBye = index < byesCount;
                              return (
                                <tr
                                  key={t.teamId}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    background: getsBye ? '#f0fdf4' : 'transparent',
                                  }}
                                >
                                  <td style={{ padding: '6px 10px', fontWeight: 700, color: getsBye ? '#166534' : '#475569' }}>
                                    #{index + 1}
                                  </td>
                                  <td style={{ padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>
                                    {t.name}
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                                    {t.winRate}%
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>
                                    {t.totalWins} / {t.totalMatches}
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                    {getsBye ? (
                                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                                        ★ Automatic BYE
                                      </span>
                                    ) : (
                                      <span style={{ color: '#64748b', fontSize: '11px' }}>
                                        Round 1
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
                        Loading squad performance records...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Option B: Random Lottery Draw */}
          <div
            onClick={() => setSelectedStrategy('LOTTERY')}
            style={{
              border: selectedStrategy === 'LOTTERY' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedStrategy === 'LOTTERY' ? '#f8fafc' : '#ffffff',
              borderRadius: 10,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="radio"
                name="byeStrategy"
                value="LOTTERY"
                checked={selectedStrategy === 'LOTTERY'}
                onChange={() => setSelectedStrategy('LOTTERY')}
                style={{ marginTop: 4, cursor: 'pointer' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                    Option B: Random Lottery Draw
                  </strong>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    Fisher-Yates Shuffle
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  All {N} approved squads are randomized in a fair lottery draw. <strong>{byesCount}</strong> {byesCount === 1 ? 'squad is' : 'squads are'} randomly drawn to receive BYEs directly to Round 2, and the remaining squads are paired for Round 1 fixtures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '9px 18px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedStrategy)}
            disabled={loading}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '9px 22px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? '⚡ Generating Fixtures...' : `Confirm & Generate Fixtures (${selectedStrategy === 'SEEDED' ? 'Seeded BYEs' : 'Lottery BYEs'})`}
          </button>
        </div>
      </div>
    </div>
  );
}
