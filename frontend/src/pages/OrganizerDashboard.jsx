import React, { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import SearchableCitySelect from '../components/SearchableCitySelect';
import { formatDate, formatDateTime } from '../utils/dateUtils';

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
      if (!formData.venueId) {
        setError('Please select a verified ground or choose "Other" to enter a custom venue name');
        return;
      }
      if (formData.venueId === 'OTHER' && !formData.venueName.trim()) {
        setError('Please enter the custom venue name');
        return;
      }

      const isOther = formData.venueId === 'OTHER';
      const selectedVenueObj = isOther ? null : venues.find((v) => v._id === formData.venueId);
      const finalVenueId = isOther ? null : (selectedVenueObj ? selectedVenueObj._id : null);
      const finalVenueName = isOther ? formData.venueName.trim() : (selectedVenueObj ? selectedVenueObj.name : '');

      await API.post('/tournaments', {
        ...formData,
        venueId: finalVenueId,
        venueName: finalVenueName,
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
      const res = await API.get(`/tournaments/${selectedTournament._id}/registrations`);
      setRegistrationsData(res.data);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team registration status');
    }
  };

  const filteredVenues = venues.filter((v) => {
    const matchesDistrict = !formData.district || v.district.toLowerCase() === formData.district.toLowerCase();
    const matchesSport = !formData.sportCategory || v.supportedSports?.includes(formData.sportCategory);
    return matchesDistrict && matchesSport;
  });

  const isApproved = user?.approvalStatus === 'APPROVED';

  return (
    <div style={{ padding: '28px 24px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a' }}>
              📋 Tournament Organizer Command Center
            </h1>
            <span className={`badge ${isApproved ? 'badge-approved' : 'badge-pending'}`}>
              {user?.approvalStatus || 'PENDING'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 4 }}>
            Organization: <strong style={{ color: '#0284c7' }}>{user?.organizationName || 'Independent Organizer'}</strong> | District: {user?.district}
          </p>
        </div>

        {isApproved && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            + Create New Tournament
          </button>
        )}
      </div>

      {/* Warning if Pending */}
      {!isApproved && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '16px', borderRadius: 8, marginBottom: 24, fontSize: '14px' }}>
          ⏳ <strong>Account Pending Admin Verification:</strong> Your organizer account is currently awaiting review by the platform administrator. Once verified, you will be able to publish tournaments and approve team rosters.
        </div>
      )}

      {/* Notifications */}
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

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '18px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Hosted Tournaments</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#0284c7', marginTop: 4 }}>{tournaments.length}</div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: 4 }}>Active & scheduled events</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '18px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Team Applications</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#16a34a', marginTop: 4 }}>
            {tournaments.reduce((acc, t) => acc + (t.registeredTeams?.length || 0), 0)}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: 4 }}>Across all competitions</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '18px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Pending Squad Reviews</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#b45309', marginTop: 4 }}>
            {tournaments.reduce(
              (acc, t) => acc + (t.registeredTeams?.filter((r) => r.status === 'PENDING').length || 0),
              0
            )}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: 4 }}>Awaiting your decision</div>
        </div>
      </div>

      {/* Tournaments List Section */}
      <h2 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
        🏆 Hosted Tournaments & Squad Applications
      </h2>

      {tournaments.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: 12 }}>You have not created any tournaments yet.</p>
          {isApproved && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '13px', fontWeight: 600 }}
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
            const isDeadlinePassed = new Date() > new Date(t.registrationDeadline);
            const isSlotsFull = approvedTeams.length >= t.maxTeams;
            const effectiveStatus = (t.status === 'REGISTRATION_OPEN' && (isDeadlinePassed || isSlotsFull))
              ? 'REGISTRATION_CLOSED'
              : t.status;

            return (
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '24px' }}>{sportInfo?.icon || '🏆'}</span>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>{t.title}</h3>
                        <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 600 }}>{t.sportCategory}</span>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        effectiveStatus === 'REGISTRATION_OPEN'
                          ? 'badge-green'
                          : effectiveStatus === 'REGISTRATION_CLOSED'
                          ? 'badge-amber'
                          : effectiveStatus === 'ONGOING'
                          ? 'badge-blue'
                          : 'badge-purple'
                      }`}
                    >
                      {effectiveStatus === 'REGISTRATION_OPEN'
                        ? 'Registration Open'
                        : effectiveStatus === 'REGISTRATION_CLOSED'
                        ? (isDeadlinePassed ? 'Registration Closed (Deadline Passed)' : isSlotsFull ? 'Registration Closed (Slots Full)' : 'Registration Closed')
                        : effectiveStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <p style={{ color: '#475569', fontSize: '13px', marginBottom: 14 }}>
                    {t.description || 'Inter-college championship event.'}
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>📍 Venue & Ground:</span>
                      <strong style={{ color: '#0f172a' }}>{t.venueName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>📅 Event Dates:</span>
                      <strong style={{ color: '#334155' }}>
                        {formatDate(t.startDate)} – {formatDate(t.endDate)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>⏰ Registration Deadline:</span>
                      <strong style={{ color: isDeadlinePassed ? '#dc2626' : '#b45309' }}>
                        {formatDate(t.registrationDeadline)} {isDeadlinePassed ? '(Passed)' : ''}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>🏆 Format:</span>
                      <strong style={{ color: '#0284c7' }}>{t.format}</strong>
                    </div>
                  </div>

                  {/* Slot Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Approved Teams:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>
                        {approvedTeams.length} / {t.maxTeams} slots filled
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min((approvedTeams.length / t.maxTeams) * 100, 100)}%`,
                          background: approvedTeams.length >= t.maxTeams ? '#16a34a' : '#0284c7',
                        }}
                      />
                    </div>
                    {pendingTeams.length > 0 && (
                      <div style={{ color: '#b45309', fontSize: '12px', marginTop: 4, fontWeight: 600 }}>
                        ⚡ {pendingTeams.length} squad application(s) awaiting approval
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
              🏆 Launch New Sports Tournament
            </h3>
            <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Tournament Title</label>
                <input
                  placeholder="e.g. Gujarat State Inter-Collegiate Football Cup 2026"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Description</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Sport Category</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>District / City (Gujarat)</label>
                  <SearchableCitySelect
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Select Gujarat city..."
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Venue / Ground (Verified Grounds)
                  </label>
                  <select
                    required
                    value={formData.venueId}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === 'OTHER') {
                        // User selected "Other": enable custom venue input, clear previous venueName
                        setFormData({
                          ...formData,
                          venueId: 'OTHER',
                          venueName: '',
                        });
                      } else if (selectedVal) {
                        // Verified ground selected: clear custom venue input and use verified ground name
                        const vObj = venues.find((v) => v._id === selectedVal);
                        setFormData({
                          ...formData,
                          venueId: selectedVal,
                          venueName: vObj ? vObj.name : '',
                        });
                      } else {
                        // Empty selection: clear both
                        setFormData({
                          ...formData,
                          venueId: '',
                          venueName: '',
                        });
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a ground...</option>
                    {filteredVenues.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.district})
                      </option>
                    ))}
                    <option value="OTHER">Other (Specify custom venue below)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Custom Venue Name (if not in list)
                  </label>
                  <input
                    placeholder={
                      formData.venueId === 'OTHER'
                        ? 'Enter custom ground or venue name...'
                        : "Disabled (Select 'Other' in dropdown above)"
                    }
                    disabled={formData.venueId !== 'OTHER'}
                    required={formData.venueId === 'OTHER'}
                    value={formData.venueId === 'OTHER' ? formData.venueName : ''}
                    onChange={(e) => {
                      if (formData.venueId === 'OTHER') {
                        setFormData({ ...formData, venueName: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      background: formData.venueId === 'OTHER' ? '#ffffff' : '#f1f5f9',
                      color: formData.venueId === 'OTHER' ? '#0f172a' : '#94a3b8',
                      cursor: formData.venueId === 'OTHER' ? 'text' : 'not-allowed',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Start Date {formData.startDate && <span style={{ color: '#0284c7', fontWeight: 'normal' }}>({formatDate(formData.startDate)})</span>}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    End Date {formData.endDate && <span style={{ color: '#0284c7', fontWeight: 'normal' }}>({formatDate(formData.endDate)})</span>}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Reg Deadline {formData.registrationDeadline && <span style={{ color: '#0284c7', fontWeight: 'normal' }}>({formatDate(formData.registrationDeadline)})</span>}
                  </label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Tournament Format</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Max Teams</label>
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
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Specific Tournament Rules</label>
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
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', fontWeight: 600 }}
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
                <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a' }}>
                  👥 Squad Registrations: {registrationsData.title}
                </h3>
                <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: 600 }}>
                  Capacity: {registrationsData.approvedCount} / {registrationsData.maxTeams} Teams Approved
                </span>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: 4, fontWeight: 600 }}
              >
                ✕ Close
              </button>
            </div>

            {registrationsData.registeredTeams.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
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
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{team.name}</h4>
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
                          <div style={{ color: '#475569', fontSize: '13px', marginTop: 2 }}>
                            Captain: <strong style={{ color: '#0f172a' }}>{team.captainId?.name || reg.appliedBy?.name}</strong> | Phone: {team.captainId?.phone || reg.appliedBy?.phone} | District: {team.district}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: 2 }}>
                            Registered: {formatDateTime(reg.appliedAt)} • {team.players?.length || 0} Players in Roster
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setExpandedRosterTeamId(isExpanded ? null : team._id)}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', fontSize: '12px', fontWeight: 500 }}
                          >
                            {isExpanded ? 'Hide Squad' : 'Inspect Squad Roster'}
                          </button>

                          {reg.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateTeamStatus(team._id, 'APPROVED')}
                              disabled={registrationsData.approvedCount >= registrationsData.maxTeams}
                              style={{
                                background: registrationsData.approvedCount >= registrationsData.maxTeams ? '#94a3b8' : '#16a34a',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: registrationsData.approvedCount >= registrationsData.maxTeams ? 'not-allowed' : 'pointer',
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {reg.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateTeamStatus(team._id, 'REJECTED')}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', fontSize: '12px', fontWeight: 600 }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Squad Roster Table */}
                      {isExpanded && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                          <h5 style={{ color: '#0284c7', fontSize: '13px', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
                            📋 Official Squad Roster ({team.players?.length || 0} Registered Players)
                          </h5>
                          {team.players && team.players.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                  <tr style={{ color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '6px 10px' }}>Jersey #</th>
                                    <th style={{ padding: '6px 10px' }}>Player Name</th>
                                    <th style={{ padding: '6px 10px' }}>Position / Role</th>
                                    <th style={{ padding: '6px 10px' }}>Student / Govt ID Proof</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.players.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px 10px', color: '#b45309', fontWeight: 'bold' }}>
                                        #{p.jerseyNumber}
                                      </td>
                                      <td style={{ padding: '6px 10px', color: '#0f172a' }}>
                                        {p.fullName}
                                        {(p.isCaptain || p.role?.toLowerCase() === 'captain') && (
                                          <span className="badge badge-approved" style={{ marginLeft: 6, fontSize: '10px' }}>
                                            👑 Captain
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ padding: '6px 10px', color: '#475569' }}>{p.role}</td>
                                      <td style={{ padding: '6px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                                        {p.studentOrGovtId}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p style={{ color: '#dc2626', fontSize: '12px' }}>
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
