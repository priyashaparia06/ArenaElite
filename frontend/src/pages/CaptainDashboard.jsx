import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import SearchableCitySelect from '../components/SearchableCitySelect';
import { getRolesForSport } from '../constants/sportRoles';
import { formatDate, formatDateTime } from '../utils/dateUtils';

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
  const [applyModalError, setApplyModalError] = useState('');

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

  // Keep playerForm role in sync with selected team's sport
  useEffect(() => {
    if (selectedTeam?.sport) {
      const roles = getRolesForSport(selectedTeam.sport);
      setPlayerForm((prev) => ({
        ...prev,
        role: prev.role && roles.includes(prev.role) ? prev.role : (roles[0] || ''),
      }));
    }
  }, [selectedTeam?._id, selectedTeam?.sport]);

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
      const roles = getRolesForSport(selectedTeam.sport);
      const payload = {
        ...playerForm,
        role: playerForm.role || roles[0] || 'Player',
      };
      await API.post(`/teams/${selectedTeam._id}/players`, payload);
      setSuccess(`Player #${playerForm.jerseyNumber} ${playerForm.fullName} added to squad!`);
      setPlayerForm({
        fullName: '',
        jerseyNumber: '',
        role: roles[0] || '',
        studentOrGovtId: '',
      });
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
    setApplyModalError('');
    if (!selectedTournamentForApply || !selectedTeamIdToApply) {
      setApplyModalError('Please select an eligible team to apply');
      return;
    }

    const chosenTeam = teams.find((t) => t._id === selectedTeamIdToApply);
    const currentSportCat = sports.find((s) => s.code === selectedTournamentForApply.sportCategory);
    const minRequired = currentSportCat?.minSquadSize || (selectedTournamentForApply.sportCategory === 'CRICKET' ? 11 : selectedTournamentForApply.sportCategory === 'FOOTBALL' ? 11 : 1);

    if (chosenTeam && chosenTeam.players.length < minRequired) {
      setApplyModalError(
        `Your team must have at least ${minRequired} players registered to enter this tournament (Current: ${chosenTeam.players.length})`
      );
      return;
    }

    try {
      const res = await API.post(`/tournaments/${selectedTournamentForApply._id}/apply`, {
        teamId: selectedTeamIdToApply,
        notes: applyNotes,
      });
      setSuccess(res.data.message);
      setSelectedTournamentForApply(null);
      setSelectedTeamIdToApply('');
      setApplyNotes('');
      setApplyModalError('');
      await fetchInitialData();
      setActiveTab('applications');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit tournament application';
      setApplyModalError(errorMsg);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchSport = !filterSport || t.sportCategory === filterSport;
    const matchDistrict = !filterDistrict || t.district.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchSport && matchDistrict;
  });

  return (
    <div style={{ padding: '28px 24px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
            ⚽ Team Captain Headquarters
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Captain: <strong style={{ color: '#0284c7' }}>{user?.name}</strong> | Home District: {user?.district}
          </p>
        </div>
        {activeTab === 'teams' && (
          <button
            onClick={() => setShowCreateTeamModal(true)}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontWeight: 600, fontSize: '13px' }}
          >
            + Register New Team
          </button>
        )}
      </div>

      {/* Alert Notices */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '14px' }}>
          ✅ {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        {[
          { id: 'teams', label: `🛡️ My Teams & Squads (${teams.length})` },
          { id: 'browse', label: `🏆 Explore Tournaments (${tournaments.length})` },
          { id: 'applications', label: `📬 My Applications (${myApplications.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              color: activeTab === tab.id ? '#0284c7' : '#64748b',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0284c7' : '2px solid transparent',
              padding: '10px 18px',
              fontSize: '14px',
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
            <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
              <h3 style={{ color: '#0f172a', fontSize: '17px', marginBottom: 6 }}>No teams registered yet</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 16 }}>
                Create a team profile and add your players with jersey numbers and student/govt ID proofs.
              </p>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: '13px', fontWeight: 600 }}
              >
                + Create Your First Team
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: 24 }}>
              {/* Left Column: Team Selector */}
              <div>
                <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
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
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{t.name}</div>
                          <span style={{ fontSize: '18px' }}>{sportInfo?.icon || '🏆'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '12px', color: '#64748b' }}>
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
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{selectedTeam.name}</h2>
                        <span className="badge badge-green">{selectedTeam.sport}</span>
                      </div>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>📍 Home District: {selectedTeam.district}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam._id)}
                      style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px 12px', borderRadius: 4, fontSize: '12px', fontWeight: 500 }}
                    >
                      Delete Team
                    </button>
                  </div>

                  {/* Add Player to Squad Form */}
                  <div style={{ marginTop: 20, padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: '#0284c7', fontSize: '14px', fontWeight: 700, marginBottom: 12 }}>
                      + Add Player to Squad Roster
                    </h4>
                    <form onSubmit={handleAddPlayer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Full Name</label>
                        <input
                          required
                          placeholder="e.g. Lionel Messi"
                          value={playerForm.fullName}
                          onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Jersey #</label>
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
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Position / Role ({selectedTeam.sport})
                        </label>
                        <select
                          required
                          value={playerForm.role || getRolesForSport(selectedTeam.sport)[0]}
                          onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                          style={{ width: '100%', height: '38px', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                        >
                          {getRolesForSport(selectedTeam.sport).map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Student / Govt ID Proof</label>
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
                    <h4 style={{ color: '#0f172a', fontSize: '15px', fontWeight: 600, marginBottom: 12 }}>
                      Current Squad Roster ({selectedTeam.players.length} Players)
                    </h4>

                    {selectedTeam.players.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                        No players registered yet. Use the form above to add your lineup.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                              <th style={{ padding: '8px 12px' }}>Jersey #</th>
                              <th style={{ padding: '8px 12px' }}>Player Name</th>
                              <th style={{ padding: '8px 12px' }}>Role</th>
                              <th style={{ padding: '8px 12px' }}>ID Proof</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTeam.players.map((p) => {
                              const isCaptainPlayer = p.isCaptain || p.role?.toLowerCase() === 'captain';
                              return (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: isCaptainPlayer ? '#f8fafc' : 'transparent' }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#b45309' }}>
                                    #{p.jerseyNumber}
                                  </td>
                                  <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 500 }}>
                                    {p.fullName}
                                    {isCaptainPlayer && (
                                      <span className="badge badge-approved" style={{ marginLeft: 8, fontSize: '11px' }}>
                                        👑 Captain
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px 12px' }}>
                                    <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 4, color: '#334155' }}>
                                      {p.role}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                                    {p.studentOrGovtId}
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                    {isCaptainPlayer ? (
                                      <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', fontWeight: 500 }} title="Team Captain cannot be removed">
                                        🔒 Squad Captain
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleRemovePlayer(p._id)}
                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <div style={{ width: '280px' }}>
              <SearchableCitySelect
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                placeholder="Filter by city..."
              />
            </div>
            {filterDistrict && (
              <button
                onClick={() => setFilterDistrict('')}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', fontSize: '12px', borderRadius: 4, cursor: 'pointer' }}
              >
                Clear City Filter
              </button>
            )}
            <div style={{ color: '#64748b', fontSize: '13px', alignSelf: 'center' }}>
              Showing {filteredTournaments.length} open competitions
            </div>
          </div>

          {/* Tournaments Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {filteredTournaments.map((t) => {
              const sportInfo = sports.find((s) => s.code === t.sportCategory);
              const alreadyApplied = myApplications.some((a) => a.tournamentId === t._id);

              return (
                <div
                  key={t._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {(() => {
                    const isDeadlinePassed = new Date() > new Date(t.registrationDeadline);
                    const isSlotsFull = (t.approvedTeamsCount || 0) >= t.maxTeams;
                    const isRegOpen = t.isRegistrationOpen && !isDeadlinePassed && !isSlotsFull;

                    return (
                      <>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '24px' }}>{sportInfo?.icon || '🏆'}</span>
                              <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>{t.title}</h3>
                                <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 600 }}>{t.sportCategory}</span>
                              </div>
                            </div>
                            <span className={`badge ${isRegOpen ? 'badge-green' : 'badge-amber'}`}>
                              {isRegOpen
                                ? 'Registration Open'
                                : isDeadlinePassed
                                ? 'Registration Closed (Deadline Passed)'
                                : isSlotsFull
                                ? 'Registration Closed (Slots Full)'
                                : 'Registration Closed'}
                            </span>
                          </div>

                          <p style={{ color: '#475569', fontSize: '13px', marginBottom: 14 }}>
                            {t.description || 'Open tournament for qualified squads.'}
                          </p>

                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ color: '#64748b' }}>📍 Venue & District:</span>
                              <strong style={{ color: '#0f172a' }}>{t.venueName} ({t.district})</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ color: '#64748b' }}>📅 Event Schedule:</span>
                              <strong style={{ color: '#334155' }}>
                                {formatDate(t.startDate)} – {formatDate(t.endDate)}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ color: '#64748b' }}>⏰ Entry Deadline:</span>
                              <strong style={{ color: isDeadlinePassed ? '#dc2626' : '#b45309' }}>
                                {formatDate(t.registrationDeadline)} {isDeadlinePassed ? '(Passed)' : ''}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>Slots Filled:</span>
                              <strong style={{ color: '#0284c7' }}>
                                {t.approvedTeamsCount} / {t.maxTeams} Teams Approved
                              </strong>
                            </div>
                          </div>

                          {t.rules && (
                            <div style={{ fontSize: '12px', color: '#475569', marginBottom: 14 }}>
                              <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>
                                Tournament Rules:
                              </span>
                              {t.rules}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            Org: {t.organizer?.organizationName || t.organizer?.name || 'Authorized Host'}
                          </span>

                          {alreadyApplied ? (
                            <span className="badge badge-amber">Already Applied</span>
                          ) : !isRegOpen ? (
                            <button
                              disabled
                              style={{
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                padding: '8px 16px',
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'not-allowed',
                              }}
                            >
                              {isDeadlinePassed ? 'Deadline Passed' : isSlotsFull ? 'Slots Filled' : 'Registration Closed'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTournamentForApply(t);
                                setApplyModalError('');
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
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div>
          <h2 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
            📬 Submitted Tournament Applications
          </h2>

          {myApplications.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                You haven't applied to any tournaments yet. Switch to the "Explore Tournaments" tab to register your squad!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              {myApplications.map((app, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 22,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>{app.tournamentTitle}</h3>
                      <div style={{ color: '#0284c7', fontSize: '12px', fontWeight: 600 }}>
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

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>Registered Squad:</span>
                      <strong style={{ color: '#0f172a' }}>{app.team?.name || 'Selected Team'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>📍 Assigned Venue:</span>
                      <strong style={{ color: '#334155' }}>{app.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>📅 Tournament Dates:</span>
                      <strong style={{ color: '#0284c7' }}>
                        {formatDate(app.startDate)} – {formatDate(app.endDate)}
                      </strong>
                    </div>
                    {app.appliedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ color: '#64748b' }}>Submitted On:</span>
                        <strong style={{ color: '#475569' }}>
                          {formatDate(app.appliedAt)}
                        </strong>
                      </div>
                    )}
                  </div>

                  {app.status === 'APPROVED' && (
                    <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: 10, borderRadius: 6, fontSize: '12px', color: '#15803d', marginBottom: 10 }}>
                      🎉 Application Approved! Your team has been slotted into the tournament bracket.
                    </div>
                  )}

                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: 10, borderRadius: 6, fontSize: '12px', color: '#b91c1c', marginBottom: 10 }}>
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
            <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
              🛡️ Register New Team / Squad
            </h3>
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Team Name</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Sport Category</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>District / City (Gujarat)</label>
                  <SearchableCitySelect
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Select Gujarat city..."
                    required
                  />
                </div>
              </div>

              {/* Default Captain Notice */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 14px', fontSize: '13px', color: '#0369a1' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>👑 Default Team Captain in Squad Roster</div>
                <div>
                  You (<strong>{user?.name}</strong>) will be automatically designated as <strong>Player #1</strong> with status <strong>"Captain"</strong> (Jersey #1) in the squad lineup.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', fontWeight: 600 }}
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY FOR TOURNAMENT MODAL */}
      {selectedTournamentForApply && (() => {
        const chosenTeam = teams.find((t) => t._id === selectedTeamIdToApply);
        const currentSportCat = sports.find((s) => s.code === selectedTournamentForApply.sportCategory);
        const minRequired = currentSportCat?.minSquadSize || (selectedTournamentForApply.sportCategory === 'CRICKET' ? 11 : selectedTournamentForApply.sportCategory === 'FOOTBALL' ? 11 : 1);
        const isUnderSized = chosenTeam && chosenTeam.players.length < minRequired;

        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', marginBottom: 10 }}>
                🏆 Register Squad for {selectedTournamentForApply.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 16 }}>
                Select which of your registered {selectedTournamentForApply.sportCategory} teams will participate.
              </p>

              {/* Immediate Validation Error Banner */}
              {applyModalError && (
                <div
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: 6,
                    fontSize: '13px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <span style={{ fontWeight: 500 }}>{applyModalError}</span>
                </div>
              )}

              <form onSubmit={handleApplyForTournament} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Select Eligible Team ({selectedTournamentForApply.sportCategory})
                  </label>
                  {teams.filter((t) => t.sport === selectedTournamentForApply.sportCategory).length === 0 ? (
                    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 6, fontSize: '13px' }}>
                      ⚠️ You do not have any registered teams for {selectedTournamentForApply.sportCategory}. Please register a team in that sport first.
                    </div>
                  ) : (
                    <>
                      <select
                        required
                        value={selectedTeamIdToApply}
                        onChange={(e) => {
                          setSelectedTeamIdToApply(e.target.value);
                          setApplyModalError('');
                        }}
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

                      {chosenTeam && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: '12px',
                            color: isUnderSized ? '#dc2626' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isUnderSized ? (
                            <>
                              <span>⚠️ Roster incomplete:</span>
                              <strong>
                                {chosenTeam.players.length} / {minRequired} minimum required players
                              </strong>
                            </>
                          ) : (
                            <>
                              <span>✅ Squad ready:</span>
                              <strong>
                                {chosenTeam.players.length} registered players (minimum {minRequired} required)
                              </strong>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
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
                    onClick={() => {
                      setSelectedTournamentForApply(null);
                      setApplyModalError('');
                      setSelectedTeamIdToApply('');
                      setApplyNotes('');
                    }}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedTeamIdToApply}
                    style={{
                      background: !selectedTeamIdToApply ? '#cbd5e1' : '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 20px',
                      fontWeight: 600,
                      cursor: !selectedTeamIdToApply ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Submit Squad Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}