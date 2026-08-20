import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'CAPTAIN') navigate('/captain/dashboard');
      else if (user.role === 'ORGANIZER') navigate('/organizer/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'SCORER') navigate('/scorer/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: '50px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>ArenaElite Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 8 }} />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 8 }} />
        <button type="submit" style={{ padding: 10, background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4 }}>Log In</button>
      </form>
      <p style={{ marginTop: 15 }}>No account? <Link to="/register">Register here</Link></p>
    </div>
  );
}