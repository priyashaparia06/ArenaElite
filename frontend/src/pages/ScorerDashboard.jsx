import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export default function ScorerDashboard() {
  const { user } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'upcoming' | 'completed'

  const fetchAssignedMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/matches/scorer/my-matches');
      setMatches(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedMatches();
  }, []);

  // Partition matches into Today/Live, Upcoming, and Past/Completed
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const liveOrTodayMatches = matches.filter((m) => {
    const d = new Date(m.scheduledDate);
    return m.status === 'LIVE' || (d >= todayStart && d <= todayEnd);
  });

  const upcomingMatches = matches.filter((m) => {
    const d = new Date(m.scheduledDate);
    return m.status === 'SCHEDULED' && d > todayEnd;
  });

  const pastMatches = matches.filter((m) => {
    const d = new Date(m.scheduledDate);
    return m.status === 'COMPLETED' || m.status === 'ABANDONED' || (m.status !== 'LIVE' && d < todayStart);
  });

  const currentList =
    activeTab === 'today'
      ? liveOrTodayMatches
      : activeTab === 'upcoming'
      ? upcomingMatches
      : pastMatches;

  const getSportIcon = (cat) => {
    const map = {
      CRICKET: '🏏',
      FOOTBALL: '⚽',
      BASKETBALL: '🏀',
      BADMINTON: '🏸',
      VOLLEYBALL: '🏐',
      KABADDI: '🤼',
    };
    return map[cat?.toUpperCase()] || '🏆';
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '28px' }}>⏱️</span>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              Field Scorer Console
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 4 }}>
            Official Scorer: <strong style={{ color: '#0284c7' }}>{user?.name}</strong> ({user?.phone || user?.email}) | Jurisdiction: {user?.district}
          </p>
        </div>

        <button
          onClick={fetchAssignedMatches}
          disabled={loading}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#334155',
            padding: '8px 16px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🔄 Refresh Fixtures
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Grouping Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('today')}
          style={{
            background: activeTab === 'today' ? '#0284c7' : '#f8fafc',
            color: activeTab === 'today' ? '#ffffff' : '#475569',
            border: '1px solid',
            borderColor: activeTab === 'today' ? '#0284c7' : '#cbd5e1',
            padding: '8px 18px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⚡ Today / Live Matches</span>
          <span
            style={{
              background: activeTab === 'today' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              padding: '2px 7px',
              borderRadius: 10,
              fontSize: '11px',
            }}
          >
            {liveOrTodayMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: activeTab === 'upcoming' ? '#0284c7' : '#f8fafc',
            color: activeTab === 'upcoming' ? '#ffffff' : '#475569',
            border: '1px solid',
            borderColor: activeTab === 'upcoming' ? '#0284c7' : '#cbd5e1',
            padding: '8px 18px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>📅 Upcoming Matches</span>
          <span
            style={{
              background: activeTab === 'upcoming' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              padding: '2px 7px',
              borderRadius: 10,
              fontSize: '11px',
            }}
          >
            {upcomingMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          style={{
            background: activeTab === 'completed' ? '#0284c7' : '#f8fafc',
            color: activeTab === 'completed' ? '#ffffff' : '#475569',
            border: '1px solid',
            borderColor: activeTab === 'completed' ? '#0284c7' : '#cbd5e1',
            padding: '8px 18px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✅ Past / Completed</span>
          <span
            style={{
              background: activeTab === 'completed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              padding: '2px 7px',
              borderRadius: 10,
              fontSize: '11px',
            }}
          >
            {pastMatches.length}
          </span>
        </button>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          ⏳ Loading your assigned match fixtures...
        </div>
      ) : currentList.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 12,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '32px' }}>📋</span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginTop: 10 }}>
            {activeTab === 'today'
              ? 'No live or scheduled matches for today.'
              : activeTab === 'upcoming'
              ? 'No upcoming matches assigned yet.'
              : 'No completed matches in record.'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: 4 }}>
            When a tournament organizer delegates a fixture to your account, it will appear here immediately.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {currentList.map((m) => {
            const isLive = m.status === 'LIVE';
            const isCompleted = m.status === 'COMPLETED';

            return (
              <div
                key={m._id}
                style={{
                  background: '#ffffff',
                  border: isLive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Card Header: Tournament info & Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {getSportIcon(m.sportCategory)} {m.sportCategory} • {m.round}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>
                        {m.tournamentId?.title || 'Tournament Fixture'}
                      </h3>
                    </div>

                    <span
                      className={`badge ${
                        isLive ? 'badge-blue' : isCompleted ? 'badge-green' : 'badge-amber'
                      }`}
                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                    >
                      {isLive ? '🔴 LIVE' : m.status}
                    </span>
                  </div>

                  {/* Team A vs Team B Matchup */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      margin: '14px 0',
                    }}
                  >
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {m.teamA?.name || 'Team A'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                        {m.teamA?.players?.length || 0} registered players
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '4px 10px',
                        background: '#e2e8f0',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#475569',
                        margin: '0 10px',
                      }}
                    >
                      VS
                    </div>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {m.teamB?.name || 'Team B'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                        {m.teamB?.players?.length || 0} registered players
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Venue Details */}
                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📍</span>
                      <span>
                        <strong>Venue:</strong> {m.venue || m.tournamentId?.venueName || m.tournamentId?.district || 'TBD'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⏰</span>
                      <span>
                        <strong>Scheduled:</strong> {formatDateTime(m.scheduledDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🔢</span>
                      <span>
                        <strong>Fixture #:</strong> Match {m.matchNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delegation Tag */}
                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 12,
                    fontSize: '12px',
                    color: '#0369a1',
                    background: '#f0f9ff',
                    margin: '-4px -20px -20px -20px',
                    padding: '10px 20px',
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    🎯 Assigned to You ({user?.name})
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Awaiting Live Scoring Activation
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
