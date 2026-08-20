import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function CaptainDashboard() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Team Form State
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('CRICKET');
  const [district, setDistrict] = useState(user?.district || '');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Player Form State
  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    jerseyNumber: '',
    role: '',
    studentOrGovtId: '',
  });

  const sportsList = ['CRICKET', 'FOOTBALL', 'BASKETBALL', 'BADMINTON', 'VOLLEYBALL', 'KABADDI'];

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/teams/my-teams');
      setTeams(res.data.teams);
      if (res.data.teams.length > 0 && !selectedTeam) {
        setSelectedTeam(res.data.teams[0]);
      } else if (selectedTeam) {
        const updated = res.data.teams.find((t) => t._id === selectedTeam._id);
        setSelectedTeam(updated || res.data.teams[0] || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/teams', { name: teamName, sport, district });
      setSuccess(`Team "${res.data.team.name}" created successfully!`);
      setTeamName('');
      setShowCreateTeamModal(false);
      await fetchTeams();
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
      await fetchTeams();
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
      setSuccess(`Player ${playerForm.fullName} added to roster!`);
      setPlayerForm({ fullName: '', jerseyNumber: '', role: '', studentOrGovtId: '' });
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add player');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm('Remove this player from the roster?')) return;
    try {
      await API.delete(`/teams/${selectedTeam._id}/players/${playerId}`);
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove player');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Captain Portal</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Manage your clubs, player rosters, and tournament registrations</p>
        </div>
        <button
          onClick={() => setShowCreateTeamModal(!showCreateTeamModal)}
          style={{ background: '#0284c7', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showCreateTeamModal ? 'Cancel' : '+ Create New Team'}
        </button>
      </div>

      {/* Alerts */}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

      {/* Create Team Form Modal */}
      {showCreateTeamModal && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>Register a New Team Profile</h3>
          <form onSubmit={handleCreateTeam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Saurashtra Super Kings"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                {sportsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>District / City</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button
              type="submit"
              style={{ background: '#16a34a', color: '#fff', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Save Team
            </button>
          </form>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <p>Loading teams and rosters...</p>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '8px' }}>
          <h3>No teams created yet</h3>
          <p style={{ color: '#64748b' }}>Click "+ Create New Team" to set up your squad and add players.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Teams Selection List */}
          <div>
            <h3 style={{ fontSize: '16px', color: '#475569', marginBottom: '12px' }}>Your Teams ({teams.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teams.map((t) => {
                const isActive = selectedTeam?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTeam(t)}
                    style={{
                      padding: '12px 16px',
                      background: isActive ? '#e0f2fe' : '#ffffff',
                      border: isActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {t.sport} • {t.players.length} Players
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Roster View */}
          {selectedTeam && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedTeam.name}</h2>
                  <span style={{ fontSize: '13px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>
                    {selectedTeam.sport}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>📍 {selectedTeam.district}</span>
                </div>
                <button
                  onClick={() => handleDeleteTeam(selectedTeam._id)}
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Delete Team
                </button>
              </div>

              {/* Add Player Form */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Add Player to Squad</h4>
                <form onSubmit={handleAddPlayer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Player Name</label>
                    <input
                      required
                      placeholder="e.g. Rohit Sharma"
                      value={playerForm.fullName}
                      onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Jersey #</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="999"
                      placeholder="e.g. 45"
                      value={playerForm.jerseyNumber}
                      onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Role / Position</label>
                    <input
                      required
                      placeholder="e.g. Opening Batsman"
                      value={playerForm.role}
                      onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Student / Govt ID Proof</label>
                    <input
                      required
                      placeholder="e.g. STU-9941"
                      value={playerForm.studentOrGovtId}
                      onChange={(e) => setPlayerForm({ ...playerForm, studentOrGovtId: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ background: '#0284c7', color: '#fff', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    + Add Player
                  </button>
                </form>
              </div>

              {/* Squad Roster Table */}
              <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Current Roster ({selectedTeam.players.length})</h4>
              {selectedTeam.players.length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No players added yet. Add your starting lineup above.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px' }}># Jersey</th>
                      <th style={{ padding: '8px 12px' }}>Player Name</th>
                      <th style={{ padding: '8px 12px' }}>Role</th>
                      <th style={{ padding: '8px 12px' }}>ID Card Proof</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeam.players.map((p) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>#{p.jerseyNumber}</td>
                        <td style={{ padding: '8px 12px' }}>{p.fullName}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.role}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{p.studentOrGovtId}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleRemovePlayer(p._id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}