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
          'Registration submitted! Because you registered as an Organizer, your account is awaiting Administrator approval before you can host events.'
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
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, width: '100%' }}>
      <div
        style={{
          background: '#131b2e',
          border: '1px solid #24324f',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '32px' }}>📝</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', marginTop: 8 }}>
            Create Arena Elite Account
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 4 }}>
            Join as a Team Captain, Tournament Organizer, or Field Scorer
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: '14px',
              marginBottom: 20,
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Full Name</label>
            <input
              placeholder="e.g. Rahul Sharma"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Email Address</label>
            <input
              type="email"
              placeholder="rahul@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Phone</label>
              <input
                placeholder="+91 98765 43210"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>District / City</label>
              <input
                placeholder="e.g. Rajkot, Boston"
                required
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Role on Platform</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="CAPTAIN">⚽ Team Captain (Create squads & enter tournaments)</option>
              <option value="ORGANIZER">📋 Tournament Organizer (Host competitions)</option>
              <option value="SCORER">⏱️ Field Scorer (Live scoring console)</option>
            </select>
          </div>

          {form.role === 'ORGANIZER' && (
            <div>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                Organization / Academy / Club Name
              </label>
              <input
                placeholder="e.g. Saurashtra Youth League"
                required
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: 4, display: 'block' }}>
                * Organizer profiles require approval from the administrator before creating public tournaments.
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '15px',
              marginTop: 6,
            }}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}