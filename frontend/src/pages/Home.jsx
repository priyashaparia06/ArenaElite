import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [tournamentsRes, sportsRes] = await Promise.all([
          API.get('/tournaments'),
          API.get('/public/sports').catch(() => ({ data: [] })),
        ]);
        setTournaments(tournamentsRes.data);
        setSports(sportsRes.data);
      } catch (err) {
        console.error('Failed to load public portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (!selectedSport) return true;
    return t.sportCategory === selectedSport;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* Hero Banner (Inspired by FIFA portal reference) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c4a6e 100%)',
          borderRadius: 20,
          padding: '48px 36px',
          border: '1px solid #24324f',
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 2 }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'inline-block',
              marginBottom: 16,
            }}
          >
            ⚡ Welcome to Arena Elite
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            The Premier Sports Tournament Platform
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '17px', lineHeight: 1.6, marginBottom: 28 }}>
            Built for college sports weeks, academy cups, and club federations. Register team squads, track knockout brackets, and follow live scores in real time.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                background: '#0284c7',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              Get Started Free →
            </Link>
            <Link
              to="/login"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Sports Categories Quick Filter Bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>Disciplines & Categories</h2>
          {selectedSport && (
            <button
              onClick={() => setSelectedSport('')}
              style={{ background: 'transparent', color: '#38bdf8', border: 'none', fontSize: '13px', cursor: 'pointer' }}
            >
              Clear Filter ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          <button
            onClick={() => setSelectedSport('')}
            style={{
              background: selectedSport === '' ? '#0284c7' : '#131b2e',
              border: selectedSport === '' ? '1px solid #38bdf8' : '1px solid #24324f',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 30,
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            All Sports
          </button>
          {sports.map((s) => (
            <button
              key={s._id}
              onClick={() => setSelectedSport(s.code)}
              style={{
                background: selectedSport === s.code ? '#0284c7' : '#131b2e',
                border: selectedSport === s.code ? '1px solid #38bdf8' : '1px solid #24324f',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 30,
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Open Tournaments Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>Active Tournaments & Competitions</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Explore tournaments currently open for team registration or live competition
            </p>
          </div>
          <span style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 600 }}>
            {filteredTournaments.length} Tournaments
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div style={{ background: '#131b2e', border: '1px dashed #24324f', borderRadius: 16, padding: '48px', textAlign: 'center' }}>
            <span style={{ fontSize: '40px' }}>🏆</span>
            <h3 style={{ color: '#fff', fontSize: '18px', marginTop: 12 }}>No tournaments found in this category</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 6 }}>
              Check back soon or create a tournament if you are a verified organizer!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
            {filteredTournaments.map((t) => (
              <div
                key={t._id}
                style={{
                  background: '#131b2e',
                  border: '1px solid #24324f',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#fff' }}>{t.title}</h3>
                      <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 600, marginTop: 2 }}>
                        {t.sportCategory} • {t.district}
                      </div>
                    </div>
                    <span className="badge badge-green">{t.format}</span>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: 16, lineHeight: 1.5 }}>
                    {t.description || 'Open tournament for collegiate and club squads.'}
                  </p>

                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 10, fontSize: '13px', marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>📍 Ground / Venue:</span>
                      <strong style={{ color: '#fff' }}>{t.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>📅 Event Dates:</span>
                      <strong style={{ color: '#cbd5e1' }}>
                        {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>⏰ Registration Ends:</span>
                      <strong style={{ color: '#f59e0b' }}>
                        {new Date(t.registrationDeadline).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Participating Teams:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {t.approvedTeamsCount} / {t.maxTeams} Approved
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    Hosted by: {t.organizer?.organizationName || t.organizer?.name || 'Tournament Committee'}
                  </span>
                  <Link
                    to="/login"
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Enter Squad →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
