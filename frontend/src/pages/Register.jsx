import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CAPTAIN',
    district: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const registeredUser = await register(form);

      if (form.role === 'ORGANIZER') {
        setSuccessMsg(
          'Registration submitted! Your organizer account is awaiting Administrator approval before you can host tournaments.'
        );
        setTimeout(() => navigate('/login'), 4000);
      } else {
        if (registeredUser.role === 'CAPTAIN') navigate('/captain/dashboard');
        else navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px', width: '100%' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 36,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: '36px' }}>📝</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
            Create Arena Elite Account
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Join as a Team Captain, Tournament Organizer, or Field Scorer
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: '14px',
              marginBottom: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: '14px',
              marginBottom: 20,
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Full Name
            </label>
            <input
              placeholder="e.g. Rahul Sharma"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="rahul@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Phone
              </label>
              <input
                placeholder="+91 98765 43210"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                District / City
              </label>
              <input
                placeholder="e.g. Rajkot, Boston"
                required
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Role on Platform
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            >
              <option value="CAPTAIN">⚽ Team Captain (Create squads & enter tournaments)</option>
              <option value="ORGANIZER">📋 Tournament Organizer (Host competitions)</option>
              <option value="SCORER">⏱️ Field Scorer (Live scoring console)</option>
            </select>
          </div>

          {form.role === 'ORGANIZER' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Organization / Academy / Club Name
              </label>
              <input
                placeholder="e.g. Saurashtra Youth League"
                required
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
              />
              <span style={{ fontSize: '12px', color: '#b45309', marginTop: 4, display: 'block' }}>
                * Organizer profiles require approval from the administrator before creating public tournaments.
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: '15px',
              marginTop: 6,
            }}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0284c7', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}