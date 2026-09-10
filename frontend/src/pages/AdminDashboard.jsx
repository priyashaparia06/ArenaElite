import React, { useState, useEffect } from 'react';
import API from '../api/axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User Filter State
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Sport Modal State
  const [showSportModal, setShowSportModal] = useState(false);
  const [sportForm, setSportForm] = useState({
    name: '',
    code: '',
    icon: '🏆',
    playersPerTeam: 11,
    minSquadSize: 11,
    maxSquadSize: 20,
    formatType: 'TIME_BASED',
    defaultMatchDuration: 90,
    rulesDescription: '',
  });

  // Venue Modal State
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueForm, setVenueForm] = useState({
    name: '',
    district: '',
    address: '',
    supportedSports: '',
    contactPerson: '',
    contactPhone: '',
    facilities: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, sportsRes, venuesRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get(`/admin/users${userRoleFilter ? `?role=${userRoleFilter}` : ''}`),
        API.get('/admin/sports'),
        API.get('/admin/venues'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setSports(sportsRes.data);
      setVenues(venuesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRoleFilter]);

  const handleUpdateOrganizerStatus = async (userId, approvalStatus, isActive = true) => {
    try {
      setError('');
      await API.put(`/admin/organizers/${userId}/status`, { approvalStatus, isActive });
      setSuccess(`Organizer status updated to ${approvalStatus}!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update organizer status');
    }
  };

  const handleToggleUserActive = async (userId) => {
    try {
      setError('');
      const res = await API.put(`/admin/users/${userId}/toggle-active`);
      setSuccess(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleCreateSport = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await API.post('/admin/sports', sportForm);
      setSuccess(`Sport category "${sportForm.name}" created successfully!`);
      setShowSportModal(false);
      setSportForm({
        name: '',
        code: '',
        icon: '🏆',
        playersPerTeam: 11,
        minSquadSize: 11,
        maxSquadSize: 20,
        formatType: 'TIME_BASED',
        defaultMatchDuration: 90,
        rulesDescription: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sport category');
    }
  };

  const handleDeleteSport = async (id) => {
    if (!window.confirm('Are you sure you want to remove this sport category?')) return;
    try {
      await API.delete(`/admin/sports/${id}`);
      setSuccess('Sport category deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sport category');
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await API.post('/admin/venues', {
        ...venueForm,
        supportedSports: venueForm.supportedSports.split(',').map((s) => s.trim()),
        facilities: venueForm.facilities.split(',').map((f) => f.trim()),
      });
      setSuccess(`Venue "${venueForm.name}" created successfully!`);
      setShowVenueModal(false);
      setVenueForm({
        name: '',
        district: '',
        address: '',
        supportedSports: '',
        contactPerson: '',
        contactPhone: '',
        facilities: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create venue');
    }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('Delete this venue?')) return;
    try {
      await API.delete(`/admin/venues/${id}`);
      setSuccess('Venue deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete venue');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.organizationName?.toLowerCase().includes(term) ||
      u.district?.toLowerCase().includes(term)
    );
  });

  const pendingOrganizers = users.filter(
    (u) => u.role === 'ORGANIZER' && u.approvalStatus === 'PENDING'
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 }}>
            🛡️ System Administration Console
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Manage platform users, organizer approvals, sports category rules, and venues.
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '8px 16px', borderRadius: 6 }}
        >
          🔄 Refresh Data
        </button>
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

      {/* Quick Stats Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Total Registered Users</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8', marginTop: 4 }}>{stats.totalUsers}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Across all 4 roles</div>
          </div>
          <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Pending Organizers</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stats.organizers.pending > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
              {stats.organizers.pending}
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>{stats.organizers.approved} Approved</div>
          </div>
          <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Active Tournaments</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: 4 }}>{stats.tournaments.active}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>{stats.tournaments.total} Total Tournaments</div>
          </div>
          <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Grounds & Venues</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#a855f7', marginTop: 4 }}>{stats.totalVenues}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Across multiple districts</div>
          </div>
          <div style={{ background: '#131b2e', border: '1px solid #24324f', padding: '16px', borderRadius: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Sports Categories</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f43f5e', marginTop: 4 }}>{stats.totalSports}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: 4 }}>Configured with match rules</div>
          </div>
        </div>
      )}

      {/* Pending Organizer Attention Banner */}
      {pendingOrganizers.length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <div>
                <h3 style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 600 }}>
                  {pendingOrganizers.length} Organizer Application(s) Awaiting Review
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  These organizations cannot host tournaments until you approve their credentials.
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {pendingOrganizers.map((org) => (
              <div key={org._id} style={{ background: '#182238', padding: '12px 16px', borderRadius: 8, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '15px' }}>{org.organizationName || org.name}</h4>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>Contact: {org.name} ({org.email})</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>District: {org.district} | Phone: {org.phone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleUpdateOrganizerStatus(org._id, 'APPROVED')}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '12px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateOrganizerStatus(org._id, 'REJECTED')}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '12px' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #24324f', marginBottom: 24 }}>
        {[
          { id: 'users', label: '👥 Users & Organizers' },
          { id: 'sports', label: '🏆 Sports Categories & Rules' },
          { id: 'venues', label: '🏟️ Venues & Grounds' },
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

      {/* TAB 1: USERS & ORGANIZERS */}
      {activeTab === 'users' && (
        <div style={{ background: '#131b2e', border: '1px solid #24324f', borderRadius: 12, padding: 20 }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                placeholder="Search user, org, district, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '320px' }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ padding: '8px 12px' }}
              >
                <option value="">All Roles</option>
                <option value="ORGANIZER">Organizers</option>
                <option value="CAPTAIN">Team Captains</option>
                <option value="SCORER">Field Scorers</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', alignSelf: 'center' }}>
              Showing {filteredUsers.length} user accounts
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #24324f', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>User / Organization</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>District</th>
                  <th style={{ padding: '12px 16px' }}>Contact</th>
                  <th style={{ padding: '12px 16px' }}>Approval Status</th>
                  <th style={{ padding: '12px 16px' }}>Active</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                      {u.organizationName && (
                        <div style={{ color: '#38bdf8', fontSize: '12px' }}>🏢 {u.organizationName}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`badge ${
                          u.role === 'ADMIN'
                            ? 'badge-purple'
                            : u.role === 'ORGANIZER'
                            ? 'badge-blue'
                            : u.role === 'CAPTAIN'
                            ? 'badge-green'
                            : 'badge-amber'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.district}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#e2e8f0' }}>{u.email}</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>{u.phone}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`badge ${
                          u.approvalStatus === 'APPROVED'
                            ? 'badge-approved'
                            : u.approvalStatus === 'PENDING'
                            ? 'badge-pending'
                            : 'badge-rejected'
                        }`}
                      >
                        {u.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: u.isActive ? '#10b981' : '#ef4444',
                          marginRight: 6,
                        }}
                      />
                      {u.isActive ? 'Active' : 'Disabled'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {u.role === 'ORGANIZER' && u.approvalStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateOrganizerStatus(u._id, 'APPROVED')}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}
                          >
                            Approve
                          </button>
                        )}
                        {u.role === 'ORGANIZER' && u.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateOrganizerStatus(u._id, 'REJECTED')}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}
                          >
                            Revoke
                          </button>
                        )}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUserActive(u._id)}
                            style={{
                              background: u.isActive ? '#334155' : '#0284c7',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: '12px',
                            }}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SPORTS CATEGORIES & RULES */}
      {activeTab === 'sports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>Sport Disciplines & Match Rules</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Define team sizes, squad limits, match durations, and sport-specific rules used across tournaments.
              </p>
            </div>
            <button
              onClick={() => setShowSportModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 600 }}
            >
              + Add Sport Category
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {sports.map((sport) => (
              <div
                key={sport._id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '28px' }}>{sport.icon || '🏆'}</span>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{sport.name}</h3>
                        <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>{sport.code}</span>
                      </div>
                    </div>
                    <span className="badge badge-blue">{sport.formatType}</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Playing Team Size:</span>
                      <strong style={{ color: '#fff' }}>{sport.playersPerTeam} on court/field</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Squad Roster Limits:</span>
                      <strong style={{ color: '#fff' }}>
                        Min {sport.minSquadSize} – Max {sport.maxSquadSize}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Standard Match Length:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {sport.formatType === 'OVERS_BASED'
                          ? `${sport.defaultMatchDuration} Overs`
                          : sport.formatType === 'SETS_BASED'
                          ? `Best of ${sport.defaultMatchDuration} Sets`
                          : `${sport.defaultMatchDuration} Mins`}
                      </strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: 16 }}>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>
                      Official Rulebook Configuration:
                    </span>
                    {sport.rulesDescription || 'Standard international sporting regulations apply.'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDeleteSport(sport._id)}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 4, fontSize: '12px' }}
                  >
                    Delete Category
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VENUES & GROUNDS */}
      {activeTab === 'venues' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>Sports Grounds & Venues</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Manage verified stadiums, college grounds, and indoor arenas available for organizers.
              </p>
            </div>
            <button
              onClick={() => setShowVenueModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 600 }}
            >
              + Add Ground / Venue
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {venues.map((venue) => (
              <div
                key={venue._id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{venue.name}</h3>
                      <div style={{ color: '#38bdf8', fontSize: '13px' }}>📍 {venue.district}</div>
                    </div>
                    <span className="badge badge-green">Verified</span>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: 14 }}>{venue.address}</p>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Supported Sports:
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {venue.supportedSports?.map((sport, i) => (
                        <span key={i} className="badge badge-purple">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>

                  {venue.facilities && venue.facilities.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Facilities:
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {venue.facilities.map((fac, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#0f172a',
                              color: '#cbd5e1',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '11px',
                              border: '1px solid #24324f',
                            }}
                          >
                            ✓ {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, fontSize: '12px', color: '#94a3b8' }}>
                    <div>Manager: {venue.contactPerson || 'Official In-charge'}</div>
                    <div>Phone: {venue.contactPhone || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12, marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDeleteVenue(venue._id)}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 4, fontSize: '12px' }}
                  >
                    Remove Ground
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE SPORT CATEGORY MODAL */}
      {showSportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
              🏆 Configure New Sport Category & Rules
            </h3>
            <form onSubmit={handleCreateSport} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Sport Name</label>
                  <input
                    placeholder="e.g. Football, Cricket"
                    required
                    value={sportForm.name}
                    onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Code (Uppercase)</label>
                  <input
                    placeholder="e.g. FOOTBALL"
                    required
                    value={sportForm.code}
                    onChange={(e) => setSportForm({ ...sportForm, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Emoji / Icon</label>
                  <input
                    placeholder="⚽, 🏏, 🏀"
                    value={sportForm.icon}
                    onChange={(e) => setSportForm({ ...sportForm, icon: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Format Type</label>
                  <select
                    value={sportForm.formatType}
                    onChange={(e) => setSportForm({ ...sportForm, formatType: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="TIME_BASED">Time Based (e.g. Football / Basketball)</option>
                    <option value="OVERS_BASED">Overs Based (Cricket)</option>
                    <option value="SETS_BASED">Sets Based (Badminton / Volleyball)</option>
                    <option value="POINTS_BASED">Points Based (Kabaddi)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Playing Team Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sportForm.playersPerTeam}
                    onChange={(e) => setSportForm({ ...sportForm, playersPerTeam: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Min Squad Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sportForm.minSquadSize}
                    onChange={(e) => setSportForm({ ...sportForm, minSquadSize: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Max Squad Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sportForm.maxSquadSize}
                    onChange={(e) => setSportForm({ ...sportForm, maxSquadSize: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Default Match Duration (Mins / Overs / Sets)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sportForm.defaultMatchDuration}
                  onChange={(e) => setSportForm({ ...sportForm, defaultMatchDuration: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Official Rule Descriptions</label>
                <textarea
                  rows="3"
                  placeholder="Specify substitutions, timing halves, shootout formats..."
                  value={sportForm.rulesDescription}
                  onChange={(e) => setSportForm({ ...sportForm, rulesDescription: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowSportModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px' }}
                >
                  Save Sport Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VENUE MODAL */}
      {showVenueModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
              🏟️ Register Sports Ground / Venue
            </h3>
            <form onSubmit={handleCreateVenue} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Ground / Arena Name</label>
                  <input
                    placeholder="e.g. City Sports Complex"
                    required
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>District / City</label>
                  <input
                    placeholder="e.g. Rajkot, Boston"
                    required
                    value={venueForm.district}
                    onChange={(e) => setVenueForm({ ...venueForm, district: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Full Address</label>
                <input
                  placeholder="Street address, landmarks..."
                  required
                  value={venueForm.address}
                  onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Supported Sports (comma separated)
                </label>
                <input
                  placeholder="e.g. FOOTBALL, CRICKET, BASKETBALL"
                  required
                  value={venueForm.supportedSports}
                  onChange={(e) => setVenueForm({ ...venueForm, supportedSports: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Contact Person</label>
                  <input
                    placeholder="Ground manager name"
                    value={venueForm.contactPerson}
                    onChange={(e) => setVenueForm({ ...venueForm, contactPerson: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Contact Phone</label>
                  <input
                    placeholder="+91 98765 43210"
                    value={venueForm.contactPhone}
                    onChange={(e) => setVenueForm({ ...venueForm, contactPhone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Facilities (comma separated)
                </label>
                <input
                  placeholder="Floodlights, Locker Rooms, Turf Pitch, Drinking Water"
                  value={venueForm.facilities}
                  onChange={(e) => setVenueForm({ ...venueForm, facilities: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px' }}
                >
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
