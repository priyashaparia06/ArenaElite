import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import CricHeroesMatchCard from '../components/CricHeroesMatchCard';
import ViewerScorecardModal from '../components/ViewerScorecardModal';
import BracketViewer from '../components/BracketViewer';

const DEFAULT_SPORTS = [
  { code: 'CRICKET', name: 'Cricket', icon: '🏏' },
  { code: 'FOOTBALL', name: 'Football', icon: '⚽' },
  { code: 'BASKETBALL', name: 'Basketball', icon: '🏀' },
  { code: 'BADMINTON', name: 'Badminton', icon: '🏸' },
  { code: 'VOLLEYBALL', name: 'Volleyball', icon: '🏐' },
  { code: 'KABADDI', name: 'Kabaddi', icon: '🤼' },
];

export default function Home() {
  // Matches Feed State
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Filters State
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LIVE' | 'COMPLETED' | 'SCHEDULED'
  const [searchQuery, setSearchQuery] = useState('');
  const [sportsList, setSportsList] = useState(DEFAULT_SPORTS);

  // Modals State
  const [activeScorecardMatch, setActiveScorecardMatch] = useState(null);
  const [selectedTournamentForBracket, setSelectedTournamentForBracket] = useState(null);
  const [publicMatches, setPublicMatches] = useState([]);
  const [loadingBracket, setLoadingBracket] = useState(false);

  // Fetch Public Match Feed
  const fetchMatches = async (showLoading = false) => {
    try {
      if (showLoading) setLoadingMatches(true);
      const res = await API.get('/matches/public/feed');
      const data = res.data || [];
      setMatches(data);

      // Keep open scorecard modal in sync with live score updates
      setActiveScorecardMatch((curr) => {
        if (!curr) return null;
        return data.find((m) => m._id === curr._id) || curr;
      });
    } catch (err) {
      console.error('Failed to load match feed:', err);
    } finally {
      if (showLoading) setLoadingMatches(false);
    }
  };

  // Open Knockout Bracket Modal for a specific tournament or match
  const handleOpenBracketModal = async (tournamentOrMatch) => {
    let tournamentObj = null;
    let tournamentId = null;

    if (tournamentOrMatch?._id && tournamentOrMatch.title) {
      // Direct tournament object
      tournamentObj = tournamentOrMatch;
      tournamentId = tournamentOrMatch._id;
    } else if (tournamentOrMatch?.tournamentId) {
      // Match object with tournamentId
      if (typeof tournamentOrMatch.tournamentId === 'object') {
        tournamentObj = tournamentOrMatch.tournamentId;
        tournamentId = tournamentOrMatch.tournamentId._id;
      } else {
        tournamentId = tournamentOrMatch.tournamentId;
        tournamentObj = {
          _id: tournamentId,
          title: 'Tournament Knockout Fixtures',
          sportCategory: tournamentOrMatch.sportCategory,
          venueName: tournamentOrMatch.venue,
        };
      }
    } else if (typeof tournamentOrMatch === 'string') {
      tournamentId = tournamentOrMatch;
      tournamentObj = { _id: tournamentId, title: 'Tournament Fixtures' };
    }

    if (!tournamentId) return;

    setSelectedTournamentForBracket(tournamentObj || { _id: tournamentId, title: 'Tournament Fixtures' });
    try {
      setLoadingBracket(true);
      const res = await API.get(`/matches/tournament/${tournamentId}`);
      setPublicMatches(res.data || []);
    } catch (err) {
      console.error('Failed to load tournament fixtures:', err);
      setPublicMatches([]);
    } finally {
      setLoadingBracket(false);
    }
  };

  // Fetch Sports List on Mount
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await API.get('/public/sports');
        if (res.data && res.data.length > 0) {
          setSportsList(res.data);
        }
      } catch (err) {
        // Fallback to default sports
      }
    };

    fetchSports();
    fetchMatches(true);

    // Direct Real-time Score Push Stream via Server-Sent Events (SSE)
    // Directly pushes live ball-by-ball score updates without refreshing the page!
    const baseURL = (API.defaults.baseURL || 'http://localhost:5000/api').replace(/\/+$/, '');
    const sseUrl = `${baseURL}/matches/live-stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('score_update', (event) => {
      try {
        const updatedMatch = JSON.parse(event.data);
        if (!updatedMatch || !updatedMatch._id) return;

        // In-place score update: only the target match card re-renders; no whole page reload!
        setMatches((prevMatches) =>
          prevMatches.map((m) => (m._id === updatedMatch._id ? { ...m, ...updatedMatch } : m))
        );

        // Keep open scorecard modal in sync instantly if spectator is inspecting it
        setActiveScorecardMatch((curr) => {
          if (!curr || curr._id !== updatedMatch._id) return curr;
          return { ...curr, ...updatedMatch };
        });
      } catch (err) {
        console.error('Real-time score update parse error:', err);
      }
    });

    // Gentle fallback background sync (every 60 seconds) only as a network backup
    const fallbackSync = setInterval(() => fetchMatches(false), 60000);

    return () => {
      eventSource.close();
      clearInterval(fallbackSync);
    };
  }, []);

  // Filter Matches
  const filteredMatches = matches.filter((m) => {
    if (selectedSport !== 'ALL' && m.sportCategory !== selectedSport) {
      return false;
    }
    if (statusFilter !== 'ALL' && m.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameA = m.teamA?.name?.toLowerCase() || '';
      const nameB = m.teamB?.name?.toLowerCase() || '';
      const tourTitle = m.tournamentId?.title?.toLowerCase() || '';
      const venue = m.venue?.toLowerCase() || '';
      if (!nameA.includes(q) && !nameB.includes(q) && !tourTitle.includes(q) && !venue.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const liveMatchesCount = matches.filter((m) => m.status === 'LIVE').length;
  const completedMatchesCount = matches.filter((m) => m.status === 'COMPLETED').length;
  const scheduledMatchesCount = matches.filter((m) => m.status === 'SCHEDULED').length;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* CLEAN HEADER & BRANDING */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: 16,
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Gujarat Sports Central
            </span>
            {liveMatchesCount > 0 && (
              <span
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#dc2626',
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                {liveMatchesCount} Match{liveMatchesCount > 1 ? 'es' : ''} LIVE Now
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Live Scores & Matches
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
            Multi-sport live scores, highlighted match stats, and real-time scorecards across all categories.
          </p>
        </div>

        {/* Quick Refresh Feed & Live Push Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px',
              fontWeight: 700,
              color: '#16a34a',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '6px 12px',
              borderRadius: 20,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.25)',
              }}
            />
            Live Direct Push Active
          </span>
          <button
            onClick={() => fetchMatches(false)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🔄</span> Refresh Scores
          </button>
        </div>
      </div>

      {/* SPORT CATEGORY SELECTOR PILLS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          <button
            onClick={() => setSelectedSport('ALL')}
            style={{
              background: selectedSport === 'ALL' ? '#0284c7' : '#ffffff',
              border: selectedSport === 'ALL' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              color: selectedSport === 'ALL' ? '#ffffff' : '#334155',
              padding: '8px 18px',
              borderRadius: 20,
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🏆</span> All Sports
          </button>

          {sportsList.map((s) => (
            <button
              key={s.code}
              onClick={() => setSelectedSport(s.code)}
              style={{
                background: selectedSport === s.code ? '#0284c7' : '#ffffff',
                border: selectedSport === s.code ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: selectedSport === s.code ? '#ffffff' : '#334155',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: '13px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUB-FILTERS: STATUS TABS & SEARCH BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {[
            { id: 'ALL', label: `All (${matches.length})` },
            { id: 'LIVE', label: `🔴 Live (${liveMatchesCount})` },
            { id: 'COMPLETED', label: `✓ Results (${completedMatchesCount})` },
            { id: 'SCHEDULED', label: `📅 Upcoming (${scheduledMatchesCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                background: statusFilter === tab.id ? '#0f172a' : 'transparent',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search teams, tournament, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '280px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* LIVE MATCHES & CRICHEROES-STYLE SCORECARDS */}
      {loadingMatches ? (
        <div style={{ textAlign: 'center', padding: '70px', color: '#64748b' }}>
          <div style={{ fontSize: '28px', marginBottom: 8 }}>⚡</div>
          Loading live multi-sport matches and scores...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 14,
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '40px' }}>🏟️</span>
          <h3 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800, margin: '12px 0 4px 0' }}>
            No matches found
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            Try selecting a different sport discipline or clearing the status filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 18,
          }}
        >
          {filteredMatches.map((m) => (
            <CricHeroesMatchCard
              key={m._id}
              match={m}
              onOpenScorecard={(match) => setActiveScorecardMatch(match)}
              onOpenBracket={(tour) => handleOpenBracketModal(tour)}
            />
          ))}
        </div>
      )}

      {/* SPECTATOR SCORECARD DETAIL MODAL */}
      {activeScorecardMatch && (
        <ViewerScorecardModal
          match={activeScorecardMatch}
          onClose={() => setActiveScorecardMatch(null)}
          onOpenBracket={(tour) => {
            setActiveScorecardMatch(null);
            handleOpenBracketModal(tour);
          }}
        />
      )}

      {/* PUBLIC TOURNAMENT FIXTURES & BRACKET TREE MODAL */}
      {selectedTournamentForBracket && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 1300,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '1200px',
              width: '96vw',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 14,
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '18px' }}>🌳</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Official Knockout Bracket Tree
                  </span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {selectedTournamentForBracket.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {selectedTournamentForBracket.sportCategory} • 📍 {selectedTournamentForBracket.venueName || selectedTournamentForBracket.district || 'Tournament Grounds'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTournamentForBracket(null)}
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

            {loadingBracket ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '28px', marginBottom: 8 }}>🌳</div>
                Loading tournament fixtures and bracket tree...
              </div>
            ) : (
              <BracketViewer
                tournament={selectedTournamentForBracket}
                matches={publicMatches}
                isOrganizer={false}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <button
                onClick={() => setSelectedTournamentForBracket(null)}
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
                Close Bracket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
