import React from 'react';

export default function ByeStrategyModal({
  isOpen,
  onClose,
  tournament,
  onConfirm,
  loading,
}) {
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
          maxWidth: '680px',
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
              <span style={{ fontSize: '24px' }}>🎲</span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Random Lottery Bracket Generation
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
                Single-Elimination Knockout Format:
              </div>
              <div style={{ fontSize: '13px', color: '#0c4a6e', marginTop: 2 }}>
                Approved Squads: <strong>{N}</strong> &nbsp;→&nbsp; Bracket Size: <strong>{bracketSize}</strong> &nbsp;→&nbsp;{' '}
                <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: '12px' }}>
                  {byesCount > 0 ? `${byesCount} ${byesCount === 1 ? 'BYE' : 'BYEs'} Required` : 'Full Bracket (0 BYEs)'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1' }}>
              {byesCount > 0
                ? `Round 1 will have ${bracketSize / 2 - byesCount} match(es) + ${byesCount} direct BYE advancement(s)`
                : `Round 1 will have ${bracketSize / 2} direct knockout matches`}
            </div>
          </div>
        </div>

        {/* Random Lottery Explanation Card */}
        <div
          style={{
            border: '2px solid #0284c7',
            background: '#f8fafc',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '18px' }}>🎲</span>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>
              Fair Random Lottery Draw
            </strong>
            <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              Fisher-Yates Shuffle
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            All <strong>{N}</strong> approved squads are randomized in an unbiased lottery draw.
            {byesCount > 0 ? (
              <>
                {' '}
                <strong>{byesCount}</strong> {byesCount === 1 ? 'squad will be' : 'squads will be'} randomly drawn to receive automatic BYEs directly into Round 2, and the remaining squads will be paired for Round 1 fixtures.
              </>
            ) : (
              <>
                {' '}
                All squads are randomly paired for Round 1 knockout fixtures.
              </>
            )}
          </p>
        </div>

        {/* Participating Squads Pool */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
            Squads Entering the Random Lottery Draw ({N}):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
            {approvedTeams.map((r, idx) => {
              const team = r.teamId;
              const teamName = typeof team === 'object' ? team?.name : `Squad #${idx + 1}`;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>#{idx + 1}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {teamName}
                  </span>
                </div>
              );
            })}
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
            onClick={() => onConfirm('LOTTERY')}
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
            {loading ? '⚡ Generating Fixtures...' : '🎲 Confirm & Draw Random Fixtures'}
          </button>
        </div>
      </div>
    </div>
  );
}
