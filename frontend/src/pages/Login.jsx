import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'ORGANIZER') navigate('/organizer/dashboard');
      else if (user.role === 'CAPTAIN') navigate('/captain/dashboard');
      else if (user.role === 'SCORER') navigate('/scorer/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div style={{ maxWidth: 460, margin: '60px auto', padding: 24, width: '100%' }}>
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
          <span style={{ fontSize: '32px' }}>🏆</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', marginTop: 8 }}>Arena Elite Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 4 }}>
            Sign in to access your administrative, organizer, or team dashboard
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. admin@arenaelite.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px' }}
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
              marginTop: 4,
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600 }}>
            Register here
          </Link>
        </p>

        {/* Demo Roles Quick Fill Buttons */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #24324f' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
            ⚡ Quick-Fill Demo Credentials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => setDemoUser('admin@arenaelite.com', 'Admin@123456')}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#c084fc', padding: '8px', fontSize: '12px', borderRadius: 6 }}
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('organizer@arenaelite.com', 'Organizer@123456')}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '8px', fontSize: '12px', borderRadius: 6 }}
            >
              📋 Organizer (Active)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('captain@arenaelite.com', 'Captain@123456')}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#34d399', padding: '8px', fontSize: '12px', borderRadius: 6 }}
            >
              ⚽ Team Captain
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('pending.org@arenaelite.com', 'Pending@123456')}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '8px', fontSize: '12px', borderRadius: 6 }}
            >
              ⏳ Pending Org (Test)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}