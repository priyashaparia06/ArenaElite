import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function CaptainDashboard() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'browse' | 'applications'

  // Teams & Players State
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Team Form
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('FOOTBALL');
  const [district, setDistrict] = useState(user?.district || '');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Player Form
  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    jerseyNumber: '',
    role: '',
    studentOrGovtId: '',
  });

  // Tournaments Browse State
  const [tournaments, setTournaments] = useState([]);
  const [filterSport, setFilterSport] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [selectedTournamentForApply, setSelectedTournamentForApply] = useState(null);
  const [selectedTeamIdToApply, setSelectedTeamIdToApply] = useState('');
  const [applyNotes, setApplyNotes] = useState('');

  // Applications State
  const [myApplications, setMyApplications] = useState([]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [teamsRes, sportsRes, tournamentsRes, appsRes] = await Promise.all([
        API.get('/teams/my-teams'),
        API.get('/admin/sports'),
        API.get('/tournaments'),
        API.get('/tournaments/captain/my-applications'),
      ]);

      setTeams(teamsRes.data.teams);
      setSports(sportsRes.data);
      setTournaments(tournamentsRes.data);
      setMyApplications(appsRes.data);

      if (teamsRes.data.teams.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsRes.data.teams[0]);
      } else if (selectedTeam) {
        const updated = teamsRes.data.teams.find((t) => t._id === selectedTeam._id);
        setSelectedTeam(updated || teamsRes.data.teams[0] || null);
      }

      if (sportsRes.data.length > 0 && !sport) {
        setSport(sportsRes.data[0].code);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load captain dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/teams', { name: teamName, sport, district });
      setSuccess(`Team "${res.data.team.name}" registered successfully!`);
      setTeamName('');
      setShowCreateTeamModal(false);
      await fetchInitialData();
      setSelectedTeam(res.data.team);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await API.delete(`/teams/${teamId}`);
      setSelectedTeam(null);
      setSuccess('Team deleted successfully');
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setError('');
    setSuccess('');
    try {
      await API.post(`/teams/${selectedTeam._id}/players`, playerForm);
      setSuccess(`Player #${playerForm.jerseyNumber} ${playerForm.fullName} added to squad!`);
      setPlayerForm({ fullName: '', jerseyNumber: '', role: '', studentOrGovtId: '' });
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add player');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm('Remove this player from squad roster?')) return;
    try {
      await API.delete(`/teams/${selectedTeam._id}/players/${playerId}`);
      setSuccess('Player removed from roster');
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove player');
    }
  };

  const handleApplyForTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournamentForApply || !selectedTeamIdToApply) return;
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/tournaments/${selectedTournamentForApply._id}/apply`, {
        teamId: selectedTeamIdToApply,
        notes: applyNotes,
      });
      setSuccess(res.data.message);
      setSelectedTournamentForApply(null);
      setSelectedTeamIdToApply('');
      setApplyNotes('');
      await fetchInitialData();
      setActiveTab('applications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit tournament application');
    }
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t) => {
    const matchSport = !filterSport || t.sportCategory === filterSport;
    const matchDistrict = !filterDistrict || t.district.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchSport && matchDistrict;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 }}>
            ⚽ Team Captain Headquarters
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Captain: <strong style={{ color: '#38bdf8' }}>{user?.name}</strong> | Home District: {user?.district}
          </p>
        </div>
        {activeTab === 'teams' && (
          <button
            onClick={() => setShowCreateTeamModal(true)}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 600 }}
          >
            + Register New Team
          </button>
        )}
      </div>

      {/* Alert Notices */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          ✅ {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #24324f', marginBottom: 24 }}>
        {[
          { id: 'teams', label: `🛡️ My Teams & Squads (${teams.length})` },
          { id: 'browse', label: `🏆 Explore Tournaments (${tournaments.length})` },
          { id: 'applications', label: `📬 My Applications (${myApplications.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#1e293b' : 'transparent',
              color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MY TEAMS & SQUAD ROSTERS */}
      {activeTab === 'teams' && (
        <div>
          {teams.length === 0 ? (
            <div style={{ background: '#131b2e', border: '1px dashed #24324f', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: 8 }}>No teams registered yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: 16 }}>
                Create a team profile and add your players with jersey numbers and student/govt ID proofs.
              </p>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6 }}
              >
                + Create Your First Team
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: 24 }}>
              {/* Left Column: Team Selector */}
              <div>
                <h3 style={{ fontSize: '16px', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Registered Squads
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {teams.map((t) => {
                    const isSelected = selectedTeam?._id === t._id;
                    const sportInfo = sports.find((s) => s.code === t.sport);

                    return (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTeam(t)}
                        style={{
                          background: isSelected ? '#1e293b' : '#131b2e',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid #24324f',
                          borderRadius: 10,
                          padding: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{t.name}</div>
                          <span style={{ fontSize: '18px' }}>{sportInfo?.icon || '🏆'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '12px', color: '#94a3b8' }}>
                          <span className="badge badge-blue">{t.sport}</span>
                          <span>{t.players.length} Players</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Team Details & Roster */}
              {selectedTeam && (
                <div style={{ background: '#131b2e', border: '1px solid #24324f', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #24324f', paddingBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{selectedTeam.name}</h2>
                        <span className="badge badge-green">{selectedTeam.sport}</span>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>📍 Home District: {selectedTeam.district}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam._id)}
                      style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: 6, fontSize: '12px' }}
                    >
                      Delete Team
                    </button>
                  </div>

                  {/* Add Player to Squad Form */}
                  <div style={{ marginTop: 20, padding: 18, background: '#0f172a', borderRadius: 10, border: '1px solid #24324f' }}>
                    <h4 style={{ color: '#38bdf8', fontSize: '15px', fontWeight: 600, marginBottom: 12 }}>
                      + Add Player to Squad Roster
                    </h4>
                    <form onSubmit={handleAddPlayer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Full Name</label>
                        <input
                          required
                          placeholder="e.g. Lionel Messi"
                          value={playerForm.fullName}
                          onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Jersey #</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="999"
                          placeholder="e.g. 10"
                          value={playerForm.jerseyNumber}
                          onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Position / Role</label>
                        <input
                          required
                          placeholder="e.g. Forward, Goalkeeper"
                          value={playerForm.role}
                          onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Student / Govt ID Proof</label>
                        <input
                          required
                          placeholder="e.g. ID-88421"
                          value={playerForm.studentOrGovtId}
                          onChange={(e) => setPlayerForm({ ...playerForm, studentOrGovtId: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 6, fontWeight: 600 }}
                      >
                        Add Player
                      </button>
                    </form>
                  </div>

                  {/* Players Roster Table */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                        Current Squad Roster ({selectedTeam.players.length} Players)
                      </h4>
                    </div>

                    {selectedTeam.players.length === 0 ? (
                      <p style={{ color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                        No players registered yet. Use the form above to add your lineup.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #24324f', color: '#94a3b8' }}>
                              <th style={{ padding: '10px 12px' }}>Jersey #</th>
                              <th style={{ padding: '10px 12px' }}>Player Name</th>
                              <th style={{ padding: '10px 12px' }}>Role</th>
                              <th style={{ padding: '10px 12px' }}>ID Proof</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTeam.players.map((p) => (
                              <tr key={p._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#f59e0b' }}>
                                  #{p.jerseyNumber}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#fff' }}>{p.fullName}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{ background: '#0f172a', border: '1px solid #24324f', padding: '2px 8px', borderRadius: 4, color: '#cbd5e1' }}>
                                    {p.role}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {p.studentOrGovtId}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleRemovePlayer(p._id)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px' }}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE TOURNAMENTS */}
      {activeTab === 'browse' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              style={{ padding: '8px 12px' }}
            >
              <option value="">All Sports Categories</option>
              {sports.map((s) => (
                <option key={s._id} value={s.code}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Filter by District (e.g. Boston, Rajkot)..."
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              style={{ width: '280px' }}
            />
            <div style={{ color: '#94a3b8', fontSize: '14px', alignSelf: 'center' }}>
              Showing {filteredTournaments.length} open competitions
            </div>
          </div>

          {/* Tournaments Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
            {filteredTournaments.map((t) => {
              const sportInfo = sports.find((s) => s.code === t.sportCategory);
              // Check if captain has already registered a team
              const alreadyApplied = myApplications.some((a) => a.tournamentId === t._id);

              return (
                <div
                  key={t._id}
                  style={{
                    background: '#131b2e',
                    border: '1px solid #24324f',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '24px' }}>{sportInfo?.icon || '🏆'}</span>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{t.title}</h3>
                          <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>{t.sportCategory}</span>
                        </div>
                      </div>
                      <span className="badge badge-green">Open</span>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: 14 }}>
                      {t.description || 'Open tournament for qualified squads.'}
                    </p>

                    <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#94a3b8' }}>📍 Venue & District:</span>
                        <strong style={{ color: '#fff' }}>{t.venueName} ({t.district})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#94a3b8' }}>📅 Event Schedule:</span>
                        <strong style={{ color: '#cbd5e1' }}>
                          {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#94a3b8' }}>⏰ Entry Deadline:</span>
                        <strong style={{ color: '#f59e0b' }}>
                          {new Date(t.registrationDeadline).toLocaleDateString()}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Slots Filled:</span>
                        <strong style={{ color: '#38bdf8' }}>
                          {t.approvedTeamsCount} / {t.maxTeams} Teams Approved
                        </strong>
                      </div>
                    </div>

                    {t.rules && (
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: 14 }}>
                        <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '11px' }}>
                          Tournament Rules:
                        </span>
                        {t.rules}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      Org: {t.organizer?.organizationName || t.organizer?.name || 'Authorized Host'}
                    </span>

                    {alreadyApplied ? (
                      <span className="badge badge-amber">Already Applied</span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTournamentForApply(t);
                          // Auto select matching team
                          const matchingTeams = teams.filter((tm) => tm.sport === t.sportCategory);
                          setSelectedTeamIdToApply(matchingTeams[0]?._id || '');
                        }}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        Register Squad
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 }}>
            📬 Submitted Tournament Applications
          </h2>

          {myApplications.length === 0 ? (
            <div style={{ background: '#131b2e', border: '1px dashed #24324f', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '15px' }}>
                You haven't applied to any tournaments yet. Switch to the "Explore Tournaments" tab to register your squad!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              {myApplications.map((app, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#131b2e',
                    border: '1px solid #24324f',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{app.tournamentTitle}</h3>
                      <div style={{ color: '#38bdf8', fontSize: '13px' }}>
                        {app.sportCategory} • {app.district}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        app.status === 'APPROVED'
                          ? 'badge-approved'
                          : app.status === 'PENDING'
                          ? 'badge-pending'
                          : 'badge-rejected'
                      }`}
                    >
                      {app.status === 'PENDING' ? 'Pending Review' : app.status}
                    </span>
                  </div>

                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Registered Squad:</span>
                      <strong style={{ color: '#fff' }}>{app.team?.name || 'Selected Team'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>📍 Assigned Venue:</span>
                      <strong style={{ color: '#cbd5e1' }}>{app.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>📅 Tournament Dates:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {new Date(app.startDate).toLocaleDateString()} – {new Date(app.endDate).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>

                  {app.status === 'APPROVED' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: 10, borderRadius: 6, fontSize: '12px', color: '#34d399', marginBottom: 10 }}>
                      🎉 Application Approved! Your team has been slotted into the tournament bracket.
                    </div>
                  )}

                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', padding: 10, borderRadius: 6, fontSize: '12px', color: '#fb7185', marginBottom: 10 }}>
                      Reason: {app.rejectionReason}
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Organizer: {app.organizer?.organizationName || app.organizer?.name} ({app.organizer?.phone || app.organizer?.email})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
              🛡️ Register New Team / Squad
            </h3>
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Team Name</label>
                <input
                  required
                  placeholder="e.g. Saurashtra Strikers FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Sport Category</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {sports.map((s) => (
                      <option key={s._id} value={s.code}>
                        {s.icon} {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>District / City</label>
                  <input
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px' }}
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY FOR TOURNAMENT MODAL */}
      {selectedTournamentForApply && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: 12 }}>
              🏆 Register Squad for {selectedTournamentForApply.title}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: 16 }}>
              Select which of your registered {selectedTournamentForApply.sportCategory} teams will participate.
            </p>

            <form onSubmit={handleApplyForTournament} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Select Eligible Team ({selectedTournamentForApply.sportCategory})
                </label>
                {teams.filter((t) => t.sport === selectedTournamentForApply.sportCategory).length === 0 ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: 10, borderRadius: 6, fontSize: '13px' }}>
                    ⚠️ You do not have any registered teams for {selectedTournamentForApply.sportCategory}. Please register a team in that sport first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedTeamIdToApply}
                    onChange={(e) => setSelectedTeamIdToApply(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Team...</option>
                    {teams
                      .filter((t) => t.sport === selectedTournamentForApply.sportCategory)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.players.length} players)
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Notes for Organizer (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Jersey color, arrival notes..."
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTournamentForApply(null)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedTeamIdToApply}
                  style={{
                    background: !selectedTeamIdToApply ? '#475569' : '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    cursor: !selectedTeamIdToApply ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit Squad Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}