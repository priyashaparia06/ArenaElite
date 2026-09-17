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

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 20px', width: '100%' }}>
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
          <span style={{ fontSize: '36px' }}>🏆</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
            Sign In to Arena Elite
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Enter your email and password to access your portal
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0284c7', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}