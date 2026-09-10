import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function OrganizerDashboard() {
  const { user } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Tournament Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sportCategory: 'FOOTBALL',
    district: user?.district || '',
    venueId: '',
    venueName: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxTeams: 8,
    format: 'KNOCKOUT',
    rules: '',
  });

  // Team Registration Review State
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [registrationsData, setRegistrationsData] = useState(null);
  const [expandedRosterTeamId, setExpandedRosterTeamId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, sportsRes, venuesRes] = await Promise.all([
        API.get('/tournaments/organizer/my-tournaments'),
        API.get('/admin/sports'),
        API.get('/admin/venues'),
      ]);
      setTournaments(tournamentsRes.data);
      setSports(sportsRes.data);
      setVenues(venuesRes.data);

      if (sportsRes.data.length > 0 && !formData.sportCategory) {
        setFormData((prev) => ({ ...prev, sportCategory: sportsRes.data[0].code }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      setError('');
      // Find venue name if selected from venueId
      const selectedVenueObj = venues.find((v) => v._id === formData.venueId);
      const venueNameToUse = selectedVenueObj ? selectedVenueObj.name : formData.venueName;

      await API.post('/tournaments', {
        ...formData,
        venueName: venueNameToUse,
      });

      setSuccess(`Tournament "${formData.title}" published successfully!`);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        sportCategory: sports[0]?.code || 'FOOTBALL',
        district: user?.district || '',
        venueId: '',
        venueName: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        maxTeams: 8,
        format: 'KNOCKOUT',
        rules: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    }
  };

  const openReviewModal = async (tournament) => {
    try {
      setSelectedTournament(tournament);
      const res = await API.get(`/tournaments/${tournament._id}/registrations`);
      setRegistrationsData(res.data);
      setShowReviewModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tournament team registrations');
    }
  };

  const handleUpdateTeamStatus = async (teamId, status) => {
    try {
      setError('');
      await API.put(`/tournaments/${selectedTournament._id}/registrations/${teamId}`, {
        status,
      });
      setSuccess(`Team status updated to ${status}!`);
      // Refresh registrations
      const res = await API.get(`/tournaments/${selectedTournament._id}/registrations`);
      setRegistrationsData(res.data);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team registration status');
    }
  };

  // Filter venues by selected district and sport in creation modal
  const filteredVenues = venues.filter((v) => {
    const matchesDistrict = !formData.district || v.district.toLowerCase() === formData.district.toLowerCase();
    const matchesSport = !formData.sportCategory || v.supportedSports?.includes(formData.sportCategory);
    return matchesDistrict && matchesSport;
  });

  const isApproved = user?.approvalStatus === 'APPROVED';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>
              📋 Tournament Organizer Command Center
            </h1>
            <span className={`badge ${isApproved ? 'badge-approved' : 'badge-pending'}`}>
              {user?.approvalStatus || 'PENDING'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 4 }}>
            Organization: <strong style={{ color: '#38bdf8' }}>{user?.organizationName || 'Independent Organizer'}</strong> | District: {user?.district}
          </p>
        </div>

        {isApproved && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            + Create New Tournament
          </button>
        )}
      </div>

      {/* Warning if Pending */}
      {!isApproved && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '16px', borderRadius: 8, marginBottom: 24 }}>
          ⏳ <strong>Account Pending Admin Verification:</strong> Your organizer account is currently awaiting review by the platform administrator. Once verified, you will be able to publish tournaments and approve team rosters.
        </div>
      )}

      {/* Notifications */}
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

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>My Hosted Tournaments</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8', marginTop: 4 }}>{tournaments.length}</div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Active & scheduled events</div>
        </div>
        <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Total Team Applications</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: 4 }}>
            {tournaments.reduce((acc, t) => acc + (t.registeredTeams?.length || 0), 0)}
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Across all competitions</div>
        </div>
        <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Pending Squad Reviews</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }}>
            {tournaments.reduce(
              (acc, t) => acc + (t.registeredTeams?.filter((r) => r.status === 'PENDING').length || 0),
              0
            )}
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Awaiting your decision</div>
        </div>
      </div>

      {/* Tournaments List Section */}
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 }}>
        🏆 Hosted Tournaments & Applications
      </h2>

      {tournaments.length === 0 ? (
        <div style={{ background: '#131b2e', border: '1px dashed #24324f', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: 12 }}>You have not created any tournaments yet.</p>
          {isApproved && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6 }}
            >
              + Create Your First Tournament
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {tournaments.map((t) => {
            const approvedTeams = t.registeredTeams?.filter((r) => r.status === 'APPROVED') || [];
            const pendingTeams = t.registeredTeams?.filter((r) => r.status === 'PENDING') || [];
            const sportInfo = sports.find((s) => s.code === t.sportCategory);

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
                    <span className="badge badge-green">{t.status.replace('_', ' ')}</span>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: 14 }}>
                    {t.description || 'Inter-college championship event.'}
                  </p>

                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>📍 Venue & Ground:</span>
                      <strong style={{ color: '#fff' }}>{t.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>📅 Tournament Dates:</span>
                      <strong style={{ color: '#cbd5e1' }}>
                        {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>⏰ Registration Deadline:</span>
                      <strong style={{ color: '#f59e0b' }}>
                        {new Date(t.registrationDeadline).toLocaleDateString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>🏆 Format:</span>
                      <strong style={{ color: '#38bdf8' }}>{t.format}</strong>
                    </div>
                  </div>

                  {/* Slot Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                      <span style={{ color: '#94a3b8' }}>Approved Teams:</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {approvedTeams.length} / {t.maxTeams} slots filled
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min((approvedTeams.length / t.maxTeams) * 100, 100)}%`,
                          background: approvedTeams.length >= t.maxTeams ? '#10b981' : '#0284c7',
                        }}
                      />
                    </div>
                    {pendingTeams.length > 0 && (
                      <div style={{ color: '#f59e0b', fontSize: '12px', marginTop: 4, fontWeight: 500 }}>
                        ⚡ {pendingTeams.length} squad application(s) awaiting approval
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{t.registeredTeams?.length || 0} teams applied</span>
                  <button
                    onClick={() => openReviewModal(t)}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Manage & Review Squads
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
              🏆 Launch New Sports Tournament
            </h3>
            <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tournament Title</label>
                <input
                  placeholder="e.g. Gujarat State Inter-Collegiate Football Cup 2026"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows="2"
                  placeholder="Short description, eligibility criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Sport Category</label>
                  <select
                    value={formData.sportCategory}
                    onChange={(e) => setFormData({ ...formData, sportCategory: e.target.value })}
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
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>District</label>
                  <input
                    placeholder="e.g. Rajkot, Boston"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Venue / Ground (Verified Grounds)
                  </label>
                  <select
                    value={formData.venueId}
                    onChange={(e) => {
                      const vObj = venues.find((v) => v._id === e.target.value);
                      setFormData({
                        ...formData,
                        venueId: e.target.value,
                        venueName: vObj ? vObj.name : formData.venueName,
                      });
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a ground...</option>
                    {filteredVenues.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.district})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Custom Venue Name (if not in list)
                  </label>
                  <input
                    placeholder="Ground / Stadium Name"
                    required
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Reg Deadline</label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tournament Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="KNOCKOUT">Knockout Tournament</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAGUE_PLUS_KNOCKOUT">League + Knockout</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Max Teams</label>
                  <select
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  >
                    <option value="4">4 Teams</option>
                    <option value="8">8 Teams</option>
                    <option value="16">16 Teams</option>
                    <option value="32">32 Teams</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Specific Tournament Rules</label>
                <textarea
                  rows="2"
                  placeholder="Tie-break rules, kit guidelines, reporting time..."
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px' }}
                >
                  Publish Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM REGISTRATIONS & SQUAD ROSTER REVIEW MODAL */}
      {showReviewModal && registrationsData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                  👥 Squad Registrations: {registrationsData.title}
                </h3>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>
                  Capacity: {registrationsData.approvedCount} / {registrationsData.maxTeams} Teams Approved
                </span>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: 4 }}
              >
                ✕ Close
              </button>
            </div>

            {registrationsData.registeredTeams.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No teams have registered for this tournament yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {registrationsData.registeredTeams.map((reg) => {
                  const team = reg.teamId;
                  if (!team) return null;
                  const isExpanded = expandedRosterTeamId === team._id;

                  return (
                    <div
                      key={team._id}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #24324f',
                        borderRadius: 10,
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h4 style={{ fontSize: '17px', fontWeight: 'bold', color: '#fff' }}>{team.name}</h4>
                            <span
                              className={`badge ${
                                reg.status === 'APPROVED'
                                  ? 'badge-approved'
                                  : reg.status === 'PENDING'
                                  ? 'badge-pending'
                                  : 'badge-rejected'
                              }`}
                            >
                              {reg.status}
                            </span>
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: 2 }}>
                            Captain: <strong style={{ color: '#e2e8f0' }}>{team.captainId?.name || reg.appliedBy?.name}</strong> | Phone: {team.captainId?.phone || reg.appliedBy?.phone} | District: {team.district}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: 2 }}>
                            Registered: {new Date(reg.appliedAt).toLocaleString()} • {team.players?.length || 0} Players in Roster
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setExpandedRosterTeamId(isExpanded ? null : team._id)}
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', fontSize: '12px' }}
                          >
                            {isExpanded ? 'Hide Squad' : 'Inspect Squad Roster'}
                          </button>

                          {reg.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateTeamStatus(team._id, 'APPROVED')}
                              disabled={registrationsData.approvedCount >= registrationsData.maxTeams}
                              style={{
                                background: registrationsData.approvedCount >= registrationsData.maxTeams ? '#475569' : '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 14px',
                                fontSize: '12px',
                                cursor: registrationsData.approvedCount >= registrationsData.maxTeams ? 'not-allowed' : 'pointer',
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {reg.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateTeamStatus(team._id, 'REJECTED')}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', fontSize: '12px' }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Squad Roster Table */}
                      {isExpanded && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e293b' }}>
                          <h5 style={{ color: '#38bdf8', fontSize: '13px', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                            📋 Official Squad Roster ({team.players?.length || 0} Registered Players)
                          </h5>
                          {team.players && team.players.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid #24324f' }}>
                                    <th style={{ padding: '6px 10px' }}>Jersey #</th>
                                    <th style={{ padding: '6px 10px' }}>Player Name</th>
                                    <th style={{ padding: '6px 10px' }}>Position / Role</th>
                                    <th style={{ padding: '6px 10px' }}>Student / Govt ID Proof</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.players.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #182238' }}>
                                      <td style={{ padding: '6px 10px', color: '#f59e0b', fontWeight: 'bold' }}>
                                        #{p.jerseyNumber}
                                      </td>
                                      <td style={{ padding: '6px 10px', color: '#fff' }}>{p.fullName}</td>
                                      <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>{p.role}</td>
                                      <td style={{ padding: '6px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                        {p.studentOrGovtId}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p style={{ color: '#f43f5e', fontSize: '12px' }}>
                              ⚠️ No players found in this team roster.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
