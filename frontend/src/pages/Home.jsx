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
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 20px', width: '100%' }}>
      {/* Clean White Hero Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '44px 36px',
          border: '1px solid #e2e8f0',
          marginBottom: 36,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ maxWidth: '750px' }}>
          <span
            style={{
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid #bae6fd',
              display: 'inline-block',
              marginBottom: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            ⚡ Arena Elite Sports Management
          </span>
          <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2, marginBottom: 14 }}>
            The Premier Sports Tournament Platform
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', lineHeight: 1.6, marginBottom: 28 }}>
            Designed for college sports weeks, academy cups, and club federations. Register team squads, manage fixtures, and track live scores.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '11px 22px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Get Started →
            </Link>
            <Link
              to="/login"
              style={{
                background: '#f8fafc',
                color: '#0f172a',
                padding: '11px 22px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                border: '1px solid #cbd5e1',
              }}
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Sports Categories Filter */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Disciplines & Categories</h2>
          {selectedSport && (
            <button
              onClick={() => setSelectedSport('')}
              style={{ background: 'transparent', color: '#0284c7', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear Filter ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          <button
            onClick={() => setSelectedSport('')}
            style={{
              background: selectedSport === '' ? '#0284c7' : '#ffffff',
              border: selectedSport === '' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              color: selectedSport === '' ? '#ffffff' : '#334155',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: '13px',
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
                background: selectedSport === s.code ? '#0284c7' : '#ffffff',
                border: selectedSport === s.code ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: selectedSport === s.code ? '#ffffff' : '#334155',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: '13px',
                fontWeight: 600,
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

      {/* Open Tournaments Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Active Tournaments</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 2 }}>
              Explore tournaments currently open for squad registrations
            </p>
          </div>
          <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 600 }}>
            {filteredTournaments.length} Tournaments
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '48px', textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>🏆</span>
            <h3 style={{ color: '#0f172a', fontSize: '17px', marginTop: 10 }}>No tournaments found in this category</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 4 }}>
              Check back soon or create a tournament if you are a verified organizer!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {filteredTournaments.map((t) => (
              <div
                key={t._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>{t.title}</h3>
                      <div style={{ color: '#0284c7', fontSize: '12px', fontWeight: 600, marginTop: 2 }}>
                        {t.sportCategory} • {t.district}
                      </div>
                    </div>
                    <span className="badge badge-green">{t.format}</span>
                  </div>

                  <p style={{ color: '#475569', fontSize: '13px', marginBottom: 14, lineHeight: 1.5 }}>
                    {t.description || 'Open tournament for collegiate and club squads.'}
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>📍 Ground / Venue:</span>
                      <strong style={{ color: '#0f172a' }}>{t.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>📅 Event Dates:</span>
                      <strong style={{ color: '#334155' }}>
                        {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>⏰ Registration Ends:</span>
                      <strong style={{ color: '#b45309' }}>
                        {new Date(t.registrationDeadline).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Teams:</span>
                      <strong style={{ color: '#0284c7' }}>
                        {t.approvedTeamsCount} / {t.maxTeams} Approved
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    Hosted by: {t.organizer?.organizationName || t.organizer?.name || 'Tournament Committee'}
                  </span>
                  <Link
                    to="/login"
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '7px 14px',
                      borderRadius: 6,
                      fontSize: '12px',
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
